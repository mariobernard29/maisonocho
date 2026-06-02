import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { order, items, isResend } = await request.json();

    if (!order || !items) {
      return NextResponse.json({ error: 'Missing order or items payload' }, { status: 400 });
    }

    // Parse product names list for WhatsApp templates
    const productListText = items
      .map((item: any) => {
        const variantsText = Object.keys(item.variant_choices || {}).length > 0
          ? ` (${Object.entries(item.variant_choices).map(([k, v]) => v).join(', ')})`
          : '';
        return `${item.quantity}x ${item.product_name}${variantsText}`;
      })
      .join(', ');

    // 1. WhatsApp Template Client Compiler
    const rawClientTemplate = 
      "¡Su pedido se ha realizado con éxito! ✨\n\nHola {nombre},\nTu pedido en *Maison VIII* ha sido registrado.\n\n*Pedido:* {productos}\n*Total:* ${total}\n*Entrega:* {fecha} en el horario de {hora}\n\n¡Gracias por elegir la distinción de Maison VIII! 🥐";
    
    const clientMessage = rawClientTemplate
      .replace(/{nombre}/g, order.client_name)
      .replace(/{productos}/g, productListText)
      .replace(/{total}/g, order.total.toFixed(2))
      .replace(/{fecha}/g, order.delivery_date)
      .replace(/{hora}/g, order.delivery_time_slot);

    // 2. WhatsApp Template Admin Compiler
    let cleanPhone = order.client_phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `52${cleanPhone}`;
    }
    const confirmText = `Hola ${order.client_name}, tu pedido ha sido confirmado y está en preparación para entrega el ${order.delivery_date} en el horario de ${order.delivery_time_slot}. ✨`;
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(confirmText)}`;

    const paymentMethodText = {
      efectivo: 'Efectivo (Pago contra entrega)',
      transferencia: 'Transferencia Bancaria',
      link_pago: 'Tarjeta (Link de pago)'
    }[order.payment_method as 'efectivo' | 'transferencia' | 'link_pago'] || order.payment_method || 'No especificado';

    const deliveryInstructions = order.delivery_instructions || 'Sin instrucciones adicionales';
    const notesText = order.notes ? `\n*Notas Especiales:* ${order.notes}\n` : '';

    const adminMessage = `🚨 *Nuevo pedido Maison VIII*

*Cliente:* ${order.client_name}
*Teléfono:* ${order.client_phone}
*Dirección:* ${order.delivery_address}
*Referencias:* ${deliveryInstructions}

*Pedido:* ${productListText}

*Desglose:*
- Subtotal: $${order.subtotal.toFixed(2)}
- Envío: $${order.delivery_fee.toFixed(2)}
- Total: $${order.total.toFixed(2)}

*Forma de Pago:* ${paymentMethodText}
*Entrega:* ${order.delivery_date} en el horario de ${order.delivery_time_slot}
${notesText}
*Confirmar pedido:*
${waLink}`;

    // 3. Trigger WhatsApp dispatch via YCloud or Twilio
    const ycloudApiKey = process.env.YCLOUD_API_KEY;
    const ycloudSender = process.env.YCLOUD_WHATSAPP_NUMBER; // e.g. +5266824214557
    const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || order.client_phone; // fallback to client for test

    const hasYcloud = ycloudApiKey && ycloudSender && !ycloudApiKey.includes('yourycloudapikey');
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioSender = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    const hasTwilio = twilioSid && twilioToken && !twilioSid.includes('yourtwiliosid');

    if (hasYcloud) {
      console.log('Sending real WhatsApp notifications via YCloud...');
      try {
        const ycloudTemplateName = process.env.YCLOUD_TEMPLATE_NAME;

        // Formulate Client Payload (Template or Text)
        let clientPayload: any = {
          from: ycloudSender,
          to: order.client_phone.startsWith('+') ? order.client_phone : `+52${order.client_phone}`
        };

        if (ycloudTemplateName) {
          clientPayload.type = 'template';
          clientPayload.template = {
            name: ycloudTemplateName,
            language: {
              code: 'es'
            },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: order.client_name },
                  { type: 'text', text: order.order_number },
                  { type: 'text', text: `$${order.total.toFixed(2)}` },
                  { type: 'text', text: order.delivery_date },
                  { type: 'text', text: order.delivery_time_slot }
                ]
              }
            ]
          };
        } else {
          clientPayload.type = 'text';
          clientPayload.text = {
            body: clientMessage
          };
        }

        // A. Send to Client
        const resClient = await fetch('https://api.ycloud.com/v2/whatsapp/messages/sendDirectly', {
          method: 'POST',
          headers: {
            'X-API-Key': ycloudApiKey,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(clientPayload)
        });
        const clientResult = await resClient.json();
        console.log('YCloud Client response:', clientResult);

        // B. Send to Admin (if not a simple client resend action)
        if (!isResend) {
          const resAdmin = await fetch('https://api.ycloud.com/v2/whatsapp/messages/sendDirectly', {
            method: 'POST',
            headers: {
              'X-API-Key': ycloudApiKey,
              'Content-Type': 'application/json',
              'accept': 'application/json'
            },
            body: JSON.stringify({
              from: ycloudSender,
              to: adminNumber.startsWith('+') ? adminNumber : `+52${adminNumber}`,
              type: 'text',
              text: {
                body: adminMessage
              }
            })
          });
          const adminResult = await resAdmin.json();
          console.log('YCloud Admin response:', adminResult);
        }
      } catch (err) {
        console.error('YCloud fetch dispatch failed:', err);
      }
    } else if (hasTwilio) {
      console.log('Sending real WhatsApp notifications via Twilio...');
      try {
        // We use native fetch to call Twilio REST API to avoid packaging errors
        const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        
        // A. Send to Client
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: twilioSender,
            To: `whatsapp:${order.client_phone}`,
            Body: clientMessage
          })
        });

        // B. Send to Admin (if not a simple client resend action)
        if (!isResend) {
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${basicAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              From: twilioSender,
              To: `whatsapp:${adminNumber}`,
              Body: adminMessage
            })
          });
        }
      } catch (err) {
        console.error('Twilio fetch dispatch failed:', err);
      }
    } else {
      // Elegant logging fallback in terminal
      console.log('\n======================================================');
      console.log('📬 [SANDBOX MOCK WHATSAPP NOTIFICATIONS DISPATCHED]');
      console.log('======================================================');
      console.log(`[CLIENT RECEIPT (To: ${order.client_phone})]:\n${clientMessage}`);
      console.log('------------------------------------------------------');
      console.log(`[ADMIN NOTIFICATION (To: ${adminNumber})]:\n${adminMessage}`);
      console.log('======================================================\n');
    }

    return NextResponse.json({
      success: true,
      ycloud_simulated: !hasYcloud,
      twilio_simulated: !hasTwilio,
      folio: order.order_number
    });

  } catch (err: any) {
    console.error('API Orders error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

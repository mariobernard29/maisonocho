import { NextResponse } from 'next/server';
import { db } from '../../../lib/supabase';

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

    // Fetch dynamic configuration settings
    const settings = await db.getSettings();
    const adminNumberRaw = settings.whatsapp_number_admin || process.env.ADMIN_WHATSAPP_NUMBER || '+525512345678';
    
    // Ensure admin phone starts with '+'
    const cleanAdminPhoneOnly = adminNumberRaw.replace(/\D/g, '');
    const adminNumber = `+${cleanAdminPhoneOnly}`;

    // Default templates if not configured
    const rawClientTemplate = settings.whatsapp_template_client || 
      "¡Hola {nombre}! Tu pedido #{folio} ha sido confirmado para entrega el {fecha} en el horario de {hora}. ✨\n\n*Contenido del pedido:*\n{productos}\n\n*Dirección de entrega:* {direccion}\n*Instrucciones de entrega:* {instrucciones}\n\n*Desglose:*\n- Subtotal: ${subtotal}\n- Envío: ${envio}\n- Total: ${total}\n\n¡Muchas gracias por elegir la distinción de Maison VIII! 🥐";

    const rawAdminTemplate = settings.whatsapp_template_admin || 
      "🚨 *Nuevo pedido Maison VIII* 🚨\n\n*Folio:* {folio}\n*Cliente:* {nombre}\n*Teléfono:* {telefono}\n*Fecha de Entrega:* {fecha}\n*Hora de Entrega:* {hora}\n*Lugar de Entrega:* {direccion}\n*Instrucciones:* {instrucciones}\n*Comentarios:* {comentarios}\n\n*Artículos:* \n{productos}\n\n*Desglose:*\n- Subtotal: ${subtotal}\n- Envío: ${envio}\n- Total: ${total}\n*Forma de Pago:* {forma_pago}\n\n👉 *Confirmar pedido (Click para abrir WhatsApp):*\n{waLink}";

    // Format phone number for WhatsApp link
    let cleanClientPhone = order.client_phone.replace(/\D/g, '');
    if (cleanClientPhone.length === 10) {
      cleanClientPhone = `52${cleanClientPhone}`;
    } else if (cleanClientPhone.length === 12 && cleanClientPhone.startsWith('521')) {
      cleanClientPhone = `52${cleanClientPhone.substring(3)}`;
    }

    const paymentMethodText = {
      efectivo: 'Efectivo (Pago contra entrega)',
      transferencia: 'Transferencia Bancaria',
      link_pago: 'Tarjeta (Link de pago)'
    }[order.payment_method as 'efectivo' | 'transferencia' | 'link_pago'] || order.payment_method || 'No especificado';

    const deliveryInstructions = order.delivery_instructions || 'Sin instrucciones adicionales';
    const notesText = order.notes || 'Sin comentarios adicionales';

    // Helper to replace all variables in a template
    const compileTemplate = (template: string, linkPlaceholder?: string) => {
      let resultText = template;
      if (!resultText.includes('{descuento_club}') && order.loyalty_discount && order.loyalty_discount > 0) {
        if (resultText.includes('- Total:')) {
          resultText = resultText.replace('- Total:', `- Descuento LE CLUB 8: -$${order.loyalty_discount.toFixed(2)}\n- Total:`);
        } else if (resultText.includes('*Desglose:*')) {
          resultText = resultText.replace('*Desglose:*', `*Desglose:*\n- Descuento LE CLUB 8: -$${order.loyalty_discount.toFixed(2)}`);
        }
      }

      return resultText
        .replace(/{nombre}/g, order.client_name || '')
        .replace(/{telefono}/g, order.client_phone || '')
        .replace(/{direccion}/g, order.delivery_address || '')
        .replace(/{instrucciones}/g, deliveryInstructions)
        .replace(/{comentarios}/g, notesText)
        .replace(/{productos}/g, productListText || '')
        .replace(/{folio}/g, order.order_number || '')
        .replace(/{subtotal}/g, (order.subtotal || 0).toFixed(2))
        .replace(/{envio}/g, (order.delivery_fee || 0).toFixed(2))
        .replace(/{total}/g, (order.total || 0).toFixed(2))
        .replace(/{descuento_club}/g, (order.loyalty_discount || 0).toFixed(2))
        .replace(/{recompensa_ganada}/g, (order.loyalty_earned || 0).toFixed(2))
        .replace(/{fecha}/g, order.delivery_date || '')
        .replace(/{hora}/g, order.delivery_time_slot || '')
        .replace(/{forma_pago}/g, paymentMethodText)
        .replace(/{waLink}/g, linkPlaceholder || '');
    };

    // 1. Compile Client Confirmation Message
    const clientMessage = compileTemplate(rawClientTemplate);
    
    // 2. Generate Clickable WhatsApp Link for client confirmation
    const waLink = `https://wa.me/${cleanClientPhone}?text=${encodeURIComponent(clientMessage)}`;

    // 3. Compile Admin Notification Message (with the link embedded)
    const adminMessage = compileTemplate(rawAdminTemplate, waLink);

    // 4. Trigger WhatsApp dispatch to admin via YCloud or Twilio
    const ycloudApiKey = process.env.YCLOUD_API_KEY;
    const ycloudSender = process.env.YCLOUD_WHATSAPP_NUMBER; // e.g. +5266824214557

    const hasYcloud = ycloudApiKey && ycloudSender && !ycloudApiKey.includes('yourycloudapikey');
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioSender = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    const hasTwilio = twilioSid && twilioToken && !twilioSid.includes('yourtwiliosid');

    if (hasYcloud) {
      console.log('Sending real WhatsApp admin notification via YCloud...');
      try {
        const resAdmin = await fetch('https://api.ycloud.com/v2/whatsapp/messages/sendDirectly', {
          method: 'POST',
          headers: {
            'X-API-Key': ycloudApiKey,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify({
            from: ycloudSender,
            to: adminNumber,
            type: 'text',
            text: {
              body: adminMessage
            }
          })
        });
        const adminResult = await resAdmin.json();
        console.log('YCloud Admin response:', adminResult);
      } catch (err) {
        console.error('YCloud fetch dispatch failed:', err);
      }
    } else if (hasTwilio) {
      console.log('Sending real WhatsApp admin notification via Twilio...');
      try {
        const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: twilioSender,
            To: adminNumber.startsWith('whatsapp:') ? adminNumber : `whatsapp:${adminNumber}`,
            Body: adminMessage
          })
        });
      } catch (err) {
        console.error('Twilio fetch dispatch failed:', err);
      }
    } else {
      // Elegant logging fallback in terminal
      console.log('\n======================================================');
      console.log('📬 [SANDBOX MOCK WHATSAPP NOTIFICATIONS DISPATCHED]');
      console.log('======================================================');
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

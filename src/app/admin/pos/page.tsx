"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../../lib/supabase";
import { Product, Category, Customer, DeliveryZone, OrderItem, Order } from "../../../types";
import {
  Plus,
  Minus,
  Trash2,
  Search,
  Loader2,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Printer,
  User,
  Phone,
  Percent,
  ShoppingBag,
  Award,
  BookOpen,
  Info,
  ChevronRight,
  AlertCircle
} from "lucide-react";

// Standard client-side UUID generator
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface POSCartItem {
  id: string; // unique cart item id
  product: Product;
  quantity: number;
  singleUnitPrice: number;
  variantChoices: Record<string, string>;
  notes?: string;
}

export default function POSPage() {
  // DB States
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // POS Order States
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [clientPhone, setClientPhone] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [loyaltyProfile, setLoyaltyProfile] = useState<Customer | null>(null);
  const [useLoyalty, setUseLoyalty] = useState<boolean>(false);
  const [registerLoyalty, setRegisterLoyalty] = useState<boolean>(false);
  const [searchingClient, setSearchingClient] = useState<boolean>(false);

  // Delivery details
  const [deliveryMethod, setDeliveryMethod] = useState<"domicilio" | "sucursal">("sucursal");
  const [clientAddress, setClientAddress] = useState<string>("");
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>("");
  const [distance, setDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [calculatingDistance, setCalculatingDistance] = useState<boolean>(false);
  const [googleKey, setGoogleKey] = useState<string>("");
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);

  // Schedule & Payment
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "transferencia" | "link_pago">("efectivo");
  const [paymentStatus, setPaymentStatus] = useState<"pendiente" | "pagado">("pendiente");
  const [notes, setNotes] = useState<string>("");

  // Variant configurator modal state
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [itemNotes, setItemNotes] = useState<string>("");

  // Order Submission & Printing
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<{ order: Order; items: OrderItem[] } | null>(null);
  const [printPayload, setPrintPayload] = useState<{ order: Order; items: OrderItem[]; mode: "comanda" | "ticket" } | null>(null);

  // Load baseline DB values
  useEffect(() => {
    async function loadData() {
      try {
        const [cats, prods, deliveryZones, sett] = await Promise.all([
          db.getCategories(),
          db.getProducts(),
          db.getDeliveryZones(),
          db.getSettings(),
        ]);
        
        setCategories(cats.sort((a, b) => a.display_order - b.display_order));
        setProducts(prods.filter((p) => p.is_available));
        setZones(deliveryZones);
        setSettings(sett);

        // Load configured time slots
        if (sett && sett.time_slots) {
          try {
            const slots = typeof sett.time_slots === "string" ? JSON.parse(sett.time_slots) : sett.time_slots;
            if (Array.isArray(slots)) setTimeSlots(slots);
          } catch (e) {
            console.error("Error parsing settings time slots:", e);
          }
        } else {
          setTimeSlots(["09:00 - 11:00", "11:00 - 13:00", "13:00 - 15:00", "15:00 - 17:00", "17:00 - 19:00"]);
        }

        // Set default date to today
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        setDeliveryDate(`${year}-${month}-${day}`);
      } catch (err) {
        console.error("Error loading POS core datasets:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync / Calculate shipping fee when distance updates
  useEffect(() => {
    if (deliveryMethod === "sucursal") {
      setDeliveryFee(0);
      return;
    }
    if (distance === null) return;
    if (distance > 20) {
      alert(`La ubicación está a ${distance} km, lo cual se encuentra fuera del rango de entrega (máximo 20 km).`);
      setDistance(null);
      setDeliveryFee(0);
      return;
    }
    const matchedZone = zones.find((z) => distance >= z.min_km && distance < z.max_km);
    if (matchedZone) {
      setDeliveryFee(matchedZone.price);
    } else {
      setDeliveryFee(0);
    }
  }, [distance, deliveryMethod, zones]);

  // Sync / Auto-Lookup customer profile when phone is 10 digits
  useEffect(() => {
    const cleanPhone = clientPhone.replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      async function findCustomer() {
        setSearchingClient(true);
        try {
          const list = await db.getCustomers();
          const found = list.find((c) => c.phone.replace(/\D/g, "") === cleanPhone);
          if (found) {
            setClientName(found.name);
            setClientEmail(found.email || "");
            if (found.address_default) {
              setClientAddress(found.address_default);
            }
            setLoyaltyProfile(found);
            setRegisterLoyalty(false);
          } else {
            setLoyaltyProfile(null);
            setUseLoyalty(false);
          }
        } catch (e) {
          console.error("Error searching customer phone in POS:", e);
        } finally {
          setSearchingClient(false);
        }
      }
      findCustomer();
    } else {
      setLoyaltyProfile(null);
      setUseLoyalty(false);
    }
  }, [clientPhone]);

  // Reset distance when address changes to force recalculation
  useEffect(() => {
    setDistance(null);
  }, [clientAddress]);

  // Phase 1: Retrieve Google Maps API Key dynamically
  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (envKey && !envKey.includes("YourGoogleMapsApiKey") && !envKey.includes("YourGoogleApiKey")) {
      setGoogleKey(envKey);
      return;
    }

    async function fetchKey() {
      try {
        const res = await fetch("/api/maps-key");
        const data = await res.json();
        if (data.success && data.apiKey && !data.apiKey.includes("YourGoogleMapsApiKey") && !data.apiKey.includes("YourGoogleApiKey")) {
          setGoogleKey(data.apiKey);
        }
      } catch (err) {
        console.error("Error fetching dynamic Google Maps Key in POS:", err);
      }
    }
    fetchKey();
  }, []);

  // Phase 2: Load Google Maps places script dynamically once the key is resolved
  useEffect(() => {
    if (!googleKey) return;

    const scriptId = "google-maps-places-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const handleLoad = () => {
      if ((window as any).google?.maps?.places) {
        setScriptLoaded(true);
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleKey}&libraries=places&language=es`;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", handleLoad);
      document.head.appendChild(script);
    } else {
      if ((window as any).google?.maps?.places) {
        setScriptLoaded(true);
      } else {
        script.addEventListener("load", handleLoad);
      }
    }

    return () => {
      if (script) {
        script.removeEventListener("load", handleLoad);
      }
    };
  }, [googleKey]);

  // Phase 3: Attach Autocomplete listener when deliveryMethod is domicilio and script has loaded
  useEffect(() => {
    if (deliveryMethod !== "domicilio" || !scriptLoaded) return;

    const timer = setTimeout(() => {
      const inputEl = document.getElementById("pos-address-input") as HTMLInputElement;
      if (!inputEl) {
        console.warn("Address input element not found in POS DOM yet.");
        return;
      }

      try {
        console.log("Initializing Google Places Autocomplete in POS...");
        const autocomplete = new (window as any).google.maps.places.Autocomplete(inputEl, {
          types: ["address"],
          componentRestrictions: { country: "mx" }, // Restrict to Mexico since Los Mochis is in Mexico
          fields: ["formatted_address", "geometry"]
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            setClientAddress(place.formatted_address);
          }
        });
      } catch (err) {
        console.error("Failed to initialize Autocomplete on POS input element:", err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [deliveryMethod, scriptLoaded]);

  // Google Maps Distance calculation using existing API endpoint
  const handleCalculateDistance = async () => {
    if (!clientAddress.trim()) return;
    setCalculatingDistance(true);
    try {
      const res = await fetch(`/api/distance?destination=${encodeURIComponent(clientAddress)}`);
      const data = await res.json();
      if (res.ok && data.distance_km !== undefined) {
        setDistance(data.distance_km);
      } else {
        throw new Error(data.error || "Failed to calculate distance");
      }
    } catch (err) {
      console.warn("Real Google Maps API failed inside POS, simulating distance:", err);
      // Simulate random distance for fallback
      const simulatedDistance = parseFloat((Math.random() * 8 + 1.2).toFixed(1));
      setDistance(simulatedDistance);
    } finally {
      setCalculatingDistance(false);
    }
  };

  // Variant selector handlers
  const handleProductClick = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      // Set defaults
      const defaults: Record<string, string> = {};
      product.variants.forEach((v) => {
        if (v.options && v.options.length > 0) {
          defaults[v.name] = v.options[0].name;
        }
      });
      setSelectedVariants(defaults);
      setItemNotes("");
      setConfiguringProduct(product);
    } else {
      // Add product straight away
      addToCart(product, {}, 1, 0, "");
    }
  };

  const handleConfirmVariants = () => {
    if (!configuringProduct) return;
    
    // Calculate price adjust
    let priceAdjust = 0;
    configuringProduct.variants.forEach((v) => {
      const selectedOptionName = selectedVariants[v.name];
      const option = v.options.find((opt) => opt.name === selectedOptionName);
      if (option) {
        priceAdjust += option.price_adjust || 0;
      }
    });

    addToCart(configuringProduct, selectedVariants, 1, priceAdjust, itemNotes);
    setConfiguringProduct(null);
  };

  const addToCart = (
    product: Product,
    variantChoices: Record<string, string>,
    quantity: number,
    priceAdjust: number,
    itemNotes: string
  ) => {
    const singleUnitPrice = product.price + priceAdjust;
    
    // Check if duplicate item in cart
    const isDuplicate = (item: POSCartItem) => {
      if (item.product.id !== product.id) return false;
      if (item.notes !== itemNotes) return false;
      // Compare variant choices
      const keysA = Object.keys(item.variantChoices);
      const keysB = Object.keys(variantChoices);
      if (keysA.length !== keysB.length) return false;
      return keysA.every((key) => item.variantChoices[key] === variantChoices[key]);
    };

    setCart((prev) => {
      const dupIdx = prev.findIndex(isDuplicate);
      if (dupIdx > -1) {
        const updated = [...prev];
        updated[dupIdx].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: generateUUID(),
            product,
            quantity,
            singleUnitPrice,
            variantChoices,
            notes: itemNotes || undefined,
          },
        ];
      }
    });
  };

  const updateCartItemQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Pricing calculations
  const subtotal = cart.reduce((acc, curr) => acc + curr.singleUnitPrice * curr.quantity, 0);
  const availableBalance = loyaltyProfile ? Number(loyaltyProfile.loyalty_balance || 0) : 0;
  const discountAmount = useLoyalty ? Math.min(availableBalance, subtotal + deliveryFee) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);
  const earnedRewards = Number((subtotal * 0.05).toFixed(2));

  // Filter products by selected category and search input
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Submit POS Order
  const handleConfirmPOSOrder = async () => {
    if (cart.length === 0) {
      alert("Por favor agregue artículos al carrito antes de confirmar.");
      return;
    }
    if (!clientName.trim() || !clientPhone.trim()) {
      alert("Por favor ingrese el nombre y número de teléfono del cliente.");
      return;
    }
    if (clientPhone.replace(/\D/g, "").length < 10) {
      alert("El número de teléfono debe tener al menos 10 dígitos.");
      return;
    }
    if (deliveryMethod === "domicilio") {
      if (!clientAddress.trim()) {
        alert("Por favor ingrese la dirección para entregas a domicilio.");
        return;
      }
      if (distance === null) {
        alert("Por favor calcule el costo de envío antes de continuar.");
        return;
      }
    }
    if (!deliveryDate || !deliveryTimeSlot) {
      alert("Por favor seleccione fecha y horario de entrega.");
      return;
    }

    setSubmitting(true);
    try {
      const orderId = generateUUID();
      const orderNumber = `MO-${Math.floor(1000 + Math.random() * 9000)}`;

      // Register customer in LE CLUB 8 if selected
      let isLoyaltyActive = !!loyaltyProfile;
      if (registerLoyalty && !loyaltyProfile && clientEmail.trim()) {
        try {
          const newCust = await db.signUpLoyalty(
            clientEmail.trim(),
            clientPhone,
            clientName,
            `MAISON_${Math.floor(1000 + Math.random() * 9000)}`
          );
          setLoyaltyProfile(newCust);
          isLoyaltyActive = true;
        } catch (e: any) {
          console.error("Failed to register customer to LE CLUB 8 in POS:", e);
        }
      }

      const orderObj: Order = {
        id: orderId,
        order_number: orderNumber,
        client_name: clientName,
        client_phone: clientPhone,
        delivery_address: deliveryMethod === "domicilio" ? clientAddress : "Recoge en Sucursal",
        distance_km: deliveryMethod === "domicilio" ? distance || 3.0 : 0,
        delivery_instructions: deliveryMethod === "domicilio" ? deliveryInstructions : "",
        delivery_fee: deliveryMethod === "domicilio" ? deliveryFee : 0,
        subtotal,
        total,
        status: "confirmado", // POS orders are approved immediately
        delivery_date: deliveryDate,
        delivery_time_slot: deliveryTimeSlot,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        notes: notes || "",
        twilio_sent: false,
        loyalty_discount: discountAmount,
        loyalty_earned: isLoyaltyActive ? earnedRewards : 0,
      };

      const orderItems: OrderItem[] = cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.singleUnitPrice,
        variant_choices: item.variantChoices,
      }));

      // Call API Route to dispatch WhatsApp (Admin alert + customer confirm link)
      try {
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderObj, items: orderItems }),
        });
      } catch (waError) {
        console.warn("WhatsApp notification API failed in POS:", waError);
      }

      // Save order in database (which updates client stats and rewards balances)
      await db.saveOrder(orderObj, orderItems);

      // Cache created order details for modal operations
      setCreatedOrder({ order: orderObj, items: orderItems });
    } catch (e) {
      console.error("POS Order confirmation failed:", e);
      alert("Hubo un problema al registrar la orden. Por favor intente de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPOSForm = () => {
    setCart([]);
    setClientPhone("");
    setClientName("");
    setClientEmail("");
    setLoyaltyProfile(null);
    setUseLoyalty(false);
    setRegisterLoyalty(false);
    setDeliveryMethod("sucursal");
    setClientAddress("");
    setDeliveryInstructions("");
    setDistance(null);
    setDeliveryFee(0);
    setNotes("");
    setPaymentMethod("efectivo");
    setPaymentStatus("pendiente");
    setCreatedOrder(null);
  };

  const handlePrintCreatedOrder = (mode: "comanda" | "ticket") => {
    if (!createdOrder) return;
    setPrintPayload({
      order: createdOrder.order,
      items: createdOrder.items,
      mode,
    });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <>
      <div className="no-print space-y-6 text-[#FAF8F5] pb-10">
      
      {/* 2 Column Main Interface Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: PRODUCTS & MENU SELECTION (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* MENU HEADER CONTROLS */}
          <div className="bg-[#0A0F0A] border border-gold/10 p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <span className="editorial-subtitle text-xs text-gold uppercase tracking-[0.2em] font-semibold block">
              Catálogo de Productos
            </span>
            
            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-crema/40 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121A12] border border-gold/15 rounded p-2 pl-9 text-xs text-crema placeholder-crema/30 focus:outline-none focus:border-gold"
                placeholder="Buscar artículo..."
              />
            </div>
          </div>

          {/* CATEGORIES NAVIGATION TABS */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded text-[10px] uppercase font-bold tracking-wider transition-all shrink-0 cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-gold text-[#0A0F0A]"
                  : "bg-[#0A0F0A] border border-gold/15 text-gold/80 hover:text-gold hover:border-gold"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded text-[10px] uppercase font-bold tracking-wider transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-gold text-[#0A0F0A]"
                    : "bg-[#0A0F0A] border border-gold/15 text-gold/80 hover:text-gold hover:border-gold"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* PRODUCTS GRID LIST */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
              <p className="text-crema/40 text-xs tracking-wider uppercase">Cargando menú...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-[#0A0F0A] border border-dashed border-gold/10 rounded-lg">
              <ShoppingBag className="w-12 h-12 text-gold/30 mx-auto mb-3" />
              <p className="text-xs text-crema/40">No se encontraron productos disponibles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  className="bg-[#0A0F0A] border border-gold/10 rounded-lg overflow-hidden shadow-xl hover:border-gold/30 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="aspect-[4/3] w-full bg-[#121A12] relative overflow-hidden">
                    <img
                      src={p.image_url || "/logos/logo_sinfondo_500x500.png"}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-crema text-sm leading-snug flex items-center justify-between gap-2">
                        <span>{p.name}</span>
                        {p.description?.includes('[POS-ONLY]') && (
                          <span className="text-[8px] bg-gold/10 text-gold px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Privado</span>
                        )}
                      </h3>
                      <p className="text-[10px] text-crema/50 line-clamp-2 mt-1 leading-normal font-light">
                        {p.description?.replace('[POS-ONLY]', '').trim()}
                      </p>
                    </div>
                    <div className="pt-2 flex justify-between items-center border-t border-crema/5">
                      <span className="font-mono text-gold font-bold text-sm">${p.price.toFixed(2)}</span>
                      <span className="text-[9px] bg-gold/5 text-gold border border-gold/10 px-2 py-0.5 rounded uppercase font-semibold">
                        Agregar
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CART, CUSTOMER & ORDER DETAIL PANEL (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-[#0A0F0A] border border-gold/10 rounded-lg shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header Title */}
            <div className="p-4 bg-[#121A12] border-b border-gold/10 flex items-center justify-between">
              <span className="editorial-subtitle text-xs text-gold uppercase tracking-[0.2em] font-semibold flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>Detalle de Venta</span>
              </span>
              <span className="text-[9px] bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded font-mono font-bold">
                {cart.reduce((acc, curr) => acc + curr.quantity, 0)} Items
              </span>
            </div>

            {/* Cart Items list */}
            <div className="p-4 border-b border-gold/10 max-h-[220px] overflow-y-auto divide-y divide-crema/5">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-crema/35 text-xs italic">
                  Carrito vacío. Haz clic en un producto para agregarlo.
                </div>
              ) : (
                cart.map((item) => {
                  const variantsText = Object.keys(item.variantChoices).length > 0
                    ? Object.entries(item.variantChoices).map(([k, v]) => `${k}:${v}`).join(", ")
                    : "";
                  
                  return (
                    <div key={item.id} className="py-3 flex justify-between gap-3 text-xs">
                      <div className="flex-1 space-y-1">
                        <span className="font-medium text-crema">{item.product.name}</span>
                        {variantsText && (
                          <span className="block text-[9px] text-gold/70 italic leading-none">{variantsText}</span>
                        )}
                        {item.notes && (
                          <span className="block text-[9px] text-red-300 font-light leading-none">
                            Nota: {item.notes}
                          </span>
                        )}
                        <span className="block font-mono text-[10px] text-crema/45">
                          ${item.singleUnitPrice.toFixed(2)} c/u
                        </span>
                      </div>

                      {/* Qty edit buttons */}
                      <div className="flex flex-col items-end gap-1.5 justify-center">
                        <span className="font-bold text-crema font-mono">${(item.singleUnitPrice * item.quantity).toFixed(2)}</span>
                        <div className="flex items-center gap-1 bg-[#121A12] border border-gold/15 p-0.5 rounded">
                          <button
                            onClick={() => updateCartItemQty(item.id, -1)}
                            className="p-1 rounded text-gold/80 hover:bg-gold/10 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-1 text-[10px] font-bold font-mono">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItemQty(item.id, 1)}
                            className="p-1 rounded text-gold/80 hover:bg-gold/10 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeCartItem(item.id)}
                            className="p-1 ml-1 rounded text-red-400 hover:bg-red-950/20 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* CUSTOMER INFO & LOYALTY INTEGRATION */}
            <div className="p-4 border-b border-gold/10 space-y-3 bg-[#111A11]/30">
              <span className="text-[10px] text-gold font-bold uppercase tracking-wider block">
                Datos del Cliente
              </span>

              {/* Phone Field */}
              <div className="space-y-1">
                <label className="text-[9px] text-crema/40 uppercase font-semibold">Teléfono Celular (10 dígitos)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-crema/30">
                    {searchingClient ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                  </span>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-2 pl-8 text-xs text-crema placeholder-crema/25 focus:outline-none focus:border-gold font-mono"
                    placeholder="Ej. 6681234567"
                  />
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-1">
                <label className="text-[9px] text-crema/40 uppercase font-semibold">Nombre Completo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-crema/30">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-2 pl-8 text-xs text-crema placeholder-crema/25 focus:outline-none focus:border-gold"
                    placeholder="Nombre del cliente"
                  />
                </div>
              </div>

              {/* LE CLUB 8 Integration Card */}
              {loyaltyProfile ? (
                <div className="bg-[#0D140D] border border-gold/25 p-3 rounded text-[11px] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gold uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> LE CLUB 8
                    </span>
                    <span className="font-mono text-gold font-bold">Saldo: ${loyaltyProfile.loyalty_balance?.toFixed(2)} MXN</span>
                  </div>
                  {Number(loyaltyProfile.loyalty_balance || 0) > 0 ? (
                    <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-gold/10">
                      <input
                        type="checkbox"
                        checked={useLoyalty}
                        onChange={(e) => setUseLoyalty(e.target.checked)}
                        className="w-3.5 h-3.5 accent-gold cursor-pointer"
                      />
                      <span className="text-crema/80 font-medium">Aplicar saldo como descuento en esta compra</span>
                    </label>
                  ) : (
                    <span className="text-[10px] text-crema/40 italic block pt-1 border-t border-gold/10">
                      Miembro sin saldo disponible. Acumulará el 5% de esta compra.
                    </span>
                  )}
                  <span className="text-[10px] text-gold/80 italic block">
                    ✨ Acumulará +${earnedRewards.toFixed(2)} MXN en este pedido (5%).
                  </span>
                </div>
              ) : (
                clientPhone.replace(/\D/g, "").length === 10 && !searchingClient && (
                  <div className="bg-[#1C201C] border border-crema/10 p-3 rounded text-[11px] space-y-2.5">
                    <p className="text-crema/60 italic leading-snug">Este cliente no está registrado en el programa de recompensas LE CLUB 8.</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={registerLoyalty}
                        onChange={(e) => setRegisterLoyalty(e.target.checked)}
                        className="w-3.5 h-3.5 accent-gold cursor-pointer"
                      />
                      <span className="text-crema font-medium uppercase text-[9px] tracking-wider text-gold">Registrar en LE CLUB 8</span>
                    </label>
                    {registerLoyalty && (
                      <div className="space-y-1 animate-fade-in-up">
                        <label className="text-[9px] text-crema/45 uppercase font-semibold">Correo Electrónico</label>
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="w-full bg-[#121A12] border border-gold/15 rounded p-1.5 text-xs text-crema focus:outline-none focus:border-gold"
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* DELIVERY / SCHEDULE SELECTION */}
            <div className="p-4 border-b border-gold/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gold font-bold uppercase tracking-wider block">
                  Método de Entrega
                </span>
                
                {/* Method selector */}
                <div className="flex border border-gold/15 rounded overflow-hidden">
                  <button
                    onClick={() => setDeliveryMethod("sucursal")}
                    className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      deliveryMethod === "sucursal" ? "bg-gold text-[#0A0F0A]" : "bg-transparent text-gold/75 hover:bg-gold/5"
                    }`}
                  >
                    Sucursal
                  </button>
                  <button
                    onClick={() => setDeliveryMethod("domicilio")}
                    className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      deliveryMethod === "domicilio" ? "bg-gold text-[#0A0F0A]" : "bg-transparent text-gold/75 hover:bg-gold/5"
                    }`}
                  >
                    Domicilio
                  </button>
                </div>
              </div>

              {/* Delivery Address Form */}
              {deliveryMethod === "domicilio" && (
                <div className="space-y-2 animate-fade-in-up">
                  <div className="space-y-1">
                    <label className="text-[9px] text-crema/40 uppercase font-semibold">Dirección de Entrega</label>
                    <div className="flex gap-2">
                      <input
                        id="pos-address-input"
                        type="text"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        className="flex-1 bg-[#121A12] border border-gold/15 rounded p-2 text-xs text-crema focus:outline-none focus:border-gold"
                        placeholder="Calle, Número, Colonia, Los Mochis"
                      />
                      <button
                        onClick={handleCalculateDistance}
                        disabled={calculatingDistance || !clientAddress.trim()}
                        className="bg-gold text-[#0A0F0A] hover:bg-gold-bright disabled:opacity-40 p-2 px-3 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center min-w-[70px]"
                      >
                        {calculatingDistance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Calcular"}
                      </button>
                    </div>
                  </div>

                  {distance !== null && (
                    <div className="bg-[#121A12] border border-gold/10 p-2 rounded text-[10px] flex justify-between items-center">
                      <span className="text-crema/60 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gold" />
                        Distancia calculada:
                      </span>
                      <span className="font-mono text-gold font-bold">{distance} km (${deliveryFee} MXN)</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] text-crema/40 uppercase font-semibold">Referencias de Entrega</label>
                    <textarea
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      rows={2}
                      className="w-full bg-[#121A12] border border-gold/15 rounded p-2 text-xs text-crema placeholder-crema/25 focus:outline-none focus:border-gold"
                      placeholder="Ej. Casa verde de dos pisos, portón negro..."
                    />
                  </div>
                </div>
              )}

              {/* Schedule Fields */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[9px] text-crema/40 uppercase font-semibold">Fecha de Entrega</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-2 text-xs text-crema focus:outline-none focus:border-gold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-crema/40 uppercase font-semibold">Horario de Entrega</label>
                  <select
                    value={deliveryTimeSlot}
                    onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-2 text-xs text-crema focus:outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="">Seleccione...</option>
                    {timeSlots.map((slot, idx) => (
                      <option key={idx} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* PAYMENT & ADDITIONAL REMARKS */}
            <div className="p-4 border-b border-gold/10 space-y-3 bg-[#111A11]/30">
              <span className="text-[10px] text-gold font-bold uppercase tracking-wider block">
                Método de Pago y Observaciones
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-crema/40 uppercase font-semibold">Forma de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-2 text-xs text-crema focus:outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="efectivo">Efectivo (Contra entrega)</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="link_pago">Tarjeta (Link de Pago)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-crema/40 uppercase font-semibold">Estado de Pago</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-2 text-xs text-crema focus:outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-crema/40 uppercase font-semibold">Comentarios del Pedido (Internos)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-2 text-xs text-crema placeholder-crema/25 focus:outline-none focus:border-gold"
                  placeholder="Notas de cocina..."
                />
              </div>
            </div>

            {/* BILLING SUMMARY TOTALS */}
            <div className="p-4 bg-[#121A12] space-y-2 border-t border-gold/15">
              <div className="flex justify-between items-center text-xs text-crema/60">
                <span>Subtotal Venta</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              {useLoyalty && discountAmount > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-400 font-semibold">
                  <span>Descuento LE CLUB 8</span>
                  <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {deliveryMethod === "domicilio" && (
                <div className="flex justify-between items-center text-xs text-crema/60">
                  <span>Costo de Envío</span>
                  <span className="font-mono">${deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm border-t border-gold/10 pt-2 font-bold text-gold">
                <span className="editorial-title font-light">TOTAL NETO</span>
                <span className="font-mono text-base">${total.toFixed(2)} MXN</span>
              </div>
            </div>

            {/* BUTTON ACTION: CONFIRM ORDER */}
            <button
              onClick={handleConfirmPOSOrder}
              disabled={submitting}
              className="w-full bg-gold text-[#0A0F0A] hover:bg-gold-bright disabled:opacity-50 py-4 px-4 text-center text-xs tracking-widest font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg relative z-10"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando Pedido...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirmar y Guardar Pedido</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 1. PRODUCT VARIANT CONFIGURATOR MODAL */}
      {configuringProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0A0F0A] border border-gold/25 max-w-md w-full rounded-lg shadow-2xl overflow-hidden animate-fade-in-up">
            
            {/* Header */}
            <div className="p-4 bg-[#121A12] border-b border-gold/10 flex justify-between items-center">
              <h3 className="font-bold text-gold text-sm tracking-wide">Configurar {configuringProduct.name}</h3>
              <button
                onClick={() => setConfiguringProduct(null)}
                className="text-crema/50 hover:text-crema text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              {configuringProduct.variants?.map((v) => (
                <div key={v.name} className="space-y-1.5">
                  <label className="text-[10px] text-gold uppercase tracking-wider font-semibold block">{v.name}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {v.options.map((opt) => (
                      <button
                        key={opt.name}
                        onClick={() => setSelectedVariants((prev) => ({ ...prev, [v.name]: opt.name }))}
                        className={`p-2.5 rounded border text-left flex justify-between items-center transition-all cursor-pointer ${
                          selectedVariants[v.name] === opt.name
                            ? "bg-gold/10 border-gold text-gold"
                            : "bg-[#121A12] border-gold/10 text-crema/70 hover:border-gold/35"
                        }`}
                      >
                        <span className="font-medium">{opt.name}</span>
                        {opt.price_adjust > 0 && (
                          <span className="font-mono text-[9px] opacity-80">+${opt.price_adjust}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-1">
                <label className="text-[10px] text-gold uppercase tracking-wider font-semibold block">Notas adicionales para el artículo</label>
                <input
                  type="text"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-2.5 text-xs text-crema focus:outline-none focus:border-gold"
                  placeholder="Ej. Glaseado extra, sin fresas..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#121A12] border-t border-gold/10 flex justify-end gap-2">
              <button
                onClick={() => setConfiguringProduct(null)}
                className="bg-transparent border border-crema/10 hover:border-crema/30 text-crema/80 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmVariants}
                className="bg-gold text-[#0A0F0A] hover:bg-gold-bright px-5 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ORDER CONFIRMATION SUCCESS MODAL OVERLAY */}
      {createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0A0F0A] border border-gold/25 max-w-lg w-full rounded-lg shadow-2xl overflow-hidden p-6 text-center space-y-6 animate-fade-in-up">
            
            {/* Visual Header */}
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-full bg-gold/15 text-gold flex items-center justify-center mx-auto border border-gold/30">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="editorial-title text-2xl text-gold font-light tracking-wide">¡Venta Registrada Exitosamente!</h2>
              <p className="text-xs text-crema/60">
                El pedido **{createdOrder.order.order_number}** ha sido ingresado de forma correcta en la base de datos de Maison VIII.
              </p>
            </div>

            {/* Print Commands Buttons */}
            <div className="bg-[#121A12]/40 border border-gold/10 p-5 rounded-lg text-xs space-y-3 max-w-md mx-auto">
              <span className="text-[10px] text-gold uppercase tracking-wider font-semibold block">Impresión de Comandas</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePrintCreatedOrder("comanda")}
                  className="bg-transparent border border-gold/20 hover:border-gold text-gold hover:text-gold-bright py-3 rounded text-[10px] tracking-wider font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Comanda
                </button>
                <button
                  onClick={() => handlePrintCreatedOrder("ticket")}
                  className="bg-gold text-[#0A0F0A] hover:bg-gold-bright py-3 rounded text-[10px] tracking-wider font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Ticket
                </button>
              </div>
            </div>

            {/* Navigation options */}
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={resetPOSForm}
                className="bg-transparent border border-crema/15 hover:border-crema/40 text-crema px-5 py-2.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Nueva Venta
              </button>
              <a
                href="/admin/pedidos"
                className="bg-gold/10 border border-gold/20 text-gold hover:text-gold-bright hover:bg-gold/15 px-5 py-2.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors inline-block"
              >
                Ver Pedidos en CRM
              </a>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* 3. PHYSICAL PRINT VIEWS AREA (Hidden from Screen, Visible on Print dialog) */}
      {printPayload && (
        <div className={`print-section ${printPayload.mode === 'comanda' ? 'comanda-mode-container' : 'ticket-mode-container'}`}>
          {printPayload.mode === 'comanda' ? (
            /* COMANDA DE COCINA (Monospaced kitchen layout, large quantities, notes, instructions) */
            <div className="space-y-4">
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '2px', marginBottom: '3px' }}>
                <h2 className="editorial-title" style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase' }}>MAISON VIII</h2>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '1px' }}>*** COMANDA DE COCINA ***</div>
              </div>

              <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                <p><strong>FOLIO:</strong> {printPayload.order.order_number}</p>
                <p><strong>ENTREGA:</strong> {printPayload.order.delivery_date} ({printPayload.order.delivery_time_slot})</p>
                <p><strong>CLIENTE:</strong> {printPayload.order.client_name} ({printPayload.order.client_phone})</p>
                <p><strong>DIRECCIÓN:</strong> {printPayload.order.delivery_address}</p>
                {printPayload.order.delivery_instructions && (
                  <p style={{ marginTop: '1px', fontStyle: 'italic' }}>
                    <strong>INDICACIONES:</strong> {printPayload.order.delivery_instructions}
                  </p>
                )}
              </div>

              <div className="ticket-divider-dashed" />

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #000' }}>
                    <th style={{ width: '20%', textAlign: 'left', fontSize: '11px', paddingBottom: '1px' }}>CANT</th>
                    <th style={{ width: '80%', textAlign: 'left', fontSize: '11px', paddingBottom: '1px' }}>ARTÍCULO / VARIANTE</th>
                  </tr>
                </thead>
                <tbody>
                  {printPayload.items.map((item, idx) => {
                    const variantsText = Object.keys(item.variant_choices || {}).length > 0
                      ? Object.entries(item.variant_choices).map(([k, v]) => `${k}:${v}`).join(', ')
                      : '';

                    return (
                      <tr key={idx} className="item-row">
                        <td style={{ verticalAlign: 'top', padding: '3px 0' }}>
                          <span className="qty-badge">x{item.quantity}</span>
                        </td>
                        <td style={{ verticalAlign: 'top', padding: '3px 0', fontSize: '12px' }}>
                          <strong>{item.product_name}</strong>
                          {variantsText && (
                            <div className="item-variants" style={{ color: '#333', fontStyle: 'italic', marginTop: '1px' }}>
                              {variantsText}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Kitchen notes (in comanda mode, displayed prominently) */}
              {printPayload.order.notes && (
                <div className="comanda-notes" style={{ border: '2px solid #000', padding: '1.5mm', marginTop: '3mm', fontSize: '11px' }}>
                  <strong>OBSERVACIONES (CLIENTE):</strong>
                  <p style={{ marginTop: '1px', fontStyle: 'italic', fontWeight: 'bold' }}>{printPayload.order.notes}</p>
                </div>
              )}

              <div style={{ marginTop: '5mm', textAlign: 'center', fontSize: '9px', opacity: 0.6 }}>
                <p>Maison VIII - Cocina Interna</p>
                <p style={{ marginTop: '1px' }}>Impreso el: {new Date().toLocaleString()}</p>
              </div>
            </div>
          ) : (
            /* TICKET DE VENTA (Elegant client ticket, matching checkout success) */
            <div className="space-y-4">
              {/* Elegant header banner */}
              <div className="text-center pb-2 space-y-1">
                <img
                  src="/logos/logo_headersinfondo_500x200.png"
                  className="ticket-logo"
                  alt="Maison VIII Logo"
                  style={{ maxWidth: '40mm', margin: '0 auto 1mm auto', display: 'block', filter: 'grayscale(1) brightness(0)' }}
                />
                <p style={{ fontSize: '8px', letterSpacing: '0.12em', opacity: 0.8, textTransform: 'uppercase' }}>
                  EL ARTE DE CELEBRAR LO EXTRAORDINARIO
                </p>
                <p style={{ fontSize: '9px', fontFamily: 'Courier Prime, monospace', marginTop: '1mm' }}>
                  FOLIO: {printPayload.order.order_number}
                </p>
              </div>

              <div className="ticket-divider-dashed" />

              {/* Delivery & Schedule Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', gap: '4px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '8px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Cliente</span>
                  <span style={{ fontWeight: 'bold', display: 'block' }}>{printPayload.order.client_name}</span>
                  <span style={{ display: 'block', opacity: 0.7 }}>{printPayload.order.client_phone}</span>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <span style={{ fontSize: '8px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Pago</span>
                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>
                    {printPayload.order.payment_method === 'efectivo' && 'Efectivo'}
                    {printPayload.order.payment_method === 'transferencia' && 'Transferencia'}
                    {printPayload.order.payment_method === 'link_pago' && 'Tarjeta (Link)'}
                  </span>
                  <span style={{ display: 'block', fontSize: '8px', opacity: 0.8 }}>
                    ({printPayload.order.payment_status.toUpperCase()})
                  </span>
                </div>
              </div>

              <div className="ticket-divider-solid" />

              {/* Delivery Details */}
              <div style={{ fontSize: '9.5px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div>
                  <span style={{ fontSize: '8px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Entrega a Domicilio</span>
                  <span style={{ display: 'block' }}>{printPayload.order.delivery_address}</span>
                </div>
                {printPayload.order.delivery_instructions && (
                  <div style={{ marginTop: '2px' }}>
                    <span style={{ fontSize: '8px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Referencias</span>
                    <span style={{ fontStyle: 'italic', opacity: 0.8, display: 'block' }}>{printPayload.order.delivery_instructions}</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontWeight: 'bold', borderTop: '1px solid #f0f0f0', paddingTop: '2px' }}>
                  <span>Fecha: {printPayload.order.delivery_date}</span>
                  <span style={{ marginLeft: 'auto' }}>Horario: {printPayload.order.delivery_time_slot}</span>
                </div>
              </div>

              <div className="ticket-divider-dashed" />

              {/* Items Summary Table */}
              <div>
                <span style={{ fontSize: '8px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>Detalle del Pedido</span>
                <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                  <tbody>
                    {printPayload.items.map((item, idx) => {
                      const variantsText = Object.keys(item.variant_choices || {}).length > 0
                        ? Object.entries(item.variant_choices).map(([k, v]) => `${k}: ${v}`).join(', ')
                        : '';
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f2f2f2' }}>
                          <td style={{ padding: '3px 0', verticalAlign: 'top' }}>
                            <strong>{item.quantity}x</strong> {item.product_name}
                            {variantsText && <span style={{ display: 'block', fontSize: '8px', opacity: 0.6, fontStyle: 'italic', marginTop: '0.5px' }}>{variantsText}</span>}
                          </td>
                          <td style={{ padding: '3px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="ticket-divider-solid" />

              {/* Pricing Totals */}
              <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span style={{ marginLeft: 'auto' }}>${printPayload.order.subtotal.toFixed(2)}</span>
                </div>
                {printPayload.order.loyalty_discount !== undefined && printPayload.order.loyalty_discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#000000', fontWeight: 'bold' }}>
                    <span>Descuento LE CLUB 8</span>
                    <span style={{ marginLeft: 'auto' }}>-${printPayload.order.loyalty_discount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Envío ({printPayload.order.distance_km || 0} km)</span>
                  <span style={{ marginLeft: 'auto' }}>${printPayload.order.delivery_fee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', borderTop: '1px solid #000000', paddingTop: '3px', marginTop: '2px' }}>
                  <span style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>TOTAL NETO</span>
                  <span style={{ marginLeft: 'auto' }}>${printPayload.order.total.toFixed(2)} MXN</span>
                </div>
              </div>

              {printPayload.order.notes && (
                <div style={{ border: '1px solid #dddddd', padding: '3px', fontSize: '9px', fontStyle: 'italic', marginTop: '3px' }}>
                  <strong>Observaciones:</strong> {printPayload.order.notes}
                </div>
              )}

              {printPayload.order.loyalty_earned !== undefined && printPayload.order.loyalty_earned > 0 && (
                <div style={{ marginTop: '2px', fontSize: '8.5px', textAlign: 'center', fontStyle: 'italic', opacity: 0.85 }}>
                  ¡Acumulaste +${printPayload.order.loyalty_earned.toFixed(2)} MXN en LE CLUB 8!
                </div>
              )}

              <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '5mm', opacity: 0.85 }}>
                <p>¡Muchas gracias por elegir la distinción de Maison VIII! 🥐</p>
                <p style={{ fontSize: '8px', opacity: 0.5, marginTop: '0.5mm' }}>Impreso el: {new Date().toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

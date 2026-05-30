'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ShoppingBag, Plus, Minus, Check, ArrowRight } from 'lucide-react';
import Header from '../../components/client/Header';
import Footer from '../../components/client/Footer';
import { db } from '../../lib/supabase';
import { useCart } from '../../hooks/use-cart';
import { Product, Category } from '../../types';

function MenuContent() {
  const cart = useCart();
  const searchParams = useSearchParams();
  const initialProdSlug = searchParams.get('prod');

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Variant Selection State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variantChoices, setVariantChoices] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);

  useEffect(() => {
    async function loadMenuData() {
      try {
        const [cats, prods] = await Promise.all([
          db.getCategories(),
          db.getProducts()
        ]);
        setCategories(cats);
        setProducts(prods);

        // Handle URL deep link to product variant modal
        if (initialProdSlug) {
          const matchedProd = prods.find(p => p.slug === initialProdSlug);
          if (matchedProd) {
            handleOpenVariantModal(matchedProd);
          }
        }
      } catch (err) {
        console.error('Error loading menu data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMenuData();
  }, [initialProdSlug]);

  const handleOpenVariantModal = (prod: Product) => {
    setSelectedProduct(prod);
    setQuantity(1);
    
    // Auto-select first option of each variant
    const defaults: Record<string, string> = {};
    prod.variants.forEach(v => {
      if (v.options.length > 0) {
        defaults[v.name] = v.options[0].name;
      }
    });
    setVariantChoices(defaults);
  };

  const handleVariantSelect = (variantName: string, optionName: string) => {
    setVariantChoices(prev => ({
      ...prev,
      [variantName]: optionName
    }));
  };

  const calculateModalPrice = () => {
    if (!selectedProduct) return 0;
    let adjust = 0;
    selectedProduct.variants.forEach(v => {
      const chosen = variantChoices[v.name];
      const option = v.options.find(o => o.name === chosen);
      if (option) {
        adjust += option.price_adjust;
      }
    });
    return (selectedProduct.price + adjust) * quantity;
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    cart.addItem(selectedProduct, quantity, variantChoices);
    setAddedFeedback(true);
    setTimeout(() => {
      setAddedFeedback(false);
      setSelectedProduct(null);
    }, 1000);
  };

  // Quick Add for products with no variants
  const handleQuickAdd = (prod: Product) => {
    if (prod.variants.length > 0) {
      handleOpenVariantModal(prod);
    } else {
      cart.addItem(prod, 1, {});
      // Flash a quick notice
      alert(`${prod.name} agregado al carrito! ✨`);
    }
  };

  const filteredProducts = products.filter(prod => {
    const matchesCategory = selectedCategory === 'all' || prod.category_id === selectedCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && prod.is_available;
  });

  return (
    <div className="flex flex-col min-h-screen bg-crema">
      <Header />

      {/* Title & Introduction */}
      <section className="bg-olive text-crema py-16 px-4 sm:px-6 lg:px-8 text-center relative border-b border-gold/15">
        <div className="mx-auto max-w-3xl space-y-4">
          <span className="editorial-subtitle text-xs text-gold tracking-[0.25em] font-medium block">
            Colección de Especialidad
          </span>
          <h1 className="editorial-title text-4xl sm:text-5xl font-extralight">
            El Menú de la <span className="italic text-gold font-normal">Boutique</span>
          </h1>
          <p className="text-sm font-light text-crema/70 max-w-lg mx-auto leading-relaxed">
            Delicias artesanales esculpidas diariamente. Haga su pedido y agende su horario de entrega en el Checkout.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center border-b border-olive/5 pb-8">
          {/* Categories Horizontal Scrolling */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-3 md:pb-0 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-2.5 rounded text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'bg-olive text-crema shadow'
                  : 'bg-beige/40 text-olive hover:bg-beige hover:text-gold'
              }`}
            >
              Todo el Menú
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? 'bg-olive text-crema shadow'
                    : 'bg-beige/40 text-olive hover:bg-beige hover:text-gold'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-olive/40" />
            <input
              type="text"
              placeholder="Buscar repostería..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-beige/30 border border-olive/10 rounded pl-10 pr-4 py-2.5 text-xs text-olive focus:outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12 flex-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse bg-beige/50 rounded-lg h-96 border border-olive/5" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 glass-panel rounded border border-olive/5">
            <ShoppingBag className="w-16 h-16 text-gold/30 stroke-[1] mx-auto mb-4" />
            <p className="editorial-title text-xl text-olive/60 font-light">No encontramos productos</p>
            <p className="text-xs text-olive/40 mt-1">Pruebe seleccionando otra categoría o limpiando el buscador.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="glass-panel rounded overflow-hidden border border-olive/5 flex flex-col h-full group"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/3] bg-beige flex items-center justify-center overflow-hidden border-b border-olive/5">
                  {prod.image_url && (prod.image_url.startsWith('data:image/') || prod.image_url.startsWith('http')) ? (
                    <img src={prod.image_url} alt={prod.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center bg-olive/5 group-hover:scale-105 transition-transform duration-700">
                        <span className="editorial-title text-6xl text-olive/5 font-extrabold select-none">VIII</span>
                      </div>
                      <div className="w-16 h-16 rounded-full border border-gold/30 bg-crema flex items-center justify-center shadow-inner relative z-10">
                        <span className="editorial-title text-gold font-semibold text-sm tracking-widest">VIII</span>
                      </div>
                    </>
                  )}
                  <div className="absolute bottom-3 left-3 bg-olive text-crema text-[9px] tracking-widest font-semibold px-2.5 py-1 rounded uppercase">
                    Prep: {prod.prep_time_minutes} min
                  </div>
                </div>

                {/* Product Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="editorial-title text-xl font-medium text-olive group-hover:text-gold transition-colors duration-300">
                        {prod.name}
                      </h3>
                      <span className="font-bold text-olive text-lg whitespace-nowrap">${prod.price}</span>
                    </div>
                    <p className="text-xs text-charcoal/70 font-light leading-relaxed line-clamp-3">
                      {prod.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {prod.variants.length > 0 ? (
                      <button
                        onClick={() => handleOpenVariantModal(prod)}
                        className="w-full bg-olive text-crema hover:bg-gold transition-all duration-300 text-xs tracking-widest font-semibold py-3 px-4 rounded uppercase flex items-center justify-center gap-2"
                      >
                        <span>Personalizar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuickAdd(prod)}
                        className="w-full bg-olive text-crema hover:bg-gold hover:scale-102 transition-all duration-300 text-xs tracking-widest font-semibold py-3 px-4 rounded uppercase flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar al Carrito</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Product Customizer & Variant Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-55 overflow-y-auto">
          <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg rounded-lg bg-crema border border-gold/15 p-6 shadow-2xl animate-fade-in-up">
              <div className="space-y-6">
                <div>
                  <h3 className="editorial-title text-2xl font-light text-olive">{selectedProduct.name}</h3>
                  <p className="text-xs text-charcoal/60 font-light leading-relaxed mt-2">{selectedProduct.description}</p>
                </div>

                {/* Variants Selectors */}
                {selectedProduct.variants.map((v) => (
                  <div key={v.name} className="space-y-2">
                    <span className="text-xs font-semibold tracking-wider text-olive uppercase block">{v.name}</span>
                    <div className="flex flex-wrap gap-2">
                      {v.options.map((opt) => {
                        const isSelected = variantChoices[v.name] === opt.name;
                        return (
                          <button
                            key={opt.name}
                            onClick={() => handleVariantSelect(v.name, opt.name)}
                            className={`px-4 py-2 rounded text-xs tracking-wide font-medium transition-all ${
                              isSelected
                                ? 'bg-olive text-crema border border-olive shadow'
                                : 'bg-beige/40 text-olive border border-olive/5 hover:bg-beige'
                            }`}
                          >
                            {opt.name} {opt.price_adjust > 0 && `(+$${opt.price_adjust})`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Quantity Selector */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold tracking-wider text-olive uppercase block">Cantidad</span>
                  <div className="flex items-center w-28 border border-olive/15 rounded overflow-hidden">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="p-2 text-olive/60 hover:bg-beige transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-center text-sm font-medium text-olive">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="p-2 text-olive/60 hover:bg-beige transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add Actions & Pricing */}
                <div className="border-t border-olive/5 pt-5 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] tracking-wider uppercase text-olive/40">Total Estimado</span>
                    <span className="font-bold text-olive text-2xl">${calculateModalPrice().toFixed(2)}</span>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={addedFeedback}
                    className={`flex-1 py-3.5 px-6 rounded text-xs tracking-[0.15em] font-semibold text-center uppercase shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      addedFeedback
                        ? 'bg-green-600 text-crema'
                        : 'bg-gold text-olive hover:bg-gold-bright hover:scale-102'
                    }`}
                  >
                    {addedFeedback ? (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>¡Agregado!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Añadir al Carrito</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-crema items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <span className="editorial-title text-4xl text-olive/60">MAISON VIII</span>
          <span className="text-xs text-gold uppercase tracking-[0.2em] mt-2">Cargando Boutique...</span>
        </div>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}

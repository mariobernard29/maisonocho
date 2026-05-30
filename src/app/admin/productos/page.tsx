'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, FolderHeart, Plus, Edit2, Trash2, Eye, EyeOff, Star, AlertCircle, UploadCloud, FolderOpen } from 'lucide-react';
import { db } from '../../../lib/supabase';
import { Product, Category, ProductVariant } from '../../../types';
import { generateUUID } from '../../../lib/uuid';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formError, setFormError] = useState<string>('');

  // Category Manager States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState('');
  const [prepTime, setPrepTime] = useState<number>(120);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState('/logos/logo_fodo_verde_500x500.png');
  
  // Custom Variants builder
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newVariantName, setNewVariantName] = useState('');
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState<number>(0);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // File Input Ref for Upload box
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [pData, cData] = await Promise.all([
          db.getProducts(),
          db.getCategories()
        ]);
        setProducts(pData);
        setCategories(cData);
        if (cData.length > 0) setCategoryId(cData[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedProduct(null);
    setName('');
    setDescription('');
    setPrice(0);
    if (categories.length > 0) {
      setCategoryId(categories[0].id);
    } else {
      setCategoryId('');
    }
    setPrepTime(120);
    setIsAvailable(true);
    setIsFeatured(false);
    setImageUrl('/logos/logo_fodo_verde_500x500.png');
    setVariants([]);
    setFormError('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setSelectedProduct(prod);
    setName(prod.name);
    setDescription(prod.description);
    setPrice(prod.price);
    setCategoryId(prod.category_id);
    setPrepTime(prod.prep_time_minutes);
    setIsAvailable(prod.is_available);
    setIsFeatured(prod.is_featured);
    setImageUrl(prod.image_url);
    setVariants(prod.variants || []);
    setFormError('');
    setShowFormModal(true);
  };

  const handleAddVariant = () => {
    if (!newVariantName.trim()) return;
    if (variants.some(v => v.name.toLowerCase() === newVariantName.trim().toLowerCase())) {
      alert('Esta variante ya existe.');
      return;
    }
    setVariants(prev => [...prev, { name: newVariantName.trim(), options: [] }]);
    setNewVariantName('');
  };

  const handleAddOptionToVariant = (varIdx: number) => {
    if (!newOptionName.trim()) return;
    const updated = [...variants];
    updated[varIdx].options.push({
      name: newOptionName.trim(),
      price_adjust: newOptionPrice
    });
    setVariants(updated);
    setNewOptionName('');
    setNewOptionPrice(0);
  };

  const handleRemoveOption = (varIdx: number, optIdx: number) => {
    const updated = [...variants];
    updated[varIdx].options.splice(optIdx, 1);
    setVariants(updated);
  };

  const handleRemoveVariant = (varIdx: number) => {
    setVariants(prev => prev.filter((_, idx) => idx !== varIdx));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || price <= 0 || !categoryId) {
      setFormError('Por favor complete todos los campos obligatorios y asegure que el precio sea mayor a 0 y que exista una categoría seleccionada.');
      return;
    }

    setLoading(true);
    try {
      const prodSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const prodObj: Product = {
        id: selectedProduct?.id || generateUUID(),
        category_id: categoryId,
        name: name.trim(),
        slug: prodSlug,
        description: description.trim(),
        price,
        image_url: imageUrl,
        variants,
        is_available: isAvailable,
        is_featured: isFeatured,
        prep_time_minutes: prepTime
      };

      await db.saveProduct(prodObj);
      
      // Update list state
      if (selectedProduct) {
        setProducts(prev => prev.map(p => p.id === selectedProduct.id ? prodObj : p));
      } else {
        setProducts(prev => [prodObj, ...prev]);
      }
      
      setShowFormModal(false);
      alert('Producto guardado con éxito! ✨');
    } catch (err) {
      console.error(err);
      setFormError('Error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este producto del menú?')) return;
    setLoading(true);
    try {
      await db.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      alert('Producto eliminado con éxito.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (prod: Product) => {
    const updated = { ...prod, is_available: !prod.is_available };
    await db.saveProduct(updated);
    setProducts(prev => prev.map(p => p.id === prod.id ? updated : p));
  };

  const toggleFeatured = async (prod: Product) => {
    const updated = { ...prod, is_featured: !prod.is_featured };
    await db.saveProduct(updated);
    setProducts(prev => prev.map(p => p.id === prod.id ? updated : p));
  };

  // Image Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe pesar más de 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe pesar más de 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInputClick = () => {
    fileInputRef.current?.click();
  };

  // Category Manager Helpers
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert('El nombre de la categoría es obligatorio.');
      return;
    }

    try {
      const catSlug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const catObj: Category = {
        id: generateUUID(),
        name: newCategoryName.trim(),
        slug: catSlug,
        description: newCategoryDescription.trim(),
        display_order: categories.length + 1
      };

      const saved = await db.saveCategory(catObj);
      setCategories(prev => [...prev, saved]);
      setNewCategoryName('');
      setNewCategoryDescription('');
      if (!categoryId) setCategoryId(saved.id);
      alert('Categoría creada con éxito! 📁');
    } catch (err) {
      console.error(err);
      alert('Error al guardar categoría.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta categoría? Se desvincularán o eliminarán sus productos.')) return;
    try {
      await db.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      setProducts(prev => prev.filter(p => p.category_id !== id)); // Mock cascade delete
      if (categoryId === id) {
        setCategoryId(categories.find(c => c.id !== id)?.id || '');
      }
      alert('Categoría eliminada con éxito.');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Search and Quick Filters */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-[#0A0F0A] border border-gold/10 p-5 rounded-lg shadow-xl">
        <div className="flex items-center gap-3 w-full xl:w-auto">
          {/* Category Dropdown Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#121A12] border border-gold/15 rounded p-2.5 text-xs text-crema font-semibold focus:outline-none focus:border-gold"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="relative flex-grow sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-crema/30" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121A12]/50 border border-gold/10 rounded pl-9 pr-3 py-2 text-xs text-crema focus:outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        {/* Categories Manager & Add Product Buttons */}
        <div className="flex gap-2 w-full xl:w-auto items-center justify-end">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="w-full xl:w-auto inline-flex items-center justify-center gap-2 bg-[#121A12] border border-gold/25 text-gold hover:bg-[#1E2C1E] px-5 py-2.5 rounded text-xs font-semibold tracking-wider transition-all duration-300 uppercase shrink-0"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Gestionar Categorías</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="w-full xl:w-auto inline-flex items-center justify-center gap-2 bg-gold text-olive hover:bg-gold-bright hover:scale-102 px-5 py-2.5 rounded text-xs font-semibold tracking-wider transition-all duration-300 uppercase shrink-0 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Producto</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="p-20 text-center animate-pulse">
          <span className="editorial-title text-2xl text-gold">Consultando catálogo boutique...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-20 text-center bg-[#0A0F0A] border border-gold/10 rounded-lg">
          <FolderHeart className="w-12 h-12 text-gold/20 mx-auto mb-3" />
          <p className="editorial-title text-lg text-crema/50">El catálogo está vacío o no hay resultados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div key={p.id} className="bg-[#0A0F0A] border border-gold/10 rounded-lg shadow-xl overflow-hidden flex flex-col justify-between group">
              {/* Product Header Thumbnail */}
              <div className="aspect-[4/3] bg-[#121A12]/40 relative flex items-center justify-center border-b border-gold/10 overflow-hidden">
                {p.image_url && (p.image_url.startsWith('data:image/') || p.image_url.startsWith('http')) ? (
                  <img src={p.image_url} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center bg-olive/5 group-hover:scale-105 transition-transform duration-700">
                      <span className="editorial-title text-6xl text-gold/5 font-extrabold select-none">VIII</span>
                    </div>
                    <div className="w-14 h-14 rounded-full border border-gold/30 bg-[#0A0F0A] flex items-center justify-center shadow-inner relative z-10">
                      <span className="editorial-title text-gold font-semibold text-xs tracking-widest">VIII</span>
                    </div>
                  </>
                )}

                {/* Actions indicators */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                  <button
                    onClick={() => toggleFeatured(p)}
                    className={`p-1.5 rounded-full border transition-all ${
                      p.is_featured
                        ? 'bg-gold/20 border-gold/40 text-gold'
                        : 'bg-[#0A0F0A]/80 border-gold/10 text-crema/40 hover:text-gold'
                    }`}
                    title={p.is_featured ? 'Destacado' : 'Marcar Destacado'}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => toggleAvailability(p)}
                    className={`p-1.5 rounded-full border transition-all ${
                      p.is_available
                        ? 'bg-green-500/20 border-green-500/30 text-green-400'
                        : 'bg-red-500/20 border-red-500/30 text-red-400'
                    }`}
                    title={p.is_available ? 'Disponible' : 'Inactivo'}
                  >
                    {p.is_available ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Product Description details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="editorial-title text-lg font-semibold text-crema group-hover:text-gold transition-colors duration-300">
                      {p.name}
                    </h3>
                    <span className="font-bold text-gold text-base">${p.price}</span>
                  </div>
                  <p className="text-xs text-crema/60 leading-relaxed font-light line-clamp-3">{p.description}</p>
                </div>

                <div className="border-t border-gold/10 pt-3.5 flex items-center justify-between text-[10px] text-crema/40">
                  <span>Prep: {p.prep_time_minutes} min</span>
                  <span>Variantes: {p.variants?.length || 0}</span>
                </div>

                {/* Edit & Delete row */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOpenEditModal(p)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#121A12] border border-gold/20 text-gold hover:bg-gold hover:text-olive py-2 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors duration-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-2 rounded bg-[#121A12]/40 hover:bg-red-950 border border-red-500/25 text-red-400 hover:text-red-300 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT DIALOG OVERLAY */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="absolute inset-0 bg-[#000]/60 backdrop-blur-sm" onClick={() => setShowFormModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl rounded-lg bg-[#0E150E] border border-gold/25 p-6 shadow-2xl space-y-6">
              
              <div className="flex justify-between items-center border-b border-gold/15 pb-4">
                <h3 className="editorial-title text-xl text-gold font-light">
                  {selectedProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
                </h3>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="text-crema/40 hover:text-crema text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/25 p-3.5 rounded text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
                {/* General columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">Nombre del Producto</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-sm text-crema focus:outline-none focus:border-gold"
                      placeholder="Ej. Tarta de Almendras"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">Precio Base ($)</label>
                      <input
                        type="number"
                        value={isNaN(price) || price === 0 ? '' : price}
                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-sm text-crema focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">Prep. (Minutos)</label>
                      <input
                        type="number"
                        value={isNaN(prepTime) || prepTime === 0 ? '' : prepTime}
                        onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-sm text-crema focus:outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">Categoría</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-sm text-crema focus:outline-none focus:border-gold"
                    >
                      <option value="">Seleccione una categoría...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-4 items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-crema">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                        className="rounded border-gold/20 text-gold focus:ring-gold"
                      />
                      <span>Disponible</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-crema">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="rounded border-gold/20 text-gold focus:ring-gold"
                      />
                      <span>Destacar en Home</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">Descripción</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-sm text-crema focus:outline-none focus:border-gold"
                    placeholder="Descripción gastronómica premium..."
                  />
                </div>

                {/* INTERACTIVE DRAG AND DROP FILE UPLOADER */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block">Imagen del Producto</label>
                  
                  {/* Hidden native input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  
                  {/* Drag drop container box */}
                  <div 
                    onClick={triggerFileInputClick}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border border-dashed border-gold/20 rounded-lg p-5 text-center flex flex-col items-center justify-center bg-[#121A12]/30 hover:border-gold/40 transition-colors cursor-pointer relative overflow-hidden group min-h-[140px]"
                  >
                    {imageUrl && (imageUrl.startsWith('data:image/') || imageUrl.startsWith('http')) ? (
                      <div className="absolute inset-0 w-full h-full bg-[#0E150E] flex items-center justify-center">
                        <img src={imageUrl} alt="Thumbnail preview" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-[#000]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <UploadCloud className="w-7 h-7 text-gold" />
                          <span className="text-[10px] font-semibold text-crema uppercase tracking-wider ml-2">Cambiar imagen</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-gold/40 mb-2" />
                        <p className="font-semibold text-crema text-xs">Arrastre su imagen aquí o haga click para seleccionar</p>
                        <span className="text-[9px] text-crema/40 mt-1">Soporta PNG, JPG y WEBP (Max: 2MB)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* DYNAMIC VARIANTS BUILDER */}
                <div className="border-t border-gold/15 pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-semibold tracking-wider text-gold uppercase block">Configurar Variantes (Ej. Tamaños, Estilos)</span>
                  </div>
                  
                  {/* Variant Input Row */}
                  <div className="flex gap-2 items-center bg-[#121A12]/30 border border-gold/10 p-3 rounded">
                    <input
                      type="text"
                      placeholder="Nombre de Variante (Ej. Tamaño)"
                      value={newVariantName}
                      onChange={(e) => setNewVariantName(e.target.value)}
                      className="flex-1 bg-[#0A0F0A] border border-gold/15 rounded px-2.5 py-1.5 text-xs text-crema focus:outline-none focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="bg-[#121A12] border border-gold/20 hover:bg-gold hover:text-olive px-4 py-1.5 rounded font-bold transition-all uppercase"
                    >
                      Añadir
                    </button>
                  </div>

                  {/* Render Existing variants */}
                  <div className="space-y-4 max-h-48 overflow-y-auto pr-1">
                    {variants.map((v, varIdx) => (
                      <div key={varIdx} className="bg-[#121A12]/50 border border-gold/10 p-3 rounded space-y-3">
                        <div className="flex justify-between items-center border-b border-gold/5 pb-2">
                          <span className="font-bold text-gold uppercase">{v.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(varIdx)}
                            className="text-red-400 hover:text-red-300 font-semibold"
                          >
                            Eliminar Variante
                          </button>
                        </div>

                        {/* Options chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {v.options.map((opt, optIdx) => (
                            <span key={optIdx} className="inline-flex items-center gap-1.5 bg-[#0D140D] border border-gold/15 px-2.5 py-1 rounded-full font-medium">
                              <span>{opt.name} {opt.price_adjust > 0 && `(+$${opt.price_adjust})`}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(varIdx, optIdx)}
                                className="text-red-400 font-bold hover:text-red-300 text-xs"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Add Option Row */}
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Nombre de Opción (Ej. Grande)"
                            value={newOptionName}
                            onChange={(e) => setNewOptionName(e.target.value)}
                            className="flex-1 bg-[#0A0F0A] border border-gold/15 rounded px-2.5 py-1.5 text-[11px] text-crema focus:outline-none"
                          />
                          <input
                            type="number"
                            placeholder="Ajuste precio"
                            value={isNaN(newOptionPrice) || newOptionPrice === 0 ? '' : newOptionPrice}
                            onChange={(e) => setNewOptionPrice(parseFloat(e.target.value) || 0)}
                            className="w-24 bg-[#0A0F0A] border border-gold/15 rounded px-2.5 py-1.5 text-[11px] text-crema focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddOptionToVariant(varIdx)}
                            className="bg-gold text-olive px-3 py-1.5 rounded font-bold uppercase transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="border-t border-gold/15 pt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="border border-gold/15 hover:bg-[#121A12] text-gold px-6 py-2.5 rounded font-semibold uppercase tracking-wider transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-gold text-olive hover:bg-gold-bright hover:scale-102 px-6 py-2.5 rounded font-semibold uppercase tracking-wider transition-all shadow-lg"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES MANAGEMENT MODAL OVERLAY */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="absolute inset-0 bg-[#000]/60 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl rounded-lg bg-[#0E150E] border border-gold/25 p-6 shadow-2xl space-y-6">
              
              <div className="flex justify-between items-center border-b border-gold/15 pb-4">
                <h3 className="editorial-title text-xl text-gold font-light flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-gold" />
                  <span>Gestionar Categorías del Menú</span>
                </h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-crema/40 hover:text-crema text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Create Category Form (Left) */}
                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <span className="text-[10px] font-semibold tracking-wider text-gold uppercase block border-b border-gold/10 pb-1.5">Crear Categoría</span>
                  
                  <div>
                    <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1">Nombre de Categoría</label>
                    <input
                      type="text"
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ej. Repostería de Temporada"
                      className="w-full bg-[#121A12] border border-gold/15 rounded px-3 py-2 text-crema"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1">Descripción</label>
                    <textarea
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      placeholder="Breve reseña sobre este tipo de postres..."
                      rows={3}
                      className="w-full bg-[#121A12] border border-gold/15 rounded px-3 py-2 text-crema font-light"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gold text-olive hover:bg-gold-bright py-2.5 rounded font-bold uppercase transition-colors"
                  >
                    Guardar Categoría
                  </button>
                </form>

                {/* Categories List (Right) */}
                <div className="space-y-4">
                  <span className="text-[10px] font-semibold tracking-wider text-gold uppercase block border-b border-gold/10 pb-1.5">Categorías Existentes ({categories.length})</span>
                  
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {categories.length === 0 ? (
                      <p className="text-crema/30 italic text-center py-6">Sin categorías.</p>
                    ) : (
                      categories.map((c) => (
                        <div key={c.id} className="bg-[#121A12]/40 border border-gold/10 p-3 rounded flex justify-between items-center gap-3">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <span className="font-semibold text-crema text-sm block truncate">{c.name}</span>
                            <span className="text-[10px] text-crema/40 block truncate">{c.description || 'Sin descripción.'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c.id)}
                            className="p-1.5 rounded bg-[#121A12] border border-red-500/15 text-red-400 hover:bg-red-950 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

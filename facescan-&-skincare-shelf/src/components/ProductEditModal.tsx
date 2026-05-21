import React, { useState, useEffect } from 'react';
import { X, Calendar, Droplets, Info, Sparkles, Image as ImageIcon } from 'lucide-react';
import { SkincareProduct, SkincareCategory } from '../types';
import { CATEGORIES_LIST, SKIN_CONCERNS_LIST } from '../constants';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: SkincareProduct) => void;
  product: SkincareProduct | null; // Null if adding a new product
}

const PRESET_IMAGES = [
  { name: 'Ampoule / Serum', url: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/KRB2eAlLOy/91akkbvi_expires_30_days.png' },
  { name: 'Toner Bottle', url: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/l57etvqc_expires_30_days.png' },
  { name: 'Exfoliant', url: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/KRB2eAlLOy/0lagtbm6_expires_30_days.png' },
  { name: 'Sunscreen Tube', url: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/KRB2eAlLOy/9ve39vrm_expires_30_days.png' },
];

export default function ProductEditModal({ isOpen, onClose, onSave, product }: ProductEditModalProps) {
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SkincareCategory>('Toner');
  const [expiryDate, setExpiryDate] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [paoMonths, setPaoMonths] = useState<number | undefined>(12);
  const [remainingPercent, setRemainingPercent] = useState(100);
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [assignedRoutine, setAssignedRoutine] = useState<'AM' | 'PM' | 'Both' | 'None'>('None');
  const [imageUrl, setImageUrl] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);

  useEffect(() => {
    if (product) {
      setBrand(product.brand);
      setName(product.name);
      setCategory(product.category);
      setExpiryDate(product.expiryDate);
      setOpenDate(product.openDate || '');
      setPaoMonths(product.paoMonths);
      setRemainingPercent(product.remainingPercent);
      setSkinConcerns(product.skinConcerns || []);
      setNotes(product.notes || '');
      setAssignedRoutine(product.assignedRoutine || 'None');
      
      const isPreset = PRESET_IMAGES.some(p => p.url === product.imageUrl);
      if (product.imageUrl) {
        if (isPreset) {
          setImageUrl(product.imageUrl);
          setUseCustomUrl(false);
        } else {
          setCustomImageUrl(product.imageUrl);
          setUseCustomUrl(true);
        }
      } else {
        setImageUrl('');
        setUseCustomUrl(false);
      }
    } else {
      // Clear fields for new item
      setBrand('');
      setName('');
      setCategory('Toner');
      setExpiryDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 7)); // Default 1 year from now
      setOpenDate(new Date().toISOString().substring(0, 10)); // Default today
      setPaoMonths(12);
      setRemainingPercent(100);
      setSkinConcerns([]);
      setNotes('');
      setAssignedRoutine('None');
      setImageUrl(PRESET_IMAGES[0].url);
      setCustomImageUrl('');
      setUseCustomUrl(false);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const toggleSkinConcern = (concern: string) => {
    if (skinConcerns.includes(concern)) {
      setSkinConcerns(skinConcerns.filter((c) => c !== concern));
    } else {
      setSkinConcerns([...skinConcerns, concern]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !name.trim()) return;

    const finalImageUrl = useCustomUrl ? customImageUrl.trim() : imageUrl;

    onSave({
      id: product?.id || crypto.randomUUID(),
      brand: brand.trim(),
      name: name.trim(),
      category,
      expiryDate,
      openDate: openDate || undefined,
      paoMonths: paoMonths || undefined,
      remainingPercent,
      skinConcerns,
      notes: notes.trim(),
      assignedRoutine,
      imageUrl: finalImageUrl || undefined,
      isFavorite: product?.isFavorite || false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500 text-white rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {product ? 'Edit Skincare Product' : 'Add to Skincare Shelf'}
              </h3>
              <p className="text-xs text-slate-500">Track and optimize your daily application</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Brand & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SKIN ANGEL, AVOSKIN"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Centella Ampoule, Exfoliating Toner"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 transition"
              />
            </div>
          </div>

          {/* Category & Routine Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category Type
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SkincareCategory)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 bg-white transition"
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Routine Assignment
              </label>
              <select
                value={assignedRoutine}
                onChange={(e) => setAssignedRoutine(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 bg-white transition"
              >
                <option value="None">None (In Backlog / Stock Only)</option>
                <option value="AM">AM Routine Only ☀️</option>
                <option value="PM">PM Routine Only 🌙</option>
                <option value="Both">Both AM & PM routines ☀️🌙</option>
              </select>
            </div>
          </div>

          {/* Dates Section */}
          <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
            <div className="text-xs font-bold text-slate-600 flex items-center space-x-1.5 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>PAO & Expiration Tracker</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Expiry Date *
                </label>
                <input
                  type="month"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 bg-white transition text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Opened Date (Optional)
                </label>
                <input
                  type="date"
                  value={openDate}
                  onChange={(e) => setOpenDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 bg-white transition text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  PAO (Period After Opening)
                </label>
                <div className="flex space-x-1">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="Months"
                    value={paoMonths || ''}
                    onChange={(e) => setPaoMonths(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 bg-white transition text-sm"
                  />
                  <div className="flex items-center text-xs text-slate-500 whitespace-nowrap bg-slate-200 px-2 rounded-lg">
                    mos
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Presets for PAO */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">PAO Presets:</span>
              {[6, 12, 18, 24].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaoMonths(m)}
                  className={`text-[11px] px-2 py-1 rounded border transition ${
                    paoMonths === m
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-300 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m} Months ({m}M)
                </button>
              ))}
            </div>
          </div>

          {/* Product Fluid Volume Left */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <Droplets className="w-4 h-4 text-violet-500 animate-pulse" />
                <span>Product Volume Remaining</span>
              </label>
              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                {remainingPercent}% Left
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={remainingPercent}
                onChange={(e) => setRemainingPercent(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex space-x-1">
                {[0, 25, 50, 75, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRemainingPercent(v)}
                    className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 text-slate-600 font-medium transition"
                  >
                    {v === 0 ? 'Empty' : v === 100 ? 'Full' : `${v}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Illustration / Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Product Representation Code
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setImageUrl(preset.url);
                    setUseCustomUrl(false);
                  }}
                  className={`flex items-center space-x-2 p-2 rounded-xl border transition text-left group ${
                    !useCustomUrl && imageUrl === preset.url
                      ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 ring-2 ring-indigo-500/10'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-8 h-8 rounded-lg bg-slate-100 object-contain p-1 group-hover:scale-105 transition"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[11px] font-medium leading-tight line-clamp-2">{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Custom Image URL Toggle */}
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => setUseCustomUrl(!useCustomUrl)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{useCustomUrl ? 'Use a standard preset product illustration' : 'Or paste a custom image URL'}</span>
              </button>
              
              {useCustomUrl && (
                <input
                  type="url"
                  placeholder="Paste direct link image (https://...)"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="w-full mt-2 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 bg-white transition"
                />
              )}
            </div>
          </div>

          {/* Skin Concerns Tags selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Targets Concerns
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-1.5 border border-slate-100 rounded-xl bg-slate-50/50">
              {SKIN_CONCERNS_LIST.map((concern) => {
                const selected = skinConcerns.includes(concern);
                return (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => toggleSkinConcern(concern)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                      selected
                        ? 'bg-rose-500 text-white border-rose-600 font-medium'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {concern}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400">Click to select all concerns this product solves.</p>
          </div>

          {/* Short scientific notes or observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Personal Notes, Observations & Textures
            </label>
            <textarea
              rows={2}
              placeholder="Write texture types, daily frequency, application guidelines or how it feels on your skin..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 text-sm transition"
            />
          </div>
        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!brand.trim() || !name.trim()}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {product ? 'Save Changes' : 'Add to Shelf'}
          </button>
        </div>
      </div>
    </div>
  );
}

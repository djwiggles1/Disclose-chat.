import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Hash, Volume2, Megaphone, X } from 'lucide-react';
import { stripEmojis, sanitizeChannelName } from '../../utils/emojiSanitizer';

export const CreateChannelModal: React.FC = () => {
  const { currentServer, createChannel, closeModal } = useApp();

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<'text' | 'voice' | 'announcement'>('text');
  const [iconUrl, setIconUrl] = useState('https://api.dicebear.com/7.x/shapes/svg?seed=General');
  const [categoryId, setCategoryId] = useState(currentServer?.categories[0]?.id || '');
  const [loading, setLoading] = useState(false);

  if (!currentServer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await createChannel(
        sanitizeChannelName(name),
        categoryId || currentServer.categories[0]?.id || '',
        stripEmojis(topic),
        type,
        iconUrl.trim() || undefined
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Create Channel</h2>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-300">
          {/* Channel Type */}
          <div>
            <label className="block font-semibold text-slate-400 uppercase mb-2 text-[11px]">
              Channel Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('text')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                  type === 'text'
                    ? 'border-indigo-500 bg-indigo-950/60 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Hash className="w-5 h-5" />
                <span className="font-medium text-xs">Text</span>
              </button>

              <button
                type="button"
                onClick={() => setType('voice')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                  type === 'voice'
                    ? 'border-emerald-500 bg-emerald-950/60 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Volume2 className="w-5 h-5" />
                <span className="font-medium text-xs">Voice</span>
              </button>

              <button
                type="button"
                onClick={() => setType('announcement')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                  type === 'announcement'
                    ? 'border-amber-500 bg-amber-950/60 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Megaphone className="w-5 h-5" />
                <span className="font-medium text-xs">Announce</span>
              </button>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block font-semibold text-slate-400 uppercase mb-1 text-[11px]">
              Channel Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-500 font-mono text-sm">#</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(stripEmojis(e.target.value))}
                placeholder="new-channel"
                className="w-full bg-slate-900 text-slate-100 placeholder-slate-600 text-sm pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Channel name will be converted to clean kebab-case with zero emojis.
            </p>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block font-semibold text-slate-400 uppercase mb-1 text-[11px]">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-900 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              {currentServer.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Discussion Icon Image */}
          <div>
            <label className="block font-semibold text-slate-400 uppercase mb-1 text-[11px]">
              Discussion Icon Image (URL or Presets)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <img
                src={iconUrl || 'https://api.dicebear.com/7.x/shapes/svg?seed=General'}
                alt="Preview"
                className="w-8 h-8 rounded-lg object-cover bg-slate-800 border border-slate-700 shrink-0"
              />
              <input
                type="text"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                placeholder="Image URL or choose preset below"
                className="flex-1 bg-slate-900 text-slate-100 placeholder-slate-600 text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { name: 'General', seed: 'General' },
                { name: 'Dev', seed: 'Code' },
                { name: 'Design', seed: 'Shapes' },
                { name: 'Hardware', seed: 'Hardware' },
                { name: 'Games', seed: 'Game' },
                { name: 'Audio', seed: 'Audio' },
                { name: 'Release', seed: 'Release' },
              ].map((p) => {
                const url = `https://api.dicebear.com/7.x/shapes/svg?seed=${p.seed}`;
                return (
                  <button
                    key={p.seed}
                    type="button"
                    onClick={() => setIconUrl(url)}
                    className={`p-1 rounded-lg border transition-all ${
                      iconUrl === url
                        ? 'border-indigo-500 ring-1 ring-indigo-500'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img src={url} alt={p.name} className="w-5 h-5 rounded bg-slate-800" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide disabled:opacity-40 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

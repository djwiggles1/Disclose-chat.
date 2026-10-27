import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, X } from 'lucide-react';
import { stripEmojis } from '../../utils/emojiSanitizer';

const COLOR_PRESETS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#64748B', // Slate
];

export const CreateServerModal: React.FC = () => {
  const { createServer, closeModal } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconBg, setIconBg] = useState(COLOR_PRESETS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await createServer(stripEmojis(name), stripEmojis(description), iconBg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Create a Server</h2>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-300">
          <div>
            <label className="block font-semibold text-slate-400 uppercase mb-1 text-[11px]">
              Server Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(stripEmojis(e.target.value))}
              placeholder="e.g. Distributed Systems Lab"
              className="w-full bg-slate-900 text-slate-100 placeholder-slate-600 text-sm px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 uppercase mb-1 text-[11px]">
              Server Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(stripEmojis(e.target.value))}
              placeholder="What is this community or project about?"
              className="w-full bg-slate-900 text-slate-100 placeholder-slate-600 text-sm px-3.5 py-2 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 uppercase mb-1.5 text-[11px]">
              Server Icon Accent Color
            </label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setIconBg(color)}
                  style={{ backgroundColor: color }}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    iconBg === color ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

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
              {loading ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

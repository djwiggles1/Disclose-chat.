import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, X } from 'lucide-react';
import { stripEmojis } from '../../utils/emojiSanitizer';

export const JoinServerModal: React.FC = () => {
  const { joinServerByInvite, closeModal } = useApp();
  const [inviteCode, setInviteCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setErrorMsg('');
    setLoading(true);
    try {
      const ok = await joinServerByInvite(stripEmojis(inviteCode));
      if (!ok) {
        setErrorMsg('Invalid invite code. Please check code format.');
      }
    } catch {
      setErrorMsg('Failed to join server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Join a Server</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-300">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-400 uppercase mb-1 text-[11px]">
              Invite Code
            </label>
            <input
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(stripEmojis(e.target.value.toUpperCase()))}
              placeholder="e.g. DISCLOSE-CORE or DESIGN-SYSTEMS"
              className="w-full bg-slate-900 text-slate-100 placeholder-slate-600 text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 uppercase"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Sample public server codes: <code className="text-blue-400 font-mono">DISCLOSE-CORE</code>,{' '}
              <code className="text-blue-400 font-mono">DESIGN-SYSTEMS</code>
            </p>
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
              disabled={loading || !inviteCode.trim()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide disabled:opacity-40 transition-colors"
            >
              {loading ? 'Joining...' : 'Join Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, X, LogOut, Check } from 'lucide-react';
import { stripEmojis } from '../../utils/emojiSanitizer';
import { UserStatus } from '../../types';

export const UserProfileModal: React.FC = () => {
  const { currentUser, updateProfile, logout, closeModal } = useApp();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [customStatus, setCustomStatus] = useState(currentUser?.customStatus || '');
  const [status, setStatus] = useState<UserStatus>(currentUser?.status || 'online');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAvatar = avatarSeed
      ? `https://api.dicebear.com/7.x/identicon/svg?seed=${avatarSeed}`
      : currentUser.avatarUrl;

    await updateProfile({
      displayName: stripEmojis(displayName),
      customStatus: stripEmojis(customStatus),
      status,
      avatarUrl: newAvatar,
    });

    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      closeModal();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">User Profile & Settings</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs text-slate-300">
          {/* Avatar Preview & Customizer */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
            <img
              src={
                avatarSeed
                  ? `https://api.dicebear.com/7.x/identicon/svg?seed=${avatarSeed}`
                  : currentUser.avatarUrl
              }
              alt={currentUser.displayName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover bg-slate-800 border-2 border-indigo-500/80 shadow-md"
            />
            <div className="flex-1 space-y-1.5">
              <span className="font-semibold text-white text-sm block">
                {currentUser.displayName}
              </span>
              <span className="text-slate-500 font-mono block">@{currentUser.username}</span>
              <div className="flex items-center gap-1.5 pt-1">
                {['Alex', 'Jordan', 'Taylor', 'Nova', 'Vance', 'Sol'].map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setAvatarSeed(seed)}
                    className="p-0.5 rounded-lg border border-slate-800 hover:border-indigo-500"
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`}
                      alt={seed}
                      className="w-5 h-5 rounded bg-slate-800"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 uppercase mb-1 text-[11px]">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(stripEmojis(e.target.value))}
              placeholder="Display Name"
              className="w-full bg-slate-900 text-slate-100 placeholder-slate-600 text-sm px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 uppercase mb-1 text-[11px]">
              Status Mode
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'online', label: 'Online', color: 'bg-emerald-500' },
                { id: 'idle', label: 'Idle', color: 'bg-amber-500' },
                { id: 'dnd', label: 'DND', color: 'bg-red-500' },
                { id: 'offline', label: 'Invisible', color: 'bg-slate-500' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatus(item.id as UserStatus)}
                  className={`py-2 px-1.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs transition-colors ${
                    status === item.id
                      ? 'border-indigo-500 bg-indigo-950/60 text-white font-medium'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 uppercase mb-1 text-[11px]">
              Custom Status Message
            </label>
            <input
              type="text"
              value={customStatus}
              onChange={(e) => setCustomStatus(stripEmojis(e.target.value))}
              placeholder="What are you working on? (no emojis)"
              className="w-full bg-slate-900 text-slate-100 placeholder-slate-600 text-sm px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                logout();
                closeModal();
              }}
              className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide transition-colors flex items-center gap-1.5"
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

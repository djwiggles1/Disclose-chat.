import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, X, User, Lock, Sparkles, Check } from 'lucide-react';
import { stripEmojis } from '../../utils/emojiSanitizer';

export const AuthModal: React.FC = () => {
  const { login, register, switchUserFast, allUsers, closeModal } = useApp();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [displayName, setDisplayName] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('Alex');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const ok = await login(stripEmojis(username), password);
        if (!ok) setErrorMsg('Invalid username or password.');
      } else {
        const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${avatarSeed}`;
        const ok = await register(
          stripEmojis(username),
          password,
          stripEmojis(displayName || username),
          avatarUrl
        );
        if (!ok) setErrorMsg('Could not register account. Username may be taken.');
      }
    } catch {
      setErrorMsg('An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Disclose Authentication</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors ${
              tab === 'login'
                ? 'border-indigo-500 text-white bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors ${
              tab === 'register'
                ? 'border-indigo-500 text-white bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(stripEmojis(e.target.value))}
                placeholder="e.g. dev_alex"
                className="w-full bg-slate-900 text-slate-100 placeholder-slate-600 text-sm px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <User className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>
          </div>

          {tab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(stripEmojis(e.target.value))}
                  placeholder="e.g. Alex Rivers"
                  className="w-full bg-slate-900 text-slate-100 placeholder-slate-600 text-sm px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Avatar Style Seed
                </label>
                <div className="flex items-center gap-2">
                  {['Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam'].map((seed) => (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => setAvatarSeed(seed)}
                      className={`p-1 rounded-xl border transition-all ${
                        avatarSeed === seed
                          ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={`https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`}
                        alt={seed}
                        className="w-8 h-8 rounded-lg bg-slate-800"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-900 text-slate-100 placeholder-slate-600 text-sm px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide transition-colors mt-2"
          >
            {loading
              ? 'Authenticating...'
              : tab === 'login'
              ? 'Log In'
              : 'Create Account'}
          </button>

          {/* Quick Demo Accounts Switcher */}
          <div className="pt-4 border-t border-slate-800">
            <div className="text-[11px] font-semibold uppercase text-slate-500 mb-2">
              Fast Switch Demo Profile
            </div>
            <div className="space-y-1.5">
              {allUsers
                .filter((u) => !u.isAiBot)
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => switchUserFast(u)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatarUrl}
                        alt={u.displayName}
                        className="w-6 h-6 rounded-full bg-slate-800"
                      />
                      <span className="text-xs font-medium text-slate-200">
                        {u.displayName}
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-mono">
                      @{u.username}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

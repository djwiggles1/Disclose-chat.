import React from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Compass, Sliders, Shield, User, ArrowLeftRight } from 'lucide-react';

export const ServerRail: React.FC = () => {
  const {
    servers,
    currentServer,
    setCurrentServerId,
    currentUser,
    openModal,
    layout,
    updateLayout,
  } = useApp();

  const isHorizontal = layout.serverRailPosition === 'top' || layout.serverRailPosition === 'bottom';

  return (
    <nav
      aria-label="Server Rail"
      className={`bg-slate-950 border-slate-800/80 shrink-0 z-30 select-none flex ${
        isHorizontal
          ? 'w-full h-14 flex-row items-center px-4 gap-2 border-b overflow-x-auto scrollbar-none'
          : 'w-[72px] h-full flex-col items-center py-3 gap-2 border-r overflow-y-auto scrollbar-none'
      }`}
    >
      {/* Home / Disclose Brand Mark */}
      <div className="relative group">
        <button
          onClick={() => {
            if (servers.length > 0) setCurrentServerId(servers[0].id);
          }}
          title="Disclose Home"
          className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 hover:rounded-xl transition-all duration-200 flex items-center justify-center text-white font-bold text-lg shadow-sm"
        >
          <Shield className="w-6 h-6 text-white" />
        </button>
        {/* Active bar */}
        {!isHorizontal && currentServer?.id === servers[0]?.id && (
          <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full" />
        )}
      </div>

      <div
        className={`${
          isHorizontal ? 'h-6 w-[1px] bg-slate-800 mx-1' : 'w-8 h-[1px] bg-slate-800 my-1'
        }`}
      />

      {/* Server List */}
      <div
        className={`flex ${
          isHorizontal ? 'flex-row items-center gap-2' : 'flex-col items-center gap-2 w-full'
        }`}
      >
        {servers.map((server) => {
          const isActive = currentServer?.id === server.id;
          return (
            <div key={server.id} className="relative group flex items-center justify-center">
              {/* Active pill indicator */}
              {!isHorizontal && (
                <span
                  className={`absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 bg-white rounded-r-full transition-all duration-200 ${
                    isActive ? 'h-8' : 'h-2 scale-0 group-hover:scale-100 group-hover:h-4'
                  }`}
                />
              )}

              <button
                onClick={() => setCurrentServerId(server.id)}
                title={server.name}
                style={{ backgroundColor: isActive ? server.iconBg : undefined }}
                className={`w-12 h-12 flex items-center justify-center font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? 'rounded-xl text-white shadow-md'
                    : 'rounded-2xl bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white hover:rounded-xl border border-slate-800'
                }`}
              >
                {server.iconInitials}
              </button>
            </div>
          );
        })}
      </div>

      <div
        className={`${
          isHorizontal ? 'h-6 w-[1px] bg-slate-800 mx-1' : 'w-8 h-[1px] bg-slate-800 my-1'
        }`}
      />

      {/* Action Buttons: Add Server, Join Server, Layout Customizer */}
      <div
        className={`flex ${
          isHorizontal ? 'flex-row items-center gap-2' : 'flex-col items-center gap-2'
        }`}
      >
        <button
          onClick={() => openModal('createServer')}
          title="Create New Server"
          className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-emerald-600 hover:rounded-xl text-emerald-400 hover:text-white border border-slate-800 transition-all duration-200 flex items-center justify-center"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={() => openModal('joinServer')}
          title="Join Server by Invite"
          className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-blue-600 hover:rounded-xl text-blue-400 hover:text-white border border-slate-800 transition-all duration-200 flex items-center justify-center"
        >
          <Compass className="w-5 h-5" />
        </button>

        <button
          onClick={() => openModal('layoutCustomizer')}
          title="Customize UI Layout & Reposition Sidebars"
          className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-amber-600 hover:rounded-xl text-amber-400 hover:text-white border border-slate-800 transition-all duration-200 flex items-center justify-center"
        >
          <Sliders className="w-5 h-5" />
        </button>
      </div>

      {/* Fast Reposition Handle (if handles enabled) */}
      {layout.enableCustomUiHandles && (
        <button
          onClick={() => {
            const nextPos =
              layout.serverRailPosition === 'left'
                ? 'right'
                : layout.serverRailPosition === 'right'
                ? 'top'
                : layout.serverRailPosition === 'top'
                ? 'bottom'
                : 'left';
            updateLayout({ serverRailPosition: nextPos });
          }}
          title="Quick Flip Rail Position"
          className="w-10 h-10 mt-auto rounded-lg bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-700/50 flex items-center justify-center text-xs"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
      )}

      {/* User profile / Auth button at rail bottom (if vertical) */}
      <div className={`${isHorizontal ? 'ml-auto' : 'mt-auto'}`}>
        <button
          onClick={() => openModal(currentUser ? 'userProfile' : 'auth')}
          title={currentUser ? `${currentUser.displayName} (${currentUser.username})` : 'Log In / Register'}
          className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-slate-800 hover:border-indigo-500 transition-all duration-200 flex items-center justify-center bg-slate-900"
        >
          {currentUser ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-slate-400" />
          )}
        </button>
      </div>
    </nav>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronDown,
  Hash,
  Volume2,
  Megaphone,
  Plus,
  Settings,
  UserPlus,
  Bot,
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';

export const ChannelSidebar: React.FC = () => {
  const {
    currentServer,
    currentChannel,
    setCurrentChannelId,
    currentUser,
    openModal,
    voiceState,
    connectVoice,
    disconnectVoice,
    toggleMute,
    toggleDeafen,
    layout,
    updateLayout,
  } = useApp();

  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  if (!currentServer) {
    return (
      <aside className="w-60 h-full bg-slate-900 border-r border-slate-800 flex items-center justify-center text-slate-500 text-sm">
        Select a server
      </aside>
    );
  }

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const isOwnerOrAdmin =
    currentServer.ownerId === currentUser?.id ||
    currentServer.members.some(
      (m) => m.userId === currentUser?.id && (m.role === 'owner' || m.role === 'admin')
    );

  return (
    <aside
      aria-label="Channels Sidebar"
      className="w-60 h-full bg-slate-900/95 border-r border-slate-800/80 flex flex-col shrink-0 select-none text-slate-300 relative"
    >
      {/* Server Header & Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
          className="w-full h-12 px-4 flex items-center justify-between font-semibold text-white hover:bg-slate-800/80 border-b border-slate-800/80 transition-colors"
        >
          <span className="truncate tracking-tight font-medium">{currentServer.name}</span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isServerMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Server Dropdown Menu */}
        {isServerMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsServerMenuOpen(false)}
            />
            <div className="absolute top-13 left-2 right-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 text-xs">
              <button
                onClick={() => {
                  setIsServerMenuOpen(false);
                  openModal('serverSettings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Server Settings & Moderation</span>
              </button>

              <button
                onClick={() => {
                  setIsServerMenuOpen(false);
                  openModal('createChannel');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Channel</span>
              </button>

              <button
                onClick={() => {
                  setIsServerMenuOpen(false);
                  openModal('aiDirector');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors"
              >
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>Cortex AI Channel Director</span>
              </button>

              <button
                onClick={() => {
                  setIsServerMenuOpen(false);
                  navigator.clipboard.writeText(currentServer.inviteCode);
                  alert(`Invite Code copied: ${currentServer.inviteCode}`);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Copy Invite Code ({currentServer.inviteCode})</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Quick Handle for Sidebar Reposition (if handles enabled) */}
      {layout.enableCustomUiHandles && (
        <div className="px-3 py-1 bg-indigo-950/60 border-b border-indigo-900/50 flex items-center justify-between text-[11px] text-indigo-300">
          <span>Sidebar: {layout.channelSidebarPosition}</span>
          <button
            onClick={() => {
              const next = layout.channelSidebarPosition === 'left' ? 'right' : 'left';
              updateLayout({ channelSidebarPosition: next });
            }}
            className="px-1.5 py-0.5 rounded bg-indigo-900 hover:bg-indigo-800 text-white"
          >
            Swap Side
          </button>
        </div>
      )}

      {/* Channel Categories & Channel Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {currentServer.categories.map((category) => {
          const categoryChannels = currentServer.channels.filter(
            (c) => c.categoryId === category.id
          );
          const isCollapsed = !!collapsedCategories[category.id];

          return (
            <div key={category.id} className="space-y-0.5">
              {/* Category Header */}
              <div className="flex items-center justify-between px-2 py-1 group cursor-pointer text-slate-400 hover:text-slate-200">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase"
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-150 ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  />
                  <span>{category.name}</span>
                </button>

                {isOwnerOrAdmin && (
                  <button
                    onClick={() => openModal('createChannel')}
                    title="Add Channel"
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white rounded transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Channels List */}
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {categoryChannels.map((channel) => {
                    const isActive = currentChannel?.id === channel.id;
                    const isVoice = channel.type === 'voice';
                    const isAnnouncement = channel.type === 'announcement';

                    return (
                      <button
                        key={channel.id}
                        onClick={() => {
                          if (isVoice) {
                            connectVoice(channel.id);
                          } else {
                            setCurrentChannelId(channel.id);
                          }
                        }}
                        className={`w-full group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-all duration-150 ${
                          isActive
                            ? 'bg-slate-800 text-white font-medium shadow-xs'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}
                      >
                        {channel.iconUrl ? (
                          <img
                            src={channel.iconUrl}
                            alt={channel.name}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded object-cover shrink-0 bg-slate-800"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : isVoice ? (
                          <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : isAnnouncement ? (
                          <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Hash className="w-4 h-4 text-slate-500 group-hover:text-slate-400 shrink-0" />
                        )}

                        <span className="truncate text-left">{channel.name}</span>

                        {isVoice && voiceState.currentChannelId === channel.id && (
                          <span className="ml-auto flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Voice Channel Connected Bar */}
      {voiceState.currentChannelId && (
        <div className="px-3 py-2 bg-slate-950 border-t border-slate-800/90 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between text-emerald-400 font-medium">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Voice Connected</span>
            </div>
            <button
              onClick={disconnectVoice}
              title="Disconnect Voice"
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded transition-colors"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[11px] text-slate-500 truncate">
            {currentServer.channels.find((c) => c.id === voiceState.currentChannelId)?.name || 'Audio Channel'}
          </span>
        </div>
      )}

      {/* User Account Footer Bar */}
      <div className="h-14 px-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between">
        {currentUser ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover bg-slate-800"
              />
              {/* Status indicator dot */}
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                  currentUser.status === 'online'
                    ? 'bg-emerald-500'
                    : currentUser.status === 'idle'
                    ? 'bg-amber-500'
                    : currentUser.status === 'dnd'
                    ? 'bg-red-500'
                    : 'bg-slate-500'
                }`}
              />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {currentUser.displayName}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                @{currentUser.username}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => openModal('auth')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Log In / Sign Up
          </button>
        )}

        {/* Audio & Settings Buttons */}
        <div className="flex items-center gap-0.5 text-slate-400">
          <button
            onClick={toggleMute}
            title={voiceState.isMuted ? 'Unmute' : 'Mute'}
            className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            {voiceState.isMuted ? (
              <MicOff className="w-4 h-4 text-red-400" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={toggleDeafen}
            title={voiceState.isDeafened ? 'Undeafen' : 'Deafen'}
            className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Headphones
              className={`w-4 h-4 ${voiceState.isDeafened ? 'text-red-400' : ''}`}
            />
          </button>
          <button
            onClick={() => openModal(currentUser ? 'userProfile' : 'auth')}
            title="User Profile & Settings"
            className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

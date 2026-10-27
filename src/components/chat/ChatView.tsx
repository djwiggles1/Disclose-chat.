import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Hash,
  Volume2,
  Megaphone,
  Search,
  Pin,
  Users,
  Sliders,
  Settings,
  Bot,
  Send,
  X,
  Reply,
  Check,
  Star,
  Shield,
  Radio,
  CornerDownRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { stripEmojis } from '../../utils/emojiSanitizer';

// Zero-emoji clean reaction options
const REACTION_OPTIONS = [
  { tag: '+1', label: 'Agree' },
  { tag: 'ACK', label: 'Acknowledge' },
  { tag: 'STAR', label: 'Star' },
  { tag: 'HEART', label: 'Appreciate' },
  { tag: 'NOTED', label: 'Noted' },
  { tag: 'WARN', label: 'Flag' },
];

export const ChatView: React.FC = () => {
  const {
    currentServer,
    currentChannel,
    messages,
    sendMessage,
    toggleReaction,
    togglePin,
    currentUser,
    openModal,
    searchQuery,
    setSearchQuery,
    isAiThinking,
    lastAiActionNotice,
    clearAiNotice,
    layout,
    updateLayout,
  } = useApp();

  const [inputContent, setInputContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string; content: string } | null>(null);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [showPinnedDrawer, setShowPinnedDrawer] = useState(false);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim()) return;

    const content = inputContent;
    setInputContent('');
    setSlashMenuOpen(false);
    const replyId = replyingTo?.id;
    setReplyingTo(null);

    await sendMessage(content, replyId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === '/' && inputContent.length === 0) {
      setSlashMenuOpen(true);
    } else if (e.key === 'Escape') {
      setSlashMenuOpen(false);
      setReplyingTo(null);
    }
  };

  const handleSelectSlashCommand = (cmd: string) => {
    setInputContent(cmd + ' ');
    setSlashMenuOpen(false);
  };

  if (!currentServer || !currentChannel) {
    return (
      <main className="flex-1 h-full bg-slate-950 flex flex-col items-center justify-center text-slate-500">
        <Hash className="w-12 h-12 mb-3 text-slate-700" />
        <p className="text-base font-medium">Select a channel to begin messaging</p>
      </main>
    );
  }

  // Filter messages if search query is active
  const displayedMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.authorName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const pinnedMessages = messages.filter((m) => m.pinned);

  // Render configured toolbar button
  const renderToolbarButton = (buttonId: string) => {
    switch (buttonId) {
      case 'ai-director':
        return (
          <button
            key={buttonId}
            onClick={() => openModal('aiDirector')}
            title="Cortex AI Server Director"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 transition-colors whitespace-nowrap"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cortex AI</span>
          </button>
        );
      case 'voice-stage':
        return (
          <button
            key={buttonId}
            onClick={() => openModal('voiceStage')}
            title="Voice Stage Simulator"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        );
      case 'search':
        return (
          <button
            key={buttonId}
            onClick={() => setShowSearchBox(!showSearchBox)}
            title="Search Messages"
            className={`p-1.5 rounded-md transition-colors ${
              showSearchBox || searchQuery
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
        );
      case 'pins':
        return (
          <button
            key={buttonId}
            onClick={() => setShowPinnedDrawer(!showPinnedDrawer)}
            title="Pinned Messages"
            className={`p-1.5 rounded-md transition-colors ${
              showPinnedDrawer
                ? 'bg-slate-800 text-amber-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Pin className="w-4 h-4" />
          </button>
        );
      case 'members':
        return (
          <button
            key={buttonId}
            onClick={() => {
              const next = layout.memberListPosition === 'hidden' ? 'right' : 'hidden';
              updateLayout({ memberListPosition: next });
            }}
            title="Toggle Member List"
            className={`p-1.5 rounded-md transition-colors ${
              layout.memberListPosition !== 'hidden'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
          </button>
        );
      case 'layout-editor':
        return (
          <button
            key={buttonId}
            onClick={() => openModal('layoutCustomizer')}
            title="UI Layout Customizer (Reposition Bars & Buttons)"
            className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-950/50 rounded-md transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>
        );
      case 'settings':
        return (
          <button
            key={buttonId}
            onClick={() => openModal('serverSettings')}
            title="Server Moderation & Settings"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        );
      default:
        return null;
    }
  };

  // Header Component (Can be placed Top, Bottom, or Floating Island)
  const headerContent = (
    <header className="h-12 px-4 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Channel Title & Topic */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="text-slate-400 shrink-0 flex items-center">
          {currentChannel.iconUrl ? (
            <img
              src={currentChannel.iconUrl}
              alt={currentChannel.name}
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-md object-cover bg-slate-800"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : currentChannel.type === 'voice' ? (
            <Volume2 className="w-5 h-5 text-emerald-400" />
          ) : currentChannel.type === 'announcement' ? (
            <Megaphone className="w-5 h-5 text-amber-400" />
          ) : (
            <Hash className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <h1 className="font-semibold text-white text-sm tracking-tight truncate">
          {currentChannel.name}
        </h1>
        {currentChannel.topic && (
          <>
            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">|</span>
            <span className="text-xs text-slate-400 truncate hidden sm:inline max-w-md">
              {currentChannel.topic}
            </span>
          </>
        )}
      </div>

      {/* Customizable Action Bar Toolbar */}
      <div className="flex items-center gap-1 shrink-0">
        {layout.toolbarButtons
          .filter((b) => b.visible)
          .sort((a, b) => a.order - b.order)
          .map((b) => renderToolbarButton(b.id))}
      </div>
    </header>
  );

  // Message Input Bar Component
  const inputBarContent = (
    <div
      className={`px-4 py-3 bg-slate-900/90 border-slate-800/80 relative z-20 ${
        layout.messageBarPosition === 'top'
          ? 'border-b order-first'
          : 'border-t'
      }`}
    >
      {/* Replying To Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between mb-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Replying to <strong className="text-white">@{replyingTo.authorName}</strong>:</span>
            <span className="text-slate-400 italic truncate max-w-xs">{replyingTo.content}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-0.5 hover:text-white rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Slash command menu preview */}
      {slashMenuOpen && (
        <div className="absolute bottom-full mb-2 left-4 right-4 bg-slate-950 border border-slate-800 rounded-xl p-2 shadow-2xl z-30">
          <div className="text-[11px] font-semibold text-slate-500 uppercase px-2 py-1">
            Cortex AI & Server Commands
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleSelectSlashCommand('/ai analyze-and-suggest')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-indigo-600 hover:text-white text-slate-300 flex items-center justify-between"
            >
              <span><strong>/ai analyze-and-suggest</strong> - Ask Cortex AI to suggest new channels</span>
              <span className="text-[10px] text-slate-500 font-mono">Gemini 3.8</span>
            </button>
            <button
              onClick={() => handleSelectSlashCommand('/create-channel name= topic=')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-indigo-600 hover:text-white text-slate-300 flex items-center justify-between"
            >
              <span><strong>/create-channel</strong> [name] [topic] - Create new text/voice channel</span>
              <span className="text-[10px] text-slate-500 font-mono">Channel Ops</span>
            </button>
            <button
              onClick={() => handleSelectSlashCommand('/rename-channel old= new=')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-indigo-600 hover:text-white text-slate-300 flex items-center justify-between"
            >
              <span><strong>/rename-channel</strong> [old] [new] - Reorganize channel name</span>
              <span className="text-[10px] text-slate-500 font-mono">Channel Ops</span>
            </button>
          </div>
        </div>
      )}

      {/* Input box */}
      <form onSubmit={handleSend} className="relative flex items-center">
        <textarea
          rows={1}
          value={inputContent}
          onChange={(e) => {
            setInputContent(stripEmojis(e.target.value));
            if (e.target.value.startsWith('/')) {
              setSlashMenuOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${currentChannel.name} (type @AI or / for commands, zero emojis)...`}
          className="w-full bg-slate-800/80 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-3 pr-12 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 border border-slate-700/60 resize-none max-h-32 leading-relaxed"
        />

        <button
          type="submit"
          disabled={!inputContent.trim()}
          title="Send Message"
          className="absolute right-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  return (
    <main className="flex-1 h-full bg-slate-950 flex flex-col min-w-0 relative overflow-hidden select-text">
      {/* Header Bar */}
      {headerContent}

      {/* Search Input Bar (if open) */}
      {showSearchBox && (
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages by content or author..."
              className="w-full bg-slate-800 text-slate-100 placeholder-slate-500 px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* AI Notification Banner */}
      {lastAiActionNotice && (
        <div className="px-4 py-2 bg-indigo-950/80 border-b border-indigo-800/80 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400 shrink-0" />
            <span><strong>Cortex AI:</strong> {lastAiActionNotice}</span>
          </div>
          <button
            onClick={clearAiNotice}
            className="p-1 hover:text-white text-indigo-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pinned Messages Drawer */}
      {showPinnedDrawer && (
        <div className="border-b border-slate-800 bg-slate-900/95 max-h-60 overflow-y-auto p-3 text-xs space-y-2">
          <div className="flex items-center justify-between font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-amber-400" />
              Pinned Messages ({pinnedMessages.length})
            </span>
            <button
              onClick={() => setShowPinnedDrawer(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {pinnedMessages.length === 0 ? (
            <p className="text-slate-500 py-2">No pinned messages in this channel.</p>
          ) : (
            pinnedMessages.map((pm) => (
              <div
                key={pm.id}
                className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-semibold text-slate-200">@{pm.authorName}</span>
                  <button
                    onClick={() => togglePin(pm.id)}
                    className="hover:text-red-400"
                    title="Unpin"
                  >
                    Unpin
                  </button>
                </div>
                <p className="text-slate-300">{pm.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Channel Welcome Banner */}
        <div className="py-6 border-b border-slate-800/60 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 mb-3 border border-slate-700 overflow-hidden">
            {currentChannel.iconUrl ? (
              <img
                src={currentChannel.iconUrl}
                alt={currentChannel.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : currentChannel.type === 'voice' ? (
              <Volume2 className="w-6 h-6 text-emerald-400" />
            ) : currentChannel.type === 'announcement' ? (
              <Megaphone className="w-6 h-6 text-amber-400" />
            ) : (
              <Hash className="w-6 h-6 text-slate-300" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            Welcome to #{currentChannel.name}!
          </h2>
          <p className="text-sm text-slate-400 max-w-lg">
            {currentChannel.topic || 'This is the start of the channel discussions.'}
          </p>
        </div>

        {/* Message Items */}
        {displayedMessages.map((msg) => {
          const isAi = msg.isAiBot || msg.authorId === 'bot_cortex';

          return (
            <div
              key={msg.id}
              className={`group relative flex items-start gap-3 rounded-lg px-2 py-1.5 transition-colors ${
                msg.pinned ? 'bg-amber-950/20 border border-amber-900/30' : 'hover:bg-slate-900/60'
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0 mt-0.5">
                <img
                  src={msg.authorAvatar}
                  alt={msg.authorName}
                  referrerPolicy="no-referrer"
                  className={`w-9 h-9 rounded-full object-cover bg-slate-800 border ${
                    isAi ? 'border-indigo-500 shadow-xs' : 'border-slate-800'
                  }`}
                />
              </div>

              {/* Message Body */}
              <div className="flex-1 min-w-0">
                {/* Reply Snippet if exists */}
                {msg.replyTo && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <CornerDownRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-medium text-slate-300">@{msg.replyTo.authorName}:</span>
                    <span className="truncate italic text-slate-400">{msg.replyTo.content}</span>
                  </div>
                )}

                {/* Author Name + Role + Timestamp */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-white hover:underline cursor-pointer">
                    {msg.authorName}
                  </span>

                  {isAi ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white uppercase tracking-wider">
                      AI DIRECTOR
                    </span>
                  ) : msg.authorRole === 'owner' ? (
                    <span className="text-[10px] font-medium text-amber-400">
                      Owner
                    </span>
                  ) : msg.authorRole === 'moderator' ? (
                    <span className="text-[10px] font-medium text-blue-400">
                      Mod
                    </span>
                  ) : null}

                  <span className="text-xs text-slate-500 tabular-nums">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {msg.pinned && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                </div>

                {/* AI Action Telemetry Tag */}
                {msg.aiActionMeta && (
                  <div className="mb-2 p-2 rounded-md bg-indigo-950/60 border border-indigo-800/60 text-xs text-indigo-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-white">System Architecture Change: </span>
                      <span>{msg.aiActionMeta.summary}</span>
                    </div>
                  </div>
                )}

                {/* Message Content */}
                <div className="text-sm text-slate-200 leading-relaxed break-words whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* Reaction Pills (strictly zero emojis, clean tags) */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {msg.reactions.map((reaction) => {
                      const userReacted = currentUser && reaction.users.includes(currentUser.id);

                      return (
                        <button
                          key={reaction.tag}
                          onClick={() => toggleReaction(msg.id, reaction.tag, reaction.label)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border transition-colors ${
                            userReacted
                              ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <span className="font-mono text-[11px]">[{reaction.tag}]</span>
                          <span className="tabular-nums">{reaction.count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Message Hover Actions */}
              <div className="absolute right-3 -top-3 hidden group-hover:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 shadow-lg z-10">
                {/* React trigger */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id)
                    }
                    title="Add Tag Reaction"
                    className="px-2 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded flex items-center gap-1"
                  >
                    <span>+Tag</span>
                  </button>

                  {/* Reaction Popup */}
                  {activeReactionMenu === msg.id && (
                    <div className="absolute bottom-full right-0 mb-1 bg-slate-950 border border-slate-800 rounded-xl p-1.5 shadow-xl flex items-center gap-1 z-30">
                      {REACTION_OPTIONS.map((opt) => (
                        <button
                          key={opt.tag}
                          onClick={() => {
                            toggleReaction(msg.id, opt.tag, opt.label);
                            setActiveReactionMenu(null);
                          }}
                          title={opt.label}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-mono font-medium border border-slate-800 transition-colors"
                        >
                          {opt.tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reply */}
                <button
                  onClick={() =>
                    setReplyingTo({
                      id: msg.id,
                      authorName: msg.authorName,
                      content: msg.content,
                    })
                  }
                  title="Reply"
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                >
                  <Reply className="w-3.5 h-3.5" />
                </button>

                {/* Pin */}
                <button
                  onClick={() => togglePin(msg.id)}
                  title={msg.pinned ? 'Unpin' : 'Pin'}
                  className={`p-1 rounded ${
                    msg.pinned
                      ? 'text-amber-400 hover:bg-slate-800'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* AI Thinking Indicator */}
        {isAiThinking && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-950/40 border border-indigo-900/50 text-indigo-300 text-xs animate-pulse">
            <Bot className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>Cortex AI is analyzing server architecture and processing command...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      {inputBarContent}
    </main>
  );
};

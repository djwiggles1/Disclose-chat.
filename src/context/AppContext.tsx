import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Server,
  Channel,
  Message,
  UILayoutConfig,
  VoiceState,
  ToolbarButtonItem,
  ServerRailPos,
  ChannelSidebarPos,
  MemberListPos,
  ActionBarPos,
  MessageBarPos,
  DensityMode,
  ThemePalette,
  PanelId,
} from '../types';
import { stripEmojis } from '../utils/emojiSanitizer';

const DEFAULT_TOOLBAR_BUTTONS: ToolbarButtonItem[] = [
  { id: 'ai-director', label: 'Cortex AI Director', icon: 'Bot', visible: true, order: 1 },
  { id: 'voice-stage', label: 'Voice Stage', icon: 'Volume2', visible: true, order: 2 },
  { id: 'search', label: 'Search', icon: 'Search', visible: true, order: 3 },
  { id: 'pins', label: 'Pinned Messages', icon: 'Pin', visible: true, order: 4 },
  { id: 'members', label: 'Toggle Members', icon: 'Users', visible: true, order: 5 },
  { id: 'layout-editor', label: 'UI Layout Studio', icon: 'Sliders', visible: true, order: 6 },
  { id: 'settings', label: 'Server Settings', icon: 'Settings', visible: true, order: 7 },
];

const DEFAULT_PANEL_ORDER: PanelId[] = ['rail', 'channels', 'chat', 'members'];

const DEFAULT_LAYOUT: UILayoutConfig = {
  serverRailPosition: 'left',
  channelSidebarPosition: 'left',
  memberListPosition: 'right',
  actionBarPosition: 'top',
  messageBarPosition: 'bottom',
  density: 'cozy',
  theme: 'slate-dark',
  toolbarButtons: DEFAULT_TOOLBAR_BUTTONS,
  enableCustomUiHandles: true,
  panelOrder: DEFAULT_PANEL_ORDER,
};

interface AppContextType {
  // Auth
  currentUser: User | null;
  allUsers: User[];
  token: string | null;
  login: (username: string, password?: string) => Promise<boolean>;
  register: (username: string, password?: string, displayName?: string, avatarUrl?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  switchUserFast: (user: User) => void;

  // Servers & Channels
  servers: Server[];
  currentServer: Server | null;
  currentChannel: Channel | null;
  setCurrentServerId: (id: string) => void;
  setCurrentChannelId: (id: string) => void;
  refreshServer: (id?: string) => Promise<void>;
  refreshServersList: () => Promise<void>;
  createServer: (name: string, description: string, iconBg?: string) => Promise<string | null>;
  joinServerByInvite: (inviteCode: string) => Promise<boolean>;
  createChannel: (
    name: string,
    categoryId: string,
    topic?: string,
    type?: 'text' | 'voice' | 'announcement',
    iconUrl?: string
  ) => Promise<void>;
  updateChannel: (channelId: string, updates: Partial<Channel>) => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  moderateMember: (memberId: string, action: 'kick' | 'mute' | 'setRole', role?: string, reason?: string) => Promise<void>;

  // Messaging & Real-Time
  messages: Message[];
  sendMessage: (content: string, replyToId?: string) => Promise<void>;
  toggleReaction: (messageId: string, tag: string, label: string) => Promise<void>;
  togglePin: (messageId: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // AI Assistant & Q&A
  isAiThinking: boolean;
  executeAiPrompt: (prompt: string) => Promise<void>;
  askAiQuestion: (prompt: string, history?: Array<{ role: 'user' | 'model'; content: string }>) => Promise<string>;
  lastAiActionNotice: string | null;
  clearAiNotice: () => void;

  // Voice State
  voiceState: VoiceState;
  connectVoice: (channelId: string) => void;
  disconnectVoice: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleScreenShare: () => void;

  // UI Layout Customization & Drag-and-Drop
  layout: UILayoutConfig;
  updateLayout: (updates: Partial<UILayoutConfig>) => void;
  reorderPanels: (newOrder: PanelId[]) => void;
  movePanel: (fromIndex: number, toIndex: number) => void;
  reorderToolbarButtons: (newButtons: ToolbarButtonItem[]) => void;
  resetLayout: () => void;
  applyPreset: (presetName: 'classic' | 'inverted' | 'top-rail' | 'terminal') => void;

  // Modals
  activeModal: string | null;
  openModal: (modalName: string) => void;
  closeModal: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const broadcastChannel = typeof window !== 'undefined' ? new BroadcastChannel('disclose_sync_bus') : null;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('disclose_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default demo user: Alex Rivers
    return {
      id: 'user_alex',
      username: 'alex',
      displayName: 'Alex Rivers',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=Alex',
      status: 'online',
      customStatus: 'Refactoring modular layout system',
      createdAt: new Date().toISOString(),
    };
  });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('disclose_token') || 'token_user_alex');

  // Server & Channel state
  const [servers, setServers] = useState<Server[]>([]);
  const [currentServer, setCurrentServer] = useState<Server | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // AI & Voice state
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastAiActionNotice, setLastAiActionNotice] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const [voiceState, setVoiceState] = useState<VoiceState>({
    currentChannelId: null,
    currentServerId: null,
    isMuted: false,
    isDeafened: false,
    isSpeaking: false,
    isScreenSharing: false,
    connectedMembers: [],
  });

  // Layout customizer state with panel order
  const [layout, setLayout] = useState<UILayoutConfig>(() => {
    const saved = localStorage.getItem('disclose_layout_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_LAYOUT,
          ...parsed,
          panelOrder: parsed.panelOrder || DEFAULT_PANEL_ORDER,
        };
      } catch {
        return DEFAULT_LAYOUT;
      }
    }
    return DEFAULT_LAYOUT;
  });

  const updateLayout = useCallback((updates: Partial<UILayoutConfig>) => {
    setLayout((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('disclose_layout_v2', JSON.stringify(next));
      return next;
    });
  }, []);

  const reorderPanels = useCallback((newOrder: PanelId[]) => {
    updateLayout({ panelOrder: newOrder });
  }, [updateLayout]);

  const movePanel = useCallback((fromIndex: number, toIndex: number) => {
    setLayout((prev) => {
      const current = [...(prev.panelOrder || DEFAULT_PANEL_ORDER)];
      const [moved] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, moved);
      const next = { ...prev, panelOrder: current };
      localStorage.setItem('disclose_layout_v2', JSON.stringify(next));
      return next;
    });
  }, []);

  const reorderToolbarButtons = useCallback((newButtons: ToolbarButtonItem[]) => {
    updateLayout({ toolbarButtons: newButtons });
  }, [updateLayout]);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    localStorage.removeItem('disclose_layout_v2');
  }, []);

  const applyPreset = useCallback((presetName: 'classic' | 'inverted' | 'top-rail' | 'terminal') => {
    let preset: Partial<UILayoutConfig> = {};
    if (presetName === 'classic') {
      preset = {
        serverRailPosition: 'left',
        channelSidebarPosition: 'left',
        memberListPosition: 'right',
        actionBarPosition: 'top',
        messageBarPosition: 'bottom',
        density: 'cozy',
        panelOrder: ['rail', 'channels', 'chat', 'members'],
      };
    } else if (presetName === 'inverted') {
      preset = {
        serverRailPosition: 'right',
        channelSidebarPosition: 'right',
        memberListPosition: 'left',
        actionBarPosition: 'top',
        messageBarPosition: 'bottom',
        density: 'cozy',
        panelOrder: ['members', 'chat', 'channels', 'rail'],
      };
    } else if (presetName === 'top-rail') {
      preset = {
        serverRailPosition: 'top',
        channelSidebarPosition: 'left',
        memberListPosition: 'right',
        actionBarPosition: 'top',
        messageBarPosition: 'bottom',
        density: 'compact',
        panelOrder: ['channels', 'chat', 'members'],
      };
    } else if (presetName === 'terminal') {
      preset = {
        serverRailPosition: 'left',
        channelSidebarPosition: 'left',
        memberListPosition: 'hidden',
        actionBarPosition: 'top',
        messageBarPosition: 'bottom',
        density: 'compact',
        theme: 'terminal-forest',
        panelOrder: ['rail', 'channels', 'chat'],
      };
    }
    updateLayout(preset);
  }, [updateLayout]);

  // Fetch list of servers
  const refreshServersList = useCallback(async () => {
    try {
      const res = await fetch('/api/servers');
      if (res.ok) {
        const data = await res.json();
        setServers(data.servers || []);
      }
    } catch (e) {
      console.error('Failed to fetch servers:', e);
    }
  }, []);

  // Fetch full details of current server
  const refreshServer = useCallback(async (serverIdToFetch?: string) => {
    const sId = serverIdToFetch || currentServer?.id;
    if (!sId) return;

    try {
      const res = await fetch(`/api/servers/${sId}`);
      if (res.ok) {
        const data = await res.json();
        const serverData: Server = data.server;
        setCurrentServer(serverData);

        // Keep or select active channel
        setCurrentChannel((prevChan) => {
          if (prevChan && serverData.channels.some((c) => c.id === prevChan.id)) {
            return serverData.channels.find((c) => c.id === prevChan.id) || serverData.channels[0] || null;
          }
          return serverData.channels[0] || null;
        });
      }
    } catch (e) {
      console.error('Failed to fetch server details:', e);
    }
  }, [currentServer?.id]);

  // Fetch messages for active channel
  const refreshMessages = useCallback(async (channelIdToFetch?: string) => {
    const cId = channelIdToFetch || currentChannel?.id;
    if (!cId) return;

    try {
      const res = await fetch(`/api/channels/${cId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    }
  }, [currentChannel?.id]);

  // Fetch all known users for fast switcher & member displays
  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || []);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  }, []);

  // Initial Boot
  useEffect(() => {
    refreshServersList();
    refreshUsers();
  }, [refreshServersList, refreshUsers]);

  // Set default server if none selected
  useEffect(() => {
    if (servers.length > 0 && !currentServer) {
      refreshServer(servers[0].id);
    }
  }, [servers, currentServer, refreshServer]);

  // Refresh messages when channel changes
  useEffect(() => {
    if (currentChannel) {
      refreshMessages(currentChannel.id);
    }
  }, [currentChannel?.id, refreshMessages]);

  // ---------------------------------------------------------
  // Server-Sent Events (SSE) Listener: Instant Real-Time Sync for Friends
  // ---------------------------------------------------------
  useEffect(() => {
    let sse: EventSource | null = null;
    try {
      sse = new EventSource('/api/stream');

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_MESSAGE') {
            if (data.channelId === currentChannel?.id) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === data.message.id)) return prev;
                return [...prev, data.message];
              });
            }
          } else if (data.type === 'MESSAGE_REACTIONS_UPDATED') {
            if (data.channelId === currentChannel?.id) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === data.messageId ? { ...m, reactions: data.reactions } : m
                )
              );
            }
          } else if (data.type === 'MESSAGE_PIN_UPDATED') {
            if (data.channelId === currentChannel?.id) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === data.messageId ? { ...m, pinned: data.pinned } : m
                )
              );
            }
          } else if (
            data.type === 'CHANNEL_CREATED' ||
            data.type === 'CHANNEL_UPDATED' ||
            data.type === 'CHANNEL_DELETED' ||
            data.type === 'CATEGORY_CREATED'
          ) {
            refreshServer(currentServer?.id);
          } else if (
            data.type === 'MEMBER_JOINED' ||
            data.type === 'MEMBER_KICKED' ||
            data.type === 'MEMBER_MUTED' ||
            data.type === 'MEMBER_ROLE_CHANGED'
          ) {
            refreshServer(currentServer?.id);
            refreshUsers();
          } else if (data.type === 'SERVER_CREATED') {
            refreshServersList();
          }
        } catch (e) {
          // ignore heartbeat / invalid JSON
        }
      };

      sse.onerror = () => {
        // SSE will attempt reconnect automatically
      };
    } catch (e) {
      console.error('SSE initialization error:', e);
    }

    return () => {
      sse?.close();
    };
  }, [currentChannel?.id, currentServer?.id, refreshMessages, refreshServer, refreshServersList, refreshUsers]);

  // Listen to BroadcastChannel for multi-tab instantaneous synchronization
  useEffect(() => {
    if (!broadcastChannel) return;

    const handleBroadcast = (event: MessageEvent) => {
      const { type, serverId, channelId } = event.data || {};
      if (type === 'MESSAGE_SENT' || type === 'REACTION_UPDATED' || type === 'PIN_TOGGLED') {
        if (channelId === currentChannel?.id) {
          refreshMessages(channelId);
        }
      } else if (type === 'SERVER_MUTATED' || type === 'CHANNEL_OPS') {
        refreshServersList();
        if (serverId === currentServer?.id) {
          refreshServer(serverId);
          refreshMessages();
        }
      }
    };

    broadcastChannel.addEventListener('message', handleBroadcast);
    return () => {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    };
  }, [currentChannel?.id, currentServer?.id, refreshMessages, refreshServer, refreshServersList]);

  // Authentication Handlers
  const login = async (username: string, password = 'password123') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setToken(data.token);
        localStorage.setItem('disclose_user', JSON.stringify(data.user));
        localStorage.setItem('disclose_token', data.token);
        closeModal();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const register = async (username: string, password = 'password123', displayName?: string, avatarUrl?: string) => {
    try {
      const cleanName = stripEmojis(displayName || username);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: stripEmojis(username),
          password,
          displayName: cleanName,
          avatarUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setToken(data.token);
        localStorage.setItem('disclose_user', JSON.stringify(data.user));
        localStorage.setItem('disclose_token', data.token);
        await refreshServersList();
        await refreshUsers();
        closeModal();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('disclose_user');
    localStorage.removeItem('disclose_token');
  };

  const switchUserFast = (user: User) => {
    setCurrentUser(user);
    setToken(`token_${user.id}`);
    localStorage.setItem('disclose_user', JSON.stringify(user));
    localStorage.setItem('disclose_token', `token_${user.id}`);
    closeModal();
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          displayName: updates.displayName ? stripEmojis(updates.displayName) : undefined,
          avatarUrl: updates.avatarUrl,
          status: updates.status,
          customStatus: updates.customStatus ? stripEmojis(updates.customStatus) : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem('disclose_user', JSON.stringify(data.user));
        refreshUsers();
      }
    } catch (e) {
      console.error('Failed to update profile:', e);
    }
  };

  // Server Management Handlers
  const setCurrentServerId = (id: string) => {
    refreshServer(id);
  };

  const setCurrentChannelId = (id: string) => {
    if (!currentServer) return;
    const chan = currentServer.channels.find((c) => c.id === id);
    if (chan) {
      setCurrentChannel(chan);
      refreshMessages(chan.id);
    }
  };

  const createServer = async (name: string, description: string, iconBg?: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: stripEmojis(name),
          description: stripEmojis(description),
          ownerId: currentUser?.id,
          iconBg,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await refreshServersList();
        setCurrentServerId(data.server.id);
        broadcastChannel?.postMessage({ type: 'SERVER_MUTATED', serverId: data.server.id });
        closeModal();
        return data.server.id;
      }
      return null;
    } catch {
      return null;
    }
  };

  const joinServerByInvite = async (inviteCode: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/servers/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: stripEmojis(inviteCode),
          userId: currentUser?.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await refreshServersList();
        setCurrentServerId(data.serverId);
        broadcastChannel?.postMessage({ type: 'SERVER_MUTATED', serverId: data.serverId });
        closeModal();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const createChannel = async (
    name: string,
    categoryId: string,
    topic?: string,
    type: 'text' | 'voice' | 'announcement' = 'text',
    iconUrl?: string
  ) => {
    if (!currentServer) return;
    try {
      const res = await fetch(`/api/servers/${currentServer.id}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: stripEmojis(name),
          categoryId,
          topic: stripEmojis(topic || ''),
          type,
          iconUrl,
          actorId: currentUser?.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await refreshServer(currentServer.id);
        setCurrentChannel(data.channel);
        broadcastChannel?.postMessage({ type: 'CHANNEL_OPS', serverId: currentServer.id });
        closeModal();
      }
    } catch (e) {
      console.error('Failed to create channel:', e);
    }
  };

  const updateChannel = async (channelId: string, updates: Partial<Channel>) => {
    if (!currentServer) return;
    try {
      const res = await fetch(`/api/servers/${currentServer.id}/channels/${channelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          name: updates.name ? stripEmojis(updates.name) : undefined,
          topic: updates.topic ? stripEmojis(updates.topic) : undefined,
          actorId: currentUser?.id,
        }),
      });
      if (res.ok) {
        await refreshServer(currentServer.id);
        broadcastChannel?.postMessage({ type: 'CHANNEL_OPS', serverId: currentServer.id });
      }
    } catch (e) {
      console.error('Failed to update channel:', e);
    }
  };

  const deleteChannel = async (channelId: string) => {
    if (!currentServer) return;
    try {
      const res = await fetch(`/api/servers/${currentServer.id}/channels/${channelId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: currentUser?.id }),
      });
      if (res.ok) {
        await refreshServer(currentServer.id);
        broadcastChannel?.postMessage({ type: 'CHANNEL_OPS', serverId: currentServer.id });
      }
    } catch (e) {
      console.error('Failed to delete channel:', e);
    }
  };

  const createCategory = async (name: string) => {
    if (!currentServer) return;
    try {
      const res = await fetch(`/api/servers/${currentServer.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: stripEmojis(name),
          actorId: currentUser?.id,
        }),
      });
      if (res.ok) {
        await refreshServer(currentServer.id);
        broadcastChannel?.postMessage({ type: 'CHANNEL_OPS', serverId: currentServer.id });
      }
    } catch (e) {
      console.error('Failed to create category:', e);
    }
  };

  const moderateMember = async (
    memberId: string,
    action: 'kick' | 'mute' | 'setRole',
    role?: string,
    reason?: string
  ) => {
    if (!currentServer) return;
    try {
      const res = await fetch(`/api/servers/${currentServer.id}/members/${memberId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          role,
          actorId: currentUser?.id,
          reason: stripEmojis(reason || ''),
        }),
      });
      if (res.ok) {
        await refreshServer(currentServer.id);
        broadcastChannel?.postMessage({ type: 'SERVER_MUTATED', serverId: currentServer.id });
      }
    } catch (e) {
      console.error('Failed to moderate member:', e);
    }
  };

  // Messaging & Real-Time Handlers
  const sendMessage = async (content: string, replyToId?: string) => {
    if (!currentChannel || !currentServer || !content.trim()) return;

    const cleanContent = stripEmojis(content);
    if (!cleanContent) return;

    let replySnippet: { id: string; authorName: string; content: string } | undefined;
    if (replyToId) {
      const target = messages.find((m) => m.id === replyToId);
      if (target) {
        replySnippet = {
          id: target.id,
          authorName: target.authorName,
          content: target.content.slice(0, 100),
        };
      }
    }

    try {
      const isAiSummon =
        cleanContent.includes('@cortex') ||
        cleanContent.includes('@ai') ||
        cleanContent.startsWith('/ai') ||
        cleanContent.startsWith('/ask');

      if (isAiSummon) {
        setIsAiThinking(true);
      }

      const res = await fetch(`/api/channels/${currentChannel.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          authorId: currentUser?.id || 'user_guest',
          content: cleanContent,
          replyTo: replySnippet,
        }),
      });

      if (res.ok) {
        await refreshMessages(currentChannel.id);
        if (isAiSummon) {
          await refreshServer(currentServer.id);
          setIsAiThinking(false);
        }
        broadcastChannel?.postMessage({
          type: 'MESSAGE_SENT',
          channelId: currentChannel.id,
          serverId: currentServer.id,
        });
      }
    } catch (e) {
      console.error('Failed to send message:', e);
      setIsAiThinking(false);
    }
  };

  const toggleReaction = async (messageId: string, tag: string, label: string) => {
    if (!currentChannel || !currentUser) return;
    try {
      const res = await fetch(`/api/channels/${currentChannel.id}/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: stripEmojis(tag),
          label: stripEmojis(label),
          userId: currentUser.id,
        }),
      });
      if (res.ok) {
        await refreshMessages(currentChannel.id);
        broadcastChannel?.postMessage({
          type: 'REACTION_UPDATED',
          channelId: currentChannel.id,
        });
      }
    } catch (e) {
      console.error('Failed to toggle reaction:', e);
    }
  };

  const togglePin = async (messageId: string) => {
    if (!currentChannel) return;
    try {
      const res = await fetch(`/api/channels/${currentChannel.id}/messages/${messageId}/pin`, {
        method: 'POST',
      });
      if (res.ok) {
        await refreshMessages(currentChannel.id);
        broadcastChannel?.postMessage({
          type: 'PIN_TOGGLED',
          channelId: currentChannel.id,
        });
      }
    } catch (e) {
      console.error('Failed to toggle pin:', e);
    }
  };

  // Direct AI Prompt from AI Director panel
  const executeAiPrompt = async (prompt: string) => {
    if (!currentServer) return;
    setIsAiThinking(true);
    setLastAiActionNotice(null);

    try {
      const res = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          channelId: currentChannel?.id,
          prompt: stripEmojis(prompt),
          requesterName: currentUser?.displayName || 'User',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await refreshServer(currentServer.id);
        if (currentChannel) {
          await refreshMessages(currentChannel.id);
        }
        if (data.message?.aiActionMeta?.summary) {
          setLastAiActionNotice(data.message.aiActionMeta.summary);
        } else {
          setLastAiActionNotice('Action executed successfully.');
        }
        broadcastChannel?.postMessage({
          type: 'CHANNEL_OPS',
          serverId: currentServer.id,
        });
      }
    } catch (e) {
      console.error('Failed to execute AI prompt:', e);
      setLastAiActionNotice('Failed to communicate with AI model.');
    } finally {
      setIsAiThinking(false);
    }
  };

  // Direct multi-turn question asking
  const askAiQuestion = async (
    prompt: string,
    history?: Array<{ role: 'user' | 'model'; content: string }>
  ): Promise<string> => {
    setIsAiThinking(true);
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: stripEmojis(prompt),
          history,
          serverId: currentServer?.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.response || 'No response generated.';
      }
      return 'Failed to get answer from AI.';
    } catch (e) {
      console.error('AI ask error:', e);
      return 'Error connecting to AI service.';
    } finally {
      setIsAiThinking(false);
    }
  };

  const clearAiNotice = () => setLastAiActionNotice(null);

  // Voice Controls
  const connectVoice = (channelId: string) => {
    if (!currentServer || !currentUser) return;
    setVoiceState({
      currentChannelId: channelId,
      currentServerId: currentServer.id,
      isMuted: false,
      isDeafened: false,
      isSpeaking: false,
      isScreenSharing: false,
      connectedMembers: [
        {
          userId: currentUser.id,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.avatarUrl,
          isSpeaking: false,
        },
        {
          userId: 'user_taylor',
          displayName: 'Taylor Chen',
          avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=Taylor',
          isSpeaking: true,
        },
      ],
    });
  };

  const disconnectVoice = () => {
    setVoiceState((prev) => ({
      ...prev,
      currentChannelId: null,
      currentServerId: null,
      connectedMembers: [],
    }));
  };

  const toggleMute = () => {
    setVoiceState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleDeafen = () => {
    setVoiceState((prev) => ({
      ...prev,
      isDeafened: !prev.isDeafened,
      isMuted: !prev.isDeafened ? true : prev.isMuted,
    }));
  };

  const toggleScreenShare = () => {
    setVoiceState((prev) => ({ ...prev, isScreenSharing: !prev.isScreenSharing }));
  };

  const openModal = (modalName: string) => setActiveModal(modalName);
  const closeModal = () => setActiveModal(null);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers,
        token,
        login,
        register,
        logout,
        updateProfile,
        switchUserFast,
        servers,
        currentServer,
        currentChannel,
        setCurrentServerId,
        setCurrentChannelId,
        refreshServer,
        refreshServersList,
        createServer,
        joinServerByInvite,
        createChannel,
        updateChannel,
        deleteChannel,
        createCategory,
        moderateMember,
        messages,
        sendMessage,
        toggleReaction,
        togglePin,
        searchQuery,
        setSearchQuery,
        isAiThinking,
        executeAiPrompt,
        askAiQuestion,
        lastAiActionNotice,
        clearAiNotice,
        voiceState,
        connectVoice,
        disconnectVoice,
        toggleMute,
        toggleDeafen,
        toggleScreenShare,
        layout,
        updateLayout,
        reorderPanels,
        movePanel,
        reorderToolbarButtons,
        resetLayout,
        applyPreset,
        activeModal,
        openModal,
        closeModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

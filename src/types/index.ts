/**
 * Core type definitions for Disclose - Modular Server & Channel Hub
 * Note: Strictly zero emojis across all schemas and types.
 */

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export type UserRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  status: UserStatus;
  customStatus?: string;
  isAiBot?: boolean;
  createdAt: string;
}

export type ChannelType = 'text' | 'voice' | 'announcement';

export interface Channel {
  id: string;
  serverId: string;
  categoryId: string;
  name: string;
  topic: string;
  type: ChannelType;
  iconUrl?: string;
  isSlowMode?: boolean;
  slowModeSeconds?: number;
  isArchived?: boolean;
  order: number;
  createdAt: string;
}

export interface Category {
  id: string;
  serverId: string;
  name: string;
  order: number;
}

export interface ServerMember {
  userId: string;
  role: UserRole;
  joinedAt: string;
  isMuted?: boolean;
  isBanned?: boolean;
}

export interface AuditEntry {
  id: string;
  serverId: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
  timestamp: string;
  isAiAction?: boolean;
}

export interface Server {
  id: string;
  name: string;
  iconInitials: string;
  iconBg: string;
  ownerId: string;
  description: string;
  inviteCode: string;
  categories: Category[];
  channels: Channel[];
  members: ServerMember[];
  auditLog: AuditEntry[];
  createdAt: string;
}

export interface Reaction {
  tag: string; // e.g. "+1", "ACK", "STAR", "HEART", "WARN", "NOTED"
  label: string;
  count: number;
  users: string[]; // user IDs
}

export interface Message {
  id: string;
  channelId: string;
  serverId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  content: string;
  timestamp: string;
  pinned?: boolean;
  edited?: boolean;
  reactions: Reaction[];
  replyTo?: {
    id: string;
    authorName: string;
    content: string;
  };
  isAiBot?: boolean;
  aiActionMeta?: {
    actionType: string;
    summary: string;
    affectedChannels?: string[];
  };
}

// Customizable UI Layout Configuration
export type ServerRailPos = 'left' | 'right' | 'top' | 'bottom';
export type ChannelSidebarPos = 'left' | 'right' | 'drawer';
export type MemberListPos = 'right' | 'left' | 'drawer' | 'hidden';
export type ActionBarPos = 'top' | 'bottom' | 'floating';
export type MessageBarPos = 'bottom' | 'top' | 'floating';
export type DensityMode = 'compact' | 'cozy';
export type ThemePalette = 'slate-dark' | 'midnight' | 'amoled' | 'terminal-forest';

export interface ToolbarButtonItem {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  order: number;
}

export type PanelId = 'rail' | 'channels' | 'chat' | 'members';

export interface UILayoutConfig {
  serverRailPosition: ServerRailPos;
  channelSidebarPosition: ChannelSidebarPos;
  memberListPosition: MemberListPos;
  actionBarPosition: ActionBarPos;
  messageBarPosition: MessageBarPos;
  density: DensityMode;
  theme: ThemePalette;
  toolbarButtons: ToolbarButtonItem[];
  enableCustomUiHandles: boolean;
  panelOrder: PanelId[];
}

export interface VoiceState {
  currentChannelId: string | null;
  currentServerId: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  connectedMembers: {
    userId: string;
    displayName: string;
    avatarUrl: string;
    isSpeaking: boolean;
  }[];
}

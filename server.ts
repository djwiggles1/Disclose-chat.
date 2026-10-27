import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Strict Emoji Filter to enforce zero-emoji discipline
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/gu;
function cleanText(str: string): string {
  if (!str) return '';
  return str.replace(EMOJI_REGEX, '').replace(/\s{2,}/g, ' ').trim();
}

function sanitizeChannel(name: string): string {
  return cleanText(name)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'channel';
}

// ---------------------------------------------------------
// Persistent In-Memory + Disk Storage
// ---------------------------------------------------------

export interface StoredUser {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  avatarUrl: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  isAiBot?: boolean;
  createdAt: string;
}

export interface StoredChannel {
  id: string;
  serverId: string;
  categoryId: string;
  name: string;
  topic: string;
  type: 'text' | 'voice' | 'announcement';
  iconUrl?: string;
  isSlowMode?: boolean;
  slowModeSeconds?: number;
  isArchived?: boolean;
  order: number;
  createdAt: string;
}

export interface StoredCategory {
  id: string;
  serverId: string;
  name: string;
  order: number;
}

export interface StoredMember {
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: string;
  isMuted?: boolean;
  isBanned?: boolean;
}

export interface StoredAudit {
  id: string;
  serverId: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
  timestamp: string;
  isAiAction?: boolean;
}

export interface StoredServer {
  id: string;
  name: string;
  iconInitials: string;
  iconBg: string;
  ownerId: string;
  description: string;
  inviteCode: string;
  categories: StoredCategory[];
  channels: StoredChannel[];
  members: StoredMember[];
  auditLog: StoredAudit[];
  createdAt: string;
}

export interface StoredMessage {
  id: string;
  channelId: string;
  serverId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: 'owner' | 'admin' | 'moderator' | 'member';
  content: string;
  timestamp: string;
  pinned?: boolean;
  edited?: boolean;
  reactions: {
    tag: string;
    label: string;
    count: number;
    users: string[];
  }[];
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

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'disclose-db.json');

// Initial Seeds
const initialUsers: StoredUser[] = [
  {
    id: 'user_alex',
    username: 'alex',
    password: 'password123',
    displayName: 'Alex Rivers',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=Alex',
    status: 'online',
    customStatus: 'Refactoring modular layout system',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_jordan',
    username: 'jordan',
    password: 'password123',
    displayName: 'Jordan Vance',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=Jordan',
    status: 'idle',
    customStatus: 'Reviewing pull requests',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_taylor',
    username: 'taylor',
    password: 'password123',
    displayName: 'Taylor Chen',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=Taylor',
    status: 'dnd',
    customStatus: 'Deploying edge clusters',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bot_cortex',
    username: 'cortex_ai',
    displayName: 'Cortex AI',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=CortexAI',
    status: 'online',
    customStatus: 'Resident Intelligence & Channel Director (Gemini 3.8)',
    isAiBot: true,
    createdAt: new Date().toISOString(),
  },
];

const initialServers: StoredServer[] = [
  {
    id: 'srv_core',
    name: 'Disclose Engineering',
    iconInitials: 'DE',
    iconBg: '#3B82F6',
    ownerId: 'user_alex',
    description: 'Central engineering hub and real-time infrastructure discussion.',
    inviteCode: 'DISCLOSE-CORE',
    createdAt: new Date().toISOString(),
    categories: [
      { id: 'cat_welcome', serverId: 'srv_core', name: 'INFORMATION', order: 1 },
      { id: 'cat_text', serverId: 'srv_core', name: 'TEXT CHANNELS', order: 2 },
      { id: 'cat_dev', serverId: 'srv_core', name: 'DEVELOPMENT', order: 3 },
      { id: 'cat_voice', serverId: 'srv_core', name: 'VOICE LOUNGE', order: 4 },
    ],
    channels: [
      {
        id: 'chan_announcements',
        serverId: 'srv_core',
        categoryId: 'cat_welcome',
        name: 'announcements',
        topic: 'Official infrastructure and product releases.',
        type: 'announcement',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=Announce',
        order: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'chan_general',
        serverId: 'srv_core',
        categoryId: 'cat_text',
        name: 'general',
        topic: 'Real-time team chat. Ask questions or summon Cortex AI with @AI or /ai commands.',
        type: 'text',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=General',
        order: 2,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'chan_architecture',
        serverId: 'srv_core',
        categoryId: 'cat_dev',
        name: 'architecture',
        topic: 'System design, UI repositioning engine, and state machines.',
        type: 'text',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=Architecture',
        order: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'chan_ai_ops',
        serverId: 'srv_core',
        categoryId: 'cat_dev',
        name: 'ai-director-log',
        topic: 'Automated channel management events and Gemini action telemetry.',
        type: 'text',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=CortexLog',
        order: 4,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'chan_standup_voice',
        serverId: 'srv_core',
        categoryId: 'cat_voice',
        name: 'Team Standup',
        topic: 'Daily sync and low-latency audio channel.',
        type: 'voice',
        order: 5,
        createdAt: new Date().toISOString(),
      },
    ],
    members: [
      { userId: 'user_alex', role: 'owner', joinedAt: new Date().toISOString() },
      { userId: 'user_jordan', role: 'moderator', joinedAt: new Date().toISOString() },
      { userId: 'user_taylor', role: 'member', joinedAt: new Date().toISOString() },
      { userId: 'bot_cortex', role: 'admin', joinedAt: new Date().toISOString() },
    ],
    auditLog: [
      {
        id: 'aud_init_1',
        serverId: 'srv_core',
        actorId: 'user_alex',
        actorName: 'Alex Rivers',
        action: 'SERVER_CREATED',
        details: 'Initialized Disclose Engineering server.',
        timestamp: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'srv_design',
    name: 'Interface Systems',
    iconInitials: 'IS',
    iconBg: '#10B981',
    ownerId: 'user_alex',
    description: 'Design tokens, layout docking systems, and typography.',
    inviteCode: 'DESIGN-SYSTEMS',
    createdAt: new Date().toISOString(),
    categories: [
      { id: 'cat_d_text', serverId: 'srv_design', name: 'DISCUSSIONS', order: 1 },
      { id: 'cat_d_crit', serverId: 'srv_design', name: 'CRITIQUE & REVIEWS', order: 2 },
    ],
    channels: [
      {
        id: 'chan_d_general',
        serverId: 'srv_design',
        categoryId: 'cat_d_text',
        name: 'design-tokens',
        topic: 'Color systems, zero-pill discipline, and typography pairings.',
        type: 'text',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=Tokens',
        order: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'chan_d_layouts',
        serverId: 'srv_design',
        categoryId: 'cat_d_crit',
        name: 'repositionable-ui',
        topic: 'Docking configurations, drag handles, and layout presets.',
        type: 'text',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=Layouts',
        order: 2,
        createdAt: new Date().toISOString(),
      },
    ],
    members: [
      { userId: 'user_alex', role: 'owner', joinedAt: new Date().toISOString() },
      { userId: 'user_jordan', role: 'member', joinedAt: new Date().toISOString() },
      { userId: 'bot_cortex', role: 'admin', joinedAt: new Date().toISOString() },
    ],
    auditLog: [],
  },
];

const initialMessages: StoredMessage[] = [
  {
    id: 'msg_1',
    channelId: 'chan_announcements',
    serverId: 'srv_core',
    authorId: 'user_alex',
    authorName: 'Alex Rivers',
    authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Alex',
    authorRole: 'owner',
    content: 'Welcome to Disclose. This workspace features customizable layout positioning for all sidebars and buttons, zero emojis, and built-in AI channel management.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    pinned: true,
    reactions: [
      { tag: 'ACK', label: 'Acknowledged', count: 3, users: ['user_jordan', 'user_taylor', 'user_alex'] },
      { tag: '+1', label: 'Agree', count: 2, users: ['user_jordan', 'user_taylor'] },
    ],
  },
  {
    id: 'msg_2',
    channelId: 'chan_general',
    serverId: 'srv_core',
    authorId: 'user_jordan',
    authorName: 'Jordan Vance',
    authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Jordan',
    authorRole: 'moderator',
    content: 'Testing real-time message stream. Notice you can customize the UI layout at any moment using the Layout Studio or by dragging panels with React-DND.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    reactions: [
      { tag: 'STAR', label: 'Star', count: 1, users: ['user_alex'] },
    ],
  },
  {
    id: 'msg_3',
    channelId: 'chan_general',
    serverId: 'srv_core',
    authorId: 'user_taylor',
    authorName: 'Taylor Chen',
    authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Taylor',
    authorRole: 'member',
    content: 'The zero-emoji aesthetic makes everything look so much more technical and clean. You can ask @Cortex AI any questions (coding, concepts, advice) or have it suggest/create new channels!',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    reactions: [
      { tag: 'NOTED', label: 'Noted', count: 2, users: ['user_alex', 'user_jordan'] },
    ],
  },
  {
    id: 'msg_4',
    channelId: 'chan_general',
    serverId: 'srv_core',
    authorId: 'bot_cortex',
    authorName: 'Cortex AI',
    authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=CortexAI',
    authorRole: 'admin',
    content: 'Greetings. I am Cortex AI, linked directly with this server. Ask me anything directly (e.g. "How does Raft consensus work?" or "Review my code") or command me to create or rename channels with @AI or /ai commands.',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    isAiBot: true,
    reactions: [],
  },
];

let users: StoredUser[] = [...initialUsers];
let servers: StoredServer[] = [...initialServers];
let messages: StoredMessage[] = [...initialMessages];

// Load persisted DB if present
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (data.users && data.servers && data.messages) {
        users = data.users;
        servers = data.servers;
        messages = data.messages;
        console.log('Loaded database from disk:', {
          users: users.length,
          servers: servers.length,
          messages: messages.length,
        });
      }
    }
  } catch (err) {
    console.error('Failed to load database from disk, using defaults:', err);
  }
}

// Save database to disk asynchronously
function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ users, servers, messages }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('Failed to save database to disk:', err);
  }
}

loadDatabase();

// ---------------------------------------------------------
// Real-Time Server-Sent Events (SSE) Bus
// Connects friends and multiple browsers instantly!
// ---------------------------------------------------------
const sseClients = new Set<Response>();

function broadcastSSE(payload: Record<string, any>) {
  const dataString = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(dataString);
    } catch {
      sseClients.delete(client);
    }
  }
}

// SSE stream endpoint
app.get('/api/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.add(res);

  // Send initial connected packet
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  // Heartbeat every 25s
  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// Helper to push audit logs
function logAudit(
  serverId: string,
  actorId: string,
  actorName: string,
  action: string,
  details: string,
  isAiAction = false
) {
  const server = servers.find((s) => s.id === serverId);
  if (!server) return;
  const entry: StoredAudit = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    serverId,
    actorId,
    actorName: cleanText(actorName),
    action: cleanText(action),
    details: cleanText(details),
    timestamp: new Date().toISOString(),
    isAiAction,
  };
  server.auditLog.unshift(entry);
  saveDatabase();
}

// ---------------------------------------------------------
// Authentication Endpoints
// ---------------------------------------------------------

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, password, displayName, avatarUrl } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const existing = users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (existing) {
    return res.status(400).json({ error: 'Username is already taken.' });
  }

  const cleanUsername = cleanText(username).toLowerCase().replace(/[^a-z0-9_]/g, '');
  const cleanDisplay = cleanText(displayName || username);
  const newUser: StoredUser = {
    id: `user_${Date.now()}`,
    username: cleanUsername,
    password,
    displayName: cleanDisplay,
    avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`,
    status: 'online',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  // Automatically add user to the default servers so friends see each other
  for (const srv of servers) {
    if (!srv.members.some((m) => m.userId === newUser.id)) {
      srv.members.push({
        userId: newUser.id,
        role: 'member',
        joinedAt: new Date().toISOString(),
      });
    }
  }

  saveDatabase();
  broadcastSSE({ type: 'USER_REGISTERED', user: newUser });

  const { password: _, ...safeUser } = newUser;
  return res.json({ user: safeUser, token: `token_${newUser.id}` });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username.toLowerCase() === (username || '').trim().toLowerCase()
  );

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const { password: _, ...safeUser } = user;
  return res.json({ user: safeUser, token: `token_${user.id}` });
});

app.get('/api/auth/users', (_req: Request, res: Response) => {
  const safeUsers = users.map(({ password: _, ...u }) => u);
  return res.json({ users: safeUsers });
});

app.put('/api/auth/profile', (req: Request, res: Response) => {
  const { userId, displayName, avatarUrl, status, customStatus } = req.body;
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (displayName) user.displayName = cleanText(displayName);
  if (avatarUrl) user.avatarUrl = avatarUrl;
  if (status) user.status = status;
  if (customStatus !== undefined) user.customStatus = cleanText(customStatus);

  saveDatabase();
  broadcastSSE({ type: 'PROFILE_UPDATED', user });

  const { password: _, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// ---------------------------------------------------------
// Server & Channel Endpoints
// ---------------------------------------------------------

app.get('/api/servers', (_req: Request, res: Response) => {
  const list = servers.map((s) => ({
    id: s.id,
    name: s.name,
    iconInitials: s.iconInitials,
    iconBg: s.iconBg,
    ownerId: s.ownerId,
    description: s.description,
    memberCount: s.members.length,
    channelCount: s.channels.length,
  }));
  return res.json({ servers: list });
});

app.post('/api/servers', (req: Request, res: Response) => {
  const { name, description, ownerId, iconBg } = req.body;
  const cleanName = cleanText(name);
  if (!cleanName) {
    return res.status(400).json({ error: 'Server name is required.' });
  }

  const initials = cleanName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase() || 'SRV';

  const newServer: StoredServer = {
    id: `srv_${Date.now()}`,
    name: cleanName,
    iconInitials: initials,
    iconBg: iconBg || '#6366F1',
    ownerId: ownerId || 'user_alex',
    description: cleanText(description || ''),
    inviteCode: `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    categories: [
      { id: `cat_${Date.now()}_1`, serverId: `srv_${Date.now()}`, name: 'GENERAL', order: 1 },
      { id: `cat_${Date.now()}_2`, serverId: `srv_${Date.now()}`, name: 'VOICE ROOMS', order: 2 },
    ],
    channels: [
      {
        id: `chan_${Date.now()}_1`,
        serverId: `srv_${Date.now()}`,
        categoryId: `cat_${Date.now()}_1`,
        name: 'welcome',
        topic: 'Welcome to your new server.',
        type: 'text',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=Welcome',
        order: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: `chan_${Date.now()}_2`,
        serverId: `srv_${Date.now()}`,
        categoryId: `cat_${Date.now()}_2`,
        name: 'Lounge',
        topic: 'General voice communication channel.',
        type: 'voice',
        order: 2,
        createdAt: new Date().toISOString(),
      },
    ],
    members: [
      { userId: ownerId || 'user_alex', role: 'owner', joinedAt: new Date().toISOString() },
      { userId: 'bot_cortex', role: 'admin', joinedAt: new Date().toISOString() },
    ],
    auditLog: [],
  };

  servers.push(newServer);
  logAudit(
    newServer.id,
    ownerId || 'user_alex',
    'User',
    'SERVER_CREATED',
    `Created server ${cleanName}`
  );

  saveDatabase();
  broadcastSSE({ type: 'SERVER_CREATED', server: newServer });

  return res.json({ server: newServer });
});

app.post('/api/servers/join', (req: Request, res: Response) => {
  const { inviteCode, userId } = req.body;
  const server = servers.find(
    (s) => s.inviteCode.toUpperCase() === (inviteCode || '').trim().toUpperCase()
  );
  if (!server) {
    return res.status(404).json({ error: 'Invalid invite code.' });
  }

  const existingMember = server.members.find((m) => m.userId === userId);
  if (!existingMember) {
    server.members.push({
      userId,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });
    logAudit(server.id, userId, 'User', 'MEMBER_JOINED', `Joined via invite code ${inviteCode}`);
    saveDatabase();
    broadcastSSE({ type: 'MEMBER_JOINED', serverId: server.id, userId });
  }

  return res.json({ serverId: server.id });
});

app.get('/api/servers/:serverId', (req: Request, res: Response) => {
  const server = servers.find((s) => s.id === req.params.serverId);
  if (!server) {
    return res.status(404).json({ error: 'Server not found.' });
  }

  // Hydrate member objects with user details
  const hydratedMembers = server.members.map((m) => {
    const userDetail = users.find((u) => u.id === m.userId);
    return {
      ...m,
      user: userDetail ? { ...userDetail, password: '' } : null,
    };
  });

  return res.json({
    server: {
      ...server,
      members: hydratedMembers,
    },
  });
});

app.post('/api/servers/:serverId/channels', (req: Request, res: Response) => {
  const server = servers.find((s) => s.id === req.params.serverId);
  if (!server) return res.status(404).json({ error: 'Server not found.' });

  const { name, categoryId, topic, type, actorId, iconUrl } = req.body;
  const sanitized = sanitizeChannel(name);

  const newChannel: StoredChannel = {
    id: `chan_${Date.now()}`,
    serverId: server.id,
    categoryId: categoryId || server.categories[0]?.id || 'default_cat',
    name: sanitized,
    topic: cleanText(topic || ''),
    type: type || 'text',
    iconUrl: iconUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${sanitized}`,
    order: server.channels.length + 1,
    createdAt: new Date().toISOString(),
  };

  server.channels.push(newChannel);
  logAudit(
    server.id,
    actorId || 'system',
    'User',
    'CHANNEL_CREATED',
    `Created #${newChannel.name} (${newChannel.type})`
  );

  saveDatabase();
  broadcastSSE({ type: 'CHANNEL_CREATED', serverId: server.id, channel: newChannel });

  return res.json({ channel: newChannel });
});

app.patch('/api/servers/:serverId/channels/:channelId', (req: Request, res: Response) => {
  const server = servers.find((s) => s.id === req.params.serverId);
  if (!server) return res.status(404).json({ error: 'Server not found.' });

  const channel = server.channels.find((c) => c.id === req.params.channelId);
  if (!channel) return res.status(404).json({ error: 'Channel not found.' });

  const { name, topic, categoryId, isSlowMode, slowModeSeconds, actorId, iconUrl } = req.body;
  const oldName = channel.name;

  if (name) channel.name = sanitizeChannel(name);
  if (topic !== undefined) channel.topic = cleanText(topic);
  if (categoryId) channel.categoryId = categoryId;
  if (isSlowMode !== undefined) channel.isSlowMode = isSlowMode;
  if (slowModeSeconds !== undefined) channel.slowModeSeconds = slowModeSeconds;
  if (iconUrl !== undefined) channel.iconUrl = iconUrl;

  logAudit(
    server.id,
    actorId || 'system',
    'User',
    'CHANNEL_UPDATED',
    `Updated #${oldName} -> #${channel.name}`
  );

  saveDatabase();
  broadcastSSE({ type: 'CHANNEL_UPDATED', serverId: server.id, channel });

  return res.json({ channel });
});

app.delete('/api/servers/:serverId/channels/:channelId', (req: Request, res: Response) => {
  const server = servers.find((s) => s.id === req.params.serverId);
  if (!server) return res.status(404).json({ error: 'Server not found.' });

  const idx = server.channels.findIndex((c) => c.id === req.params.channelId);
  if (idx === -1) return res.status(404).json({ error: 'Channel not found.' });

  const deletedName = server.channels[idx].name;
  server.channels.splice(idx, 1);

  logAudit(
    server.id,
    req.body.actorId || 'system',
    'User',
    'CHANNEL_DELETED',
    `Deleted #${deletedName}`
  );

  saveDatabase();
  broadcastSSE({ type: 'CHANNEL_DELETED', serverId: server.id, channelId: req.params.channelId });

  return res.json({ success: true, deletedName });
});

app.post('/api/servers/:serverId/categories', (req: Request, res: Response) => {
  const server = servers.find((s) => s.id === req.params.serverId);
  if (!server) return res.status(404).json({ error: 'Server not found.' });

  const { name, actorId } = req.body;
  const cleanCategoryName = cleanText(name).toUpperCase();
  if (!cleanCategoryName) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  const newCategory: StoredCategory = {
    id: `cat_${Date.now()}`,
    serverId: server.id,
    name: cleanCategoryName,
    order: server.categories.length + 1,
  };

  server.categories.push(newCategory);
  logAudit(
    server.id,
    actorId || 'system',
    'User',
    'CATEGORY_CREATED',
    `Created category [${cleanCategoryName}]`
  );

  saveDatabase();
  broadcastSSE({ type: 'CATEGORY_CREATED', serverId: server.id, category: newCategory });

  return res.json({ category: newCategory });
});

// Moderation Action (kick, mute, role change)
app.post('/api/servers/:serverId/members/:memberId/action', (req: Request, res: Response) => {
  const server = servers.find((s) => s.id === req.params.serverId);
  if (!server) return res.status(404).json({ error: 'Server not found.' });

  const { action, role, actorId, reason } = req.body;
  const memberIdx = server.members.findIndex((m) => m.userId === req.params.memberId);
  if (memberIdx === -1) return res.status(404).json({ error: 'Member not found.' });

  const member = server.members[memberIdx];
  const targetUser = users.find((u) => u.id === member.userId);
  const targetName = targetUser?.displayName || member.userId;

  if (action === 'kick') {
    server.members.splice(memberIdx, 1);
    logAudit(
      server.id,
      actorId || 'admin',
      'Moderator',
      'MEMBER_KICKED',
      `Kicked ${targetName}. Reason: ${cleanText(reason || 'No reason provided')}`
    );
    saveDatabase();
    broadcastSSE({ type: 'MEMBER_KICKED', serverId: server.id, memberId: member.userId });
    return res.json({ success: true, message: `Kicked ${targetName}` });
  }

  if (action === 'mute') {
    member.isMuted = !member.isMuted;
    logAudit(
      server.id,
      actorId || 'admin',
      'Moderator',
      member.isMuted ? 'MEMBER_MUTED' : 'MEMBER_UNMUTED',
      `${member.isMuted ? 'Muted' : 'Unmuted'} ${targetName}`
    );
    saveDatabase();
    broadcastSSE({ type: 'MEMBER_MUTED', serverId: server.id, member });
    return res.json({ success: true, member });
  }

  if (action === 'setRole' && role) {
    member.role = role;
    logAudit(
      server.id,
      actorId || 'admin',
      'Moderator',
      'ROLE_CHANGED',
      `Changed ${targetName}'s role to ${role}`
    );
    saveDatabase();
    broadcastSSE({ type: 'MEMBER_ROLE_CHANGED', serverId: server.id, member });
    return res.json({ success: true, member });
  }

  return res.status(400).json({ error: 'Unsupported moderation action.' });
});

// ---------------------------------------------------------
// Messaging & Reactions Endpoints
// ---------------------------------------------------------

app.get('/api/channels/:channelId/messages', (req: Request, res: Response) => {
  const channelMessages = messages.filter((m) => m.channelId === req.params.channelId);
  return res.json({ messages: channelMessages });
});

app.post('/api/channels/:channelId/messages', async (req: Request, res: Response) => {
  const { channelId } = req.params;
  const { serverId, authorId, content, replyTo } = req.body;

  const cleanedContent = cleanText(content);
  if (!cleanedContent) {
    return res.status(400).json({ error: 'Message content cannot be empty.' });
  }

  const author = users.find((u) => u.id === authorId) || {
    id: authorId || 'user_guest',
    displayName: 'Guest User',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=Guest',
    status: 'online',
    createdAt: new Date().toISOString(),
  };

  const server = servers.find((s) => s.id === serverId);
  const member = server?.members.find((m) => m.userId === author.id);

  if (member?.isMuted) {
    return res.status(403).json({ error: 'You are muted in this server.' });
  }

  const newMessage: StoredMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    channelId,
    serverId: serverId || server?.id || 'srv_core',
    authorId: author.id,
    authorName: author.displayName,
    authorAvatar: author.avatarUrl,
    authorRole: member?.role || 'member',
    content: cleanedContent,
    timestamp: new Date().toISOString(),
    reactions: [],
    replyTo,
  };

  messages.push(newMessage);
  saveDatabase();

  // Broadcast instantly to all connected clients (friends across devices)
  broadcastSSE({
    type: 'NEW_MESSAGE',
    channelId,
    serverId: newMessage.serverId,
    message: newMessage,
  });

  // Check if user is asking the AI a question or issuing a command
  const isAiTrigger =
    cleanedContent.toLowerCase().includes('@cortex') ||
    cleanedContent.toLowerCase().includes('@ai') ||
    cleanedContent.startsWith('/ai') ||
    cleanedContent.startsWith('/ask') ||
    cleanedContent.startsWith('/suggest-channels') ||
    cleanedContent.startsWith('/create-channel') ||
    cleanedContent.startsWith('/rename-channel') ||
    cleanedContent.startsWith('/organize');

  if (isAiTrigger && server) {
    try {
      const aiPrompt = cleanedContent
        .replace(/@cortex(\s+ai)?/gi, '')
        .replace(/@ai/gi, '')
        .replace(/^\/(ai|ask)\s*/i, '')
        .trim();

      const aiResponse = await executeAiAssistant(
        server,
        channelId,
        aiPrompt,
        author.displayName
      );

      if (aiResponse) {
        messages.push(aiResponse);
        saveDatabase();
        broadcastSSE({
          type: 'NEW_MESSAGE',
          channelId,
          serverId: server.id,
          message: aiResponse,
        });
      }
    } catch (err) {
      console.error('Error invoking AI assistant:', err);
    }
  }

  return res.json({ message: newMessage });
});

app.post('/api/channels/:channelId/messages/:messageId/react', (req: Request, res: Response) => {
  const { messageId, channelId } = req.params;
  const { tag, label, userId } = req.body;
  const cleanTag = cleanText(tag);

  const message = messages.find((m) => m.id === messageId);
  if (!message) return res.status(404).json({ error: 'Message not found.' });

  let reaction = message.reactions.find((r) => r.tag === cleanTag);
  if (!reaction) {
    reaction = { tag: cleanTag, label: cleanText(label || cleanTag), count: 0, users: [] };
    message.reactions.push(reaction);
  }

  const userIdx = reaction.users.indexOf(userId);
  if (userIdx > -1) {
    reaction.users.splice(userIdx, 1);
    reaction.count = Math.max(0, reaction.count - 1);
  } else {
    reaction.users.push(userId);
    reaction.count += 1;
  }

  message.reactions = message.reactions.filter((r) => r.count > 0);
  saveDatabase();

  broadcastSSE({
    type: 'MESSAGE_REACTIONS_UPDATED',
    channelId,
    messageId,
    reactions: message.reactions,
  });

  return res.json({ reactions: message.reactions });
});

app.post('/api/channels/:channelId/messages/:messageId/pin', (req: Request, res: Response) => {
  const message = messages.find((m) => m.id === req.params.messageId);
  if (!message) return res.status(404).json({ error: 'Message not found.' });

  message.pinned = !message.pinned;
  saveDatabase();

  broadcastSSE({
    type: 'MESSAGE_PIN_UPDATED',
    channelId: req.params.channelId,
    messageId: message.id,
    pinned: message.pinned,
  });

  return res.json({ pinned: message.pinned });
});

// ---------------------------------------------------------
// AI Assistant: General Questions + Autonomous Channel Management
// ---------------------------------------------------------

async function executeAiAssistant(
  server: StoredServer,
  channelId: string,
  userPrompt: string,
  requesterName: string
): Promise<StoredMessage | null> {
  const currentChannel = server.channels.find((c) => c.id === channelId);
  const recentChannelMsgs = messages
    .filter((m) => m.channelId === channelId)
    .slice(-15)
    .map((m) => `${m.authorName}: ${m.content}`)
    .join('\n');

  const serverContextSummary = `
Server Name: ${server.name}
Description: ${server.description}
Categories: ${server.categories.map((c) => c.name).join(', ')}
Channels:
${server.channels.map((c) => `- #${c.name} (${c.type}, category: ${server.categories.find((cat) => cat.id === c.categoryId)?.name || 'None'}) - Topic: ${c.topic}`).join('\n')}

Recent Chat Messages in current channel #${currentChannel?.name || 'unknown'}:
${recentChannelMsgs}
`;

  // System instruction supporting both General Questions and Server Architecture
  const systemInstruction = `You are Cortex AI, the intelligent resident assistant and server director for the Disclose platform.
You are linked directly to server '${server.name}'.

YOU HAVE TWO PRIMARY ROLES:
1. COMPREHENSIVE KNOWLEDGE & Q&A ASSISTANT:
When users ask questions (about programming, algorithms, debugging, math, science, system design, history, advice, or general conversation), answer thoroughly, clearly, and helpfully. Use clean code blocks and structured formatting.

2. AUTONOMOUS SERVER & CHANNEL DIRECTOR:
When users ask to create, rename, organize, adjust topics, or suggest new channels based on chat discussions, execute the appropriate tool function.

CRITICAL RULES:
1. STRICT ZERO-EMOJI RULE: NEVER USE ANY EMOJIS UNDER ANY CIRCUMSTANCES. No smileys, no fire, no thumbs up, no skulls, no symbols that render as unicode emojis. Use clean technical formatting, markdown bold, code blocks, or bracketed badges like [INFO], [QUESTION], [CODE], [ANSWER], [ACTION], [CREATED].
2. Provide direct, informative, well-structured replies without conversational fluff.`;

  // Function declarations for Gemini tool calling
  const createChannelDecl: FunctionDeclaration = {
    name: 'create_channel',
    description: 'Creates a new text or voice channel in the server.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: 'The name of the channel in lowercase kebab-case (e.g. dev-logs, api-specs). Absolutely no emojis.',
        },
        topic: {
          type: Type.STRING,
          description: 'The topic or purpose of the channel.',
        },
        categoryName: {
          type: Type.STRING,
          description: 'Target category name, e.g. TEXT CHANNELS or DEVELOPMENT.',
        },
        type: {
          type: Type.STRING,
          description: 'Channel type: "text", "voice", or "announcement".',
        },
        iconUrl: {
          type: Type.STRING,
          description: 'Optional URL for discussion icon image.',
        },
      },
      required: ['name'],
    },
  };

  const renameChannelDecl: FunctionDeclaration = {
    name: 'rename_channel',
    description: 'Renames an existing channel to improve organization.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        currentNameOrId: {
          type: Type.STRING,
          description: 'The current channel name (with or without #) or ID.',
        },
        newName: {
          type: Type.STRING,
          description: 'The new channel name in lowercase kebab-case. Absolutely no emojis.',
        },
        newTopic: {
          type: Type.STRING,
          description: 'Optional updated topic description.',
        },
        iconUrl: {
          type: Type.STRING,
          description: 'Optional updated icon image URL.',
        },
      },
      required: ['currentNameOrId', 'newName'],
    },
  };

  const createCategoryDecl: FunctionDeclaration = {
    name: 'create_category',
    description: 'Creates a new category grouping for channels.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: 'Name of the category in uppercase, e.g. INFRASTRUCTURE or GAMING.',
        },
      },
      required: ['name'],
    },
  };

  const setChannelTopicDecl: FunctionDeclaration = {
    name: 'set_channel_topic',
    description: 'Updates the topic description of a channel.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        channelNameOrId: {
          type: Type.STRING,
          description: 'The channel name or ID.',
        },
        topic: {
          type: Type.STRING,
          description: 'The new topic description.',
        },
      },
      required: ['channelNameOrId', 'topic'],
    },
  };

  const tools = [
    {
      functionDeclarations: [
        createChannelDecl,
        renameChannelDecl,
        createCategoryDecl,
        setChannelTopicDecl,
      ],
    },
  ];

  try {
    const prompt = `User: ${requesterName}
Query / Command: ${userPrompt || 'Analyze chat history and suggest or answer as appropriate.'}

Server Context:
${serverContextSummary}`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          tools,
        },
      });
    } catch (e: any) {
      console.warn('gemini-3.8-flash busy in executeAiAssistant, falling back to gemini-3.1-flash-lite:', e.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction,
          tools,
        },
      });
    }

    const functionCalls = response.functionCalls;
    const actionsExecuted: string[] = [];
    const affectedChannels: string[] = [];

    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        const args = call.args as Record<string, any>;
        if (call.name === 'create_channel') {
          const chanName = sanitizeChannel(args.name);
          let targetCategory = server.categories.find(
            (c) => c.name.toLowerCase() === (args.categoryName || '').toLowerCase()
          );

          if (!targetCategory && args.categoryName) {
            targetCategory = {
              id: `cat_${Date.now()}`,
              serverId: server.id,
              name: cleanText(args.categoryName).toUpperCase(),
              order: server.categories.length + 1,
            };
            server.categories.push(targetCategory);
            actionsExecuted.push(`Created category [${targetCategory.name}]`);
          }

          const newChan: StoredChannel = {
            id: `chan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            serverId: server.id,
            categoryId: targetCategory ? targetCategory.id : server.categories[0]?.id || 'cat_gen',
            name: chanName,
            topic: cleanText(args.topic || 'Created by Cortex AI'),
            type: args.type === 'voice' ? 'voice' : args.type === 'announcement' ? 'announcement' : 'text',
            iconUrl: args.iconUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${chanName}`,
            order: server.channels.length + 1,
            createdAt: new Date().toISOString(),
          };

          server.channels.push(newChan);
          affectedChannels.push(`#${newChan.name}`);
          actionsExecuted.push(`Created channel #${newChan.name} (${newChan.type})`);
          logAudit(server.id, 'bot_cortex', 'Cortex AI', 'AI_CHANNEL_CREATED', `Created #${newChan.name}`, true);
        } else if (call.name === 'rename_channel') {
          const targetName = (args.currentNameOrId || '').replace(/^#/, '').toLowerCase();
          const chan = server.channels.find(
            (c) => c.name.toLowerCase() === targetName || c.id === args.currentNameOrId
          );
          if (chan) {
            const oldName = chan.name;
            chan.name = sanitizeChannel(args.newName);
            if (args.newTopic) chan.topic = cleanText(args.newTopic);
            if (args.iconUrl) chan.iconUrl = args.iconUrl;
            affectedChannels.push(`#${chan.name}`);
            actionsExecuted.push(`Renamed #${oldName} -> #${chan.name}`);
            logAudit(server.id, 'bot_cortex', 'Cortex AI', 'AI_CHANNEL_RENAMED', `Renamed #${oldName} -> #${chan.name}`, true);
          }
        } else if (call.name === 'create_category') {
          const catName = cleanText(args.name).toUpperCase();
          const newCat: StoredCategory = {
            id: `cat_${Date.now()}`,
            serverId: server.id,
            name: catName,
            order: server.categories.length + 1,
          };
          server.categories.push(newCat);
          actionsExecuted.push(`Created category [${catName}]`);
          logAudit(server.id, 'bot_cortex', 'Cortex AI', 'AI_CATEGORY_CREATED', `Created category [${catName}]`, true);
        } else if (call.name === 'set_channel_topic') {
          const targetName = (args.channelNameOrId || '').replace(/^#/, '').toLowerCase();
          const chan = server.channels.find(
            (c) => c.name.toLowerCase() === targetName || c.id === args.channelNameOrId
          );
          if (chan) {
            chan.topic = cleanText(args.topic);
            actionsExecuted.push(`Updated topic for #${chan.name}: "${chan.topic}"`);
            logAudit(server.id, 'bot_cortex', 'Cortex AI', 'AI_TOPIC_UPDATED', `Updated topic for #${chan.name}`, true);
          }
        }
      }
    }

    const rawText = response.text || '';
    const cleanOutput = cleanText(rawText);

    let messageContent = cleanOutput;
    if (actionsExecuted.length > 0) {
      const summaryList = actionsExecuted.map((a) => `- ${a}`).join('\n');
      if (!messageContent) {
        messageContent = `Executed requested server architectural changes:\n${summaryList}`;
      } else {
        messageContent = `${messageContent}\n\n**Actions Completed:**\n${summaryList}`;
      }
    } else if (!messageContent) {
      messageContent = 'I have processed your query.';
    }

    const aiMessage: StoredMessage = {
      id: `msg_ai_${Date.now()}`,
      channelId,
      serverId: server.id,
      authorId: 'bot_cortex',
      authorName: 'Cortex AI',
      authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=CortexAI',
      authorRole: 'admin',
      content: cleanText(messageContent),
      timestamp: new Date().toISOString(),
      isAiBot: true,
      reactions: [],
      aiActionMeta: actionsExecuted.length > 0 ? {
        actionType: 'CHANNEL_OPS',
        summary: actionsExecuted.join(', '),
        affectedChannels,
      } : undefined,
    };

    saveDatabase();
    return aiMessage;
  } catch (err: any) {
    console.error('Gemini API call failed:', err);
    return {
      id: `msg_ai_${Date.now()}`,
      channelId,
      serverId: server.id,
      authorId: 'bot_cortex',
      authorName: 'Cortex AI',
      authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=CortexAI',
      authorRole: 'admin',
      content: `[Cortex AI Notification] Unable to process request: ${cleanText(err.message || 'Model error')}. Please check connection or prompt.`,
      timestamp: new Date().toISOString(),
      isAiBot: true,
      reactions: [],
    };
  }
}

// Multi-turn Q&A endpoint
app.post('/api/ai/ask', async (req: Request, res: Response) => {
  const { prompt, history, serverId } = req.body;
  const server = servers.find((s) => s.id === serverId) || servers[0];

  const systemInstruction = `You are Cortex AI, a resident intelligent companion on Disclose.
You answer any user questions (code, technical concepts, architecture, writing, science, everyday questions).
RULES:
1. STRICT ZERO EMOJIS: Never output any emoji character.
2. Be direct, clear, and comprehensive. Provide code snippets where helpful.`;

  try {
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const turn of history) {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: cleanText(turn.content) }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: cleanText(prompt) }],
    });

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
        },
      });
      responseText = response.text || '';
    } catch (primaryErr: any) {
      console.warn('gemini-3.8-flash busy, falling back to gemini-3.1-flash-lite:', primaryErr.message);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: {
          systemInstruction,
        },
      });
      responseText = fallbackResponse.text || '';
    }

    const text = cleanText(responseText || 'I have completed your query.');
    return res.json({ response: text });
  } catch (err: any) {
    console.error('Failed to answer AI question:', err);
    return res.status(500).json({ error: cleanText(err.message || 'AI request failed') });
  }
});

// Direct AI Assistant command endpoint (from AI Director UI Drawer)
app.post('/api/ai/command', async (req: Request, res: Response) => {
  const { serverId, channelId, prompt, requesterName } = req.body;
  const server = servers.find((s) => s.id === serverId);
  if (!server) return res.status(404).json({ error: 'Server not found.' });

  const aiMessage = await executeAiAssistant(
    server,
    channelId || server.channels[0]?.id || 'chan_general',
    prompt,
    requesterName || 'Admin'
  );

  if (aiMessage) {
    messages.push(aiMessage);
    saveDatabase();
    broadcastSSE({
      type: 'NEW_MESSAGE',
      channelId: aiMessage.channelId,
      serverId: server.id,
      message: aiMessage,
    });
  }

  return res.json({
    message: aiMessage,
    server,
  });
});

// ---------------------------------------------------------
// Vite Middleware & Static Serving Setup
// ---------------------------------------------------------

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Disclose server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

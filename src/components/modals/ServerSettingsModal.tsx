import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  X,
  Hash,
  Volume2,
  Megaphone,
  Trash2,
  Edit2,
  Shield,
  VolumeX,
  UserMinus,
  Copy,
  History,
  Bot,
  Check,
} from 'lucide-react';
import { stripEmojis } from '../../utils/emojiSanitizer';

export const ServerSettingsModal: React.FC = () => {
  const {
    currentServer,
    currentUser,
    updateChannel,
    deleteChannel,
    moderateMember,
    closeModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'moderation' | 'audit'>('overview');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editIconUrl, setEditIconUrl] = useState('');

  if (!currentServer) return null;

  const isOwner = currentServer.ownerId === currentUser?.id;
  const isMod = currentServer.members.some(
    (m) => m.userId === currentUser?.id && (m.role === 'owner' || m.role === 'admin' || m.role === 'moderator')
  );

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(currentServer.inviteCode);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleStartEdit = (channel: any) => {
    setEditingChannelId(channel.id);
    setEditName(channel.name);
    setEditTopic(channel.topic || '');
    setEditIconUrl(channel.iconUrl || '');
  };

  const handleSaveEdit = async (channelId: string) => {
    if (!editName.trim()) return;
    await updateChannel(channelId, {
      name: stripEmojis(editName),
      topic: stripEmojis(editTopic),
      iconUrl: editIconUrl.trim() || undefined,
    });
    setEditingChannelId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              {currentServer.name} — Server Settings
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview & Invite
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'channels'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Channel Architecture ({currentServer.channels.length})
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'moderation'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Members & Moderation ({currentServer.members.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Log ({currentServer.auditLog.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Server Name
                </label>
                <input
                  type="text"
                  disabled
                  value={currentServer.name}
                  className="w-full bg-slate-900 text-slate-100 text-sm px-3.5 py-2.5 rounded-xl border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Server Description
                </label>
                <textarea
                  disabled
                  rows={2}
                  value={currentServer.description || 'No description provided.'}
                  className="w-full bg-slate-900 text-slate-100 text-sm px-3.5 py-2 rounded-xl border border-slate-800 resize-none"
                />
              </div>

              {/* Invite Code Box */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-white">Share Server Invite</div>
                <p className="text-xs text-slate-400">
                  Users can join this server by entering this invite code in the Join Server modal.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentServer.inviteCode}
                    className="flex-1 bg-slate-950 text-indigo-300 font-mono text-sm px-3.5 py-2 rounded-lg border border-slate-800"
                  />
                  <button
                    onClick={handleCopyInvite}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copiedInvite ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 mb-2">
                Manage, rename, or prune channels. You can also ask Cortex AI to automate changes.
              </div>

              <div className="space-y-2">
                {currentServer.channels.map((chan) => (
                  <div
                    key={chan.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    {editingChannelId === chan.id ? (
                      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(stripEmojis(e.target.value))}
                          placeholder="Channel name"
                          className="bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-indigo-500 w-28"
                        />
                        <input
                          type="text"
                          value={editTopic}
                          onChange={(e) => setEditTopic(stripEmojis(e.target.value))}
                          placeholder="Topic description"
                          className="flex-1 bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700"
                        />
                        <input
                          type="text"
                          value={editIconUrl}
                          onChange={(e) => setEditIconUrl(e.target.value)}
                          placeholder="Icon image URL"
                          className="bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 w-36 font-mono"
                        />
                        <button
                          onClick={() => handleSaveEdit(chan.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingChannelId(null)}
                          className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          {chan.type === 'voice' ? (
                            <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : chan.type === 'announcement' ? (
                            <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <Hash className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-semibold text-white text-xs mr-2">
                              #{chan.name}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate">
                              {chan.topic || 'No topic'}
                            </span>
                          </div>
                        </div>

                        {isMod && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleStartEdit(chan)}
                              title="Edit Channel"
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete channel #${chan.name}?`)) {
                                  deleteChannel(chan.id);
                                }
                              }}
                              title="Delete Channel"
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members & Moderation Tab */}
          {activeTab === 'moderation' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 mb-2">
                Server members and moderation permissions. Server owners and moderators can manage members.
              </div>

              <div className="space-y-2">
                {currentServer.members.map((member) => {
                  const user = (member as any).user || {
                    displayName: member.userId,
                    username: member.userId,
                    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${member.userId}`,
                  };

                  const isTargetOwner = member.role === 'owner';
                  const isTargetAi = user.isAiBot || member.userId === 'bot_cortex';

                  return (
                    <div
                      key={member.userId}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover bg-slate-800"
                        />
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-2">
                            <span>{user.displayName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              @{user.username}
                            </span>
                          </div>
                          <div className="text-[11px] text-indigo-400 font-mono mt-0.5">
                            Role: {member.role} {member.isMuted && '· [MUTED]'}
                          </div>
                        </div>
                      </div>

                      {/* Moderation Actions */}
                      {isMod && !isTargetOwner && member.userId !== currentUser?.id && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => moderateMember(member.userId, 'mute')}
                            title={member.isMuted ? 'Unmute' : 'Mute'}
                            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                              member.isMuted
                                ? 'bg-amber-950 text-amber-300'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>{member.isMuted ? 'Unmute' : 'Mute'}</span>
                          </button>

                          {isOwner && !isTargetAi && (
                            <button
                              onClick={() =>
                                moderateMember(
                                  member.userId,
                                  'setRole',
                                  member.role === 'moderator' ? 'member' : 'moderator'
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg text-xs text-indigo-300 hover:bg-indigo-950"
                            >
                              {member.role === 'moderator' ? 'Revoke Mod' : 'Promote Mod'}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`Kick ${user.displayName}?`)) {
                                moderateMember(member.userId, 'kick');
                              }
                            }}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg text-xs flex items-center gap-1"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Kick</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Audit Log Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 mb-2">
                Complete server audit history including human actions and autonomous Cortex AI operations.
              </div>

              {currentServer.auditLog.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500">
                  No audit log entries recorded.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentServer.auditLog.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`font-mono text-[11px] font-semibold px-1.5 py-0.2 rounded ${
                              log.isAiAction
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/80'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            [{log.action}]
                          </span>
                          <span className="font-semibold text-slate-200">{log.actorName}</span>
                          {log.isAiAction && (
                            <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                              <Bot className="w-3 h-3" /> Autonomous AI
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400">{log.details}</div>
                      </div>
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

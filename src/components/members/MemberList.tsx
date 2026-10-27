import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServerMember } from '../../types';
import { Shield, VolumeX, Volume2, UserMinus, Bot, Check, Sliders } from 'lucide-react';

export const MemberList: React.FC = () => {
  const { currentServer, currentUser, moderateMember, layout, updateLayout } = useApp();
  const [selectedMember, setSelectedMember] = useState<ServerMember | null>(null);

  if (!currentServer || layout.memberListPosition === 'hidden') {
    return null;
  }

  const isOwner = currentServer.ownerId === currentUser?.id;
  const isMod = currentServer.members.some(
    (m) => m.userId === currentUser?.id && (m.role === 'owner' || m.role === 'moderator' || m.role === 'admin')
  );

  // Group members
  const owners = currentServer.members.filter((m) => m.role === 'owner');
  const aiBots = currentServer.members.filter((m) => (m as any).user?.isAiBot || m.userId === 'bot_cortex');
  const mods = currentServer.members.filter(
    (m) => (m.role === 'moderator' || m.role === 'admin') && !aiBots.includes(m) && !owners.includes(m)
  );
  const regularMembers = currentServer.members.filter(
    (m) => !owners.includes(m) && !aiBots.includes(m) && !mods.includes(m)
  );

  const renderMemberRow = (member: ServerMember) => {
    const user = (member as any).user || {
      id: member.userId,
      displayName: member.userId,
      username: member.userId,
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${member.userId}`,
      status: 'online',
    };

    const isTargetOwner = member.role === 'owner';
    const isTargetAi = user.isAiBot || member.userId === 'bot_cortex';

    return (
      <div key={member.userId} className="relative group">
        <button
          onClick={() => setSelectedMember(selectedMember?.userId === member.userId ? null : member)}
          className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors ${
            selectedMember?.userId === member.userId
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          {/* Avatar with status */}
          <div className="relative shrink-0">
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover bg-slate-800 border border-slate-700/60"
            />
            <span
              className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-slate-900 ${
                user.status === 'online'
                  ? 'bg-emerald-500'
                  : user.status === 'idle'
                  ? 'bg-amber-500'
                  : user.status === 'dnd'
                  ? 'bg-red-500'
                  : 'bg-slate-500'
              }`}
            />
          </div>

          {/* Name & Custom Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold truncate text-slate-200 group-hover:text-white">
                {user.displayName}
              </span>
              {isTargetAi && (
                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-indigo-600 text-white uppercase">
                  BOT
                </span>
              )}
              {member.isMuted && (
                <span title="Muted">
                  <VolumeX className="w-3 h-3 text-red-400" />
                </span>
              )}
            </div>
            {user.customStatus && (
              <div className="text-[11px] text-slate-500 truncate">
                {user.customStatus}
              </div>
            )}
          </div>
        </button>

        {/* Member Action Card Popover */}
        {selectedMember?.userId === member.userId && (
          <div className="absolute right-full mr-2 top-0 w-64 bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-2xl z-50 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover bg-slate-800"
              />
              <div className="min-w-0">
                <div className="font-semibold text-white truncate text-sm">
                  {user.displayName}
                </div>
                <div className="text-slate-500 text-[11px]">@{user.username}</div>
                <div className="text-[10px] text-indigo-400 uppercase font-mono mt-0.5">
                  Role: {member.role}
                </div>
              </div>
            </div>

            {/* Moderation Controls (Available for Server Owner / Mods) */}
            {isMod && !isTargetOwner && member.userId !== currentUser?.id && (
              <div className="pt-2 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Moderation Tools
                </div>

                {/* Mute Toggle */}
                <button
                  onClick={() => moderateMember(member.userId, 'mute')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  {member.isMuted ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Unmute Member</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                      <span>Mute Member in Channels</span>
                    </>
                  )}
                </button>

                {/* Role Promotion (Owner only) */}
                {isOwner && !isTargetAi && (
                  <button
                    onClick={() =>
                      moderateMember(
                        member.userId,
                        'setRole',
                        member.role === 'moderator' ? 'member' : 'moderator'
                      )
                    }
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {member.role === 'moderator' ? 'Revoke Mod Role' : 'Promote to Moderator'}
                    </span>
                  </button>
                )}

                {/* Kick Member */}
                <button
                  onClick={() => {
                    if (confirm(`Kick ${user.displayName} from ${currentServer.name}?`)) {
                      moderateMember(member.userId, 'kick', undefined, 'Kicked by moderator');
                      setSelectedMember(null);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-950/40 hover:text-red-300"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Kick from Server</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      aria-label="Server Member List"
      className="w-60 h-full bg-slate-900/95 border-l border-slate-800/80 flex flex-col shrink-0 select-none overflow-y-auto px-2 py-3"
    >
      {/* Quick Handle for Member List Reposition (if handles enabled) */}
      {layout.enableCustomUiHandles && (
        <div className="mb-2 px-2 py-1 bg-indigo-950/60 border border-indigo-900/50 rounded flex items-center justify-between text-[11px] text-indigo-300">
          <span>Members: {layout.memberListPosition}</span>
          <button
            onClick={() => {
              const next = layout.memberListPosition === 'right' ? 'left' : 'right';
              updateLayout({ memberListPosition: next });
            }}
            className="px-1.5 py-0.5 rounded bg-indigo-900 hover:bg-indigo-800 text-white"
          >
            Swap
          </button>
        </div>
      )}

      {/* Owners Group */}
      {owners.length > 0 && (
        <div className="mb-4">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Server Owner — {owners.length}
          </div>
          <div className="space-y-0.5">{owners.map(renderMemberRow)}</div>
        </div>
      )}

      {/* AI Bot Group */}
      {aiBots.length > 0 && (
        <div className="mb-4">
          <div className="px-2 py-1 text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
            <Bot className="w-3 h-3 text-indigo-400" />
            <span>AI Director — {aiBots.length}</span>
          </div>
          <div className="space-y-0.5">{aiBots.map(renderMemberRow)}</div>
        </div>
      )}

      {/* Mods Group */}
      {mods.length > 0 && (
        <div className="mb-4">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Moderators — {mods.length}
          </div>
          <div className="space-y-0.5">{mods.map(renderMemberRow)}</div>
        </div>
      )}

      {/* Regular Members */}
      {regularMembers.length > 0 && (
        <div className="mb-4">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Online Members — {regularMembers.length}
          </div>
          <div className="space-y-0.5">{regularMembers.map(renderMemberRow)}</div>
        </div>
      )}
    </aside>
  );
};

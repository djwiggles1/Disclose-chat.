import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Volume2,
  X,
  Mic,
  MicOff,
  Headphones,
  Monitor,
  PhoneOff,
  Radio,
  Share2,
} from 'lucide-react';

export const VoiceStageModal: React.FC = () => {
  const {
    currentServer,
    currentChannel,
    voiceState,
    connectVoice,
    disconnectVoice,
    toggleMute,
    toggleDeafen,
    toggleScreenShare,
    currentUser,
    closeModal,
  } = useApp();

  const isConnected = !!voiceState.currentChannelId;

  const handleJoinLeave = () => {
    if (isConnected) {
      disconnectVoice();
    } else {
      const voiceChan =
        currentServer?.channels.find((c) => c.type === 'voice') || currentChannel;
      if (voiceChan) connectVoice(voiceChan.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">Voice Stage Simulator</h2>
              <p className="text-xs text-slate-400">
                Low-latency voice room with live speaking indicators and screen sharing.
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stage Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Connection status banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span className="font-semibold text-white">
                {isConnected ? 'Connected to Voice Channel' : 'Voice Disconnected'}
              </span>
            </div>
            <button
              onClick={handleJoinLeave}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-colors ${
                isConnected
                  ? 'bg-red-950 text-red-300 hover:bg-red-900'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isConnected ? 'Disconnect' : 'Connect to Voice'}
            </button>
          </div>

          {/* Participant Tiles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {voiceState.connectedMembers.map((member) => (
              <div
                key={member.userId}
                className={`p-6 rounded-2xl bg-slate-900 border flex flex-col items-center justify-center text-center transition-all ${
                  member.isSpeaking
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'border-slate-800'
                }`}
              >
                <div className="relative mb-3">
                  <img
                    src={member.avatarUrl}
                    alt={member.displayName}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full object-cover bg-slate-800"
                  />
                  {member.isSpeaking && (
                    <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-60" />
                  )}
                </div>
                <div className="font-semibold text-white text-sm mb-0.5">
                  {member.displayName}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  {member.isSpeaking ? (
                    <span className="text-emerald-400 font-medium">Speaking...</span>
                  ) : (
                    <span>Connected</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Screen Share Test Panel */}
          {voiceState.isScreenSharing && (
            <div className="p-4 rounded-xl bg-slate-900 border border-indigo-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
                <span>Screen Share Stream (Simulated View)</span>
                <span className="text-slate-500">1080p @ 60fps</span>
              </div>
              <div className="h-44 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 text-xs">
                Displaying Workspace Stream · Disclose IDE Canvas
              </div>
            </div>
          )}
        </div>

        {/* Audio Controls Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3">
          <button
            onClick={toggleMute}
            title={voiceState.isMuted ? 'Unmute' : 'Mute'}
            className={`p-3 rounded-xl border transition-colors ${
              voiceState.isMuted
                ? 'bg-red-950 border-red-800 text-red-400'
                : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
            }`}
          >
            {voiceState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleDeafen}
            title={voiceState.isDeafened ? 'Undeafen' : 'Deafen'}
            className={`p-3 rounded-xl border transition-colors ${
              voiceState.isDeafened
                ? 'bg-red-950 border-red-800 text-red-400'
                : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
            }`}
          >
            <Headphones className="w-5 h-5" />
          </button>

          <button
            onClick={toggleScreenShare}
            title={voiceState.isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            className={`p-3 rounded-xl border transition-colors ${
              voiceState.isScreenSharing
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
            }`}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {isConnected && (
            <button
              onClick={disconnectVoice}
              title="Leave Voice"
              className="p-3 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

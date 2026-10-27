import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sliders,
  X,
  Layout,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import {
  ServerRailPos,
  ChannelSidebarPos,
  MemberListPos,
  ActionBarPos,
  MessageBarPos,
  DensityMode,
} from '../../types';

export const LayoutCustomizerModal: React.FC = () => {
  const {
    layout,
    updateLayout,
    reorderToolbarButtons,
    resetLayout,
    applyPreset,
    closeModal,
  } = useApp();

  const handleMoveButton = (index: number, direction: 'up' | 'down') => {
    const list = [...layout.toolbarButtons].sort((a, b) => a.order - b.order);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Re-index orders
    const updated = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    reorderToolbarButtons(updated);
  };

  const handleToggleVisibility = (buttonId: string) => {
    const updated = layout.toolbarButtons.map((b) =>
      b.id === buttonId ? { ...b, visible: !b.visible } : b
    );
    reorderToolbarButtons(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                UI Layout & Component Studio
              </h2>
              <p className="text-xs text-slate-400">
                Reposition sidebars, action bars, docks, and reorder all toolbar buttons.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetLayout}
              title="Reset to Default"
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={closeModal}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* Quick Layout Presets */}
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400 mb-2.5">
              Layout Presets
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => applyPreset('classic')}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 text-left transition-colors"
              >
                <div className="font-semibold text-white text-xs mb-1">Classic Discord</div>
                <div className="text-[11px] text-slate-500">Rail Left, Channels Left, Members Right</div>
              </button>

              <button
                onClick={() => applyPreset('inverted')}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 text-left transition-colors"
              >
                <div className="font-semibold text-white text-xs mb-1">Inverted Studio</div>
                <div className="text-[11px] text-slate-500">Members Left, Channels Right, Rail Right</div>
              </button>

              <button
                onClick={() => applyPreset('top-rail')}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 text-left transition-colors"
              >
                <div className="font-semibold text-white text-xs mb-1">Top Rail Modern</div>
                <div className="text-[11px] text-slate-500">Horizontal Rail Top, Streamlined Hub</div>
              </button>

              <button
                onClick={() => applyPreset('terminal')}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 text-left transition-colors"
              >
                <div className="font-semibold text-white text-xs mb-1">Terminal Focus</div>
                <div className="text-[11px] text-slate-500">Compact, Members Hidden, High Density</div>
              </button>
            </div>
          </div>

          {/* Section 0: Drag-and-Drop Workspace Panel Slot Order */}
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400 mb-2">
              Workspace Panel Slots (React-DND Drag Order)
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Reorder the core workspace slots below or drag their handles directly in the app.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(layout.panelOrder || ['rail', 'channels', 'chat', 'members']).map((panelId, idx, arr) => {
                const label =
                  panelId === 'rail'
                    ? 'Server List'
                    : panelId === 'channels'
                    ? 'Channels Sidebar'
                    : panelId === 'chat'
                    ? 'Chat Container'
                    : 'Member List';

                return (
                  <div
                    key={panelId}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="text-[10px] font-mono text-indigo-400 mb-0.5">
                        Slot {idx + 1}
                      </div>
                      <div className="font-semibold text-white text-xs">{label}</div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
                      <button
                        disabled={idx === 0}
                        onClick={() => {
                          const next = [...(layout.panelOrder || ['rail', 'channels', 'chat', 'members'])];
                          const temp = next[idx];
                          next[idx] = next[idx - 1];
                          next[idx - 1] = temp;
                          updateLayout({ panelOrder: next });
                        }}
                        className="flex-1 py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 text-[10px] font-medium"
                      >
                        Left
                      </button>
                      <button
                        disabled={idx === arr.length - 1}
                        onClick={() => {
                          const next = [...(layout.panelOrder || ['rail', 'channels', 'chat', 'members'])];
                          const temp = next[idx];
                          next[idx] = next[idx + 1];
                          next[idx + 1] = temp;
                          updateLayout({ panelOrder: next });
                        }}
                        className="flex-1 py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 text-[10px] font-medium"
                      >
                        Right
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 1: Major Sidebar Positions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Server Rail Position */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
              <div className="text-xs font-semibold text-white">Server Rail Position</div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {(['left', 'right', 'top', 'bottom'] as ServerRailPos[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateLayout({ serverRailPosition: pos })}
                    className={`py-1.5 px-2 rounded-lg font-medium capitalize border transition-colors ${
                      layout.serverRailPosition === pos
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Channels Sidebar Position */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
              <div className="text-xs font-semibold text-white">Channels Sidebar Position</div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {(['left', 'right'] as ChannelSidebarPos[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateLayout({ channelSidebarPosition: pos })}
                    className={`py-1.5 px-2 rounded-lg font-medium capitalize border transition-colors ${
                      layout.channelSidebarPosition === pos
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Member List Position */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
              <div className="text-xs font-semibold text-white">Member List Position</div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(['right', 'left', 'hidden'] as MemberListPos[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateLayout({ memberListPosition: pos })}
                    className={`py-1.5 px-2 rounded-lg font-medium capitalize border transition-colors ${
                      layout.memberListPosition === pos
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Action Bar & Message Input Positions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Bar (Channel Header Toolbar) */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
              <div className="text-xs font-semibold text-white">Message Input Bar Position</div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {(['bottom', 'top'] as MessageBarPos[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateLayout({ messageBarPosition: pos })}
                    className={`py-1.5 px-2 rounded-lg font-medium capitalize border transition-colors ${
                      layout.messageBarPosition === pos
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white'
                    }`}
                  >
                    {pos} of Chat
                  </button>
                ))}
              </div>
            </div>

            {/* In-app Swap Handles Toggle */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Live In-UI Swap Handles</div>
                <div className="text-[11px] text-slate-500">
                  Displays fast 1-click swap tags above sidebars in the main view
                </div>
              </div>
              <button
                onClick={() =>
                  updateLayout({ enableCustomUiHandles: !layout.enableCustomUiHandles })
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  layout.enableCustomUiHandles
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {layout.enableCustomUiHandles ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Section 3: Toolbar Buttons Reordering & Toggles */}
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400 mb-2">
              Toolbar Action Buttons (Reorder & Visibility)
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl divide-y divide-slate-800 overflow-hidden">
              {[...layout.toolbarButtons]
                .sort((a, b) => a.order - b.order)
                .map((button, index, arr) => (
                  <div
                    key={button.id}
                    className="px-4 py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 w-4 tabular-nums">
                        {index + 1}.
                      </span>
                      <span className="font-medium text-slate-200">{button.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Move up */}
                      <button
                        disabled={index === 0}
                        onClick={() => handleMoveButton(index, 'up')}
                        title="Move Earlier"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move down */}
                      <button
                        disabled={index === arr.length - 1}
                        onClick={() => handleMoveButton(index, 'down')}
                        title="Move Later"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Toggle visibility */}
                      <button
                        onClick={() => handleToggleVisibility(button.id)}
                        title={button.visible ? 'Hide from Toolbar' : 'Show in Toolbar'}
                        className={`p-1 rounded transition-colors ${
                          button.visible
                            ? 'text-indigo-400 hover:bg-indigo-950'
                            : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {button.visible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={closeModal}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

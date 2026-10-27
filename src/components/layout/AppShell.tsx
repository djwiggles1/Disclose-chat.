import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useApp } from '../../context/AppContext';
import { ServerRail } from '../navigation/ServerRail';
import { ChannelSidebar } from '../sidebar/ChannelSidebar';
import { ChatView } from '../chat/ChatView';
import { MemberList } from '../members/MemberList';
import { DraggablePanel } from './DraggablePanel';
import { AiDirectorDrawer } from '../ai/AiDirectorDrawer';
import { LayoutCustomizerModal } from '../modals/LayoutCustomizerModal';
import { AuthModal } from '../modals/AuthModal';
import { ServerSettingsModal } from '../modals/ServerSettingsModal';
import { CreateChannelModal } from '../modals/CreateChannelModal';
import { CreateServerModal } from '../modals/CreateServerModal';
import { JoinServerModal } from '../modals/JoinServerModal';
import { UserProfileModal } from '../modals/UserProfileModal';
import { VoiceStageModal } from '../modals/VoiceStageModal';
import { PanelId } from '../../types';

export const AppShell: React.FC = () => {
  const { layout, activeModal } = useApp();

  const isRailTop = layout.serverRailPosition === 'top';
  const isRailBottom = layout.serverRailPosition === 'bottom';

  // Modal selector
  const renderActiveModal = () => {
    switch (activeModal) {
      case 'auth':
        return <AuthModal />;
      case 'userProfile':
        return <UserProfileModal />;
      case 'serverSettings':
        return <ServerSettingsModal />;
      case 'createChannel':
        return <CreateChannelModal />;
      case 'createServer':
        return <CreateServerModal />;
      case 'joinServer':
        return <JoinServerModal />;
      case 'aiDirector':
        return <AiDirectorDrawer />;
      case 'layoutCustomizer':
        return <LayoutCustomizerModal />;
      case 'voiceStage':
        return <VoiceStageModal />;
      default:
        return null;
    }
  };

  // Render individual panel by ID
  const renderPanel = (panelId: PanelId, index: number) => {
    switch (panelId) {
      case 'rail':
        // Only render in slot if not pinned to top/bottom
        if (isRailTop || isRailBottom) return null;
        return (
          <DraggablePanel
            key="panel-rail"
            id="rail"
            index={index}
            label="Server Rail"
            className="w-[72px] shrink-0"
          >
            <ServerRail />
          </DraggablePanel>
        );

      case 'channels':
        return (
          <DraggablePanel
            key="panel-channels"
            id="channels"
            index={index}
            label="Channels Sidebar"
            className="w-60 shrink-0"
          >
            <ChannelSidebar />
          </DraggablePanel>
        );

      case 'chat':
        return (
          <DraggablePanel
            key="panel-chat"
            id="chat"
            index={index}
            label="Chat Viewport"
            className="flex-1 min-w-0"
          >
            <ChatView />
          </DraggablePanel>
        );

      case 'members':
        if (layout.memberListPosition === 'hidden') return null;
        return (
          <DraggablePanel
            key="panel-members"
            id="members"
            index={index}
            label="Member List"
            className="w-60 shrink-0"
          >
            <MemberList />
          </DraggablePanel>
        );

      default:
        return null;
    }
  };

  // Get filtered panel order
  const activePanels = (layout.panelOrder || ['rail', 'channels', 'chat', 'members']).filter(
    (p) => {
      if ((isRailTop || isRailBottom) && p === 'rail') return false;
      if (layout.memberListPosition === 'hidden' && p === 'members') return false;
      return true;
    }
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={`w-screen h-screen flex overflow-hidden font-sans bg-slate-950 text-slate-100 ${
          isRailTop || isRailBottom ? 'flex-col' : 'flex-row'
        } ${layout.density === 'compact' ? 'text-xs' : 'text-sm'}`}
      >
        {/* Top Server Rail (if horizontal top) */}
        {isRailTop && <ServerRail />}

        {/* Dynamic Drag-and-Drop Workspace Container */}
        <div className="flex-1 w-full h-full flex flex-row overflow-hidden relative">
          {activePanels.map((panelId, idx) => renderPanel(panelId, idx))}
        </div>

        {/* Bottom Server Rail (if horizontal bottom) */}
        {isRailBottom && <ServerRail />}

        {/* Render Active Modal */}
        {renderActiveModal()}
      </div>
    </DndProvider>
  );
};

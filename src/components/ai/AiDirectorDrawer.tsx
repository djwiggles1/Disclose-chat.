import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bot,
  Sparkles,
  X,
  Send,
  CheckCircle2,
  ListPlus,
  RefreshCw,
  FolderPlus,
  History,
  MessageSquare,
  HelpCircle,
  Code,
  Compass,
} from 'lucide-react';
import { stripEmojis } from '../../utils/emojiSanitizer';

interface ChatTurn {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export const AiDirectorDrawer: React.FC = () => {
  const {
    currentServer,
    currentChannel,
    executeAiPrompt,
    askAiQuestion,
    isAiThinking,
    lastAiActionNotice,
    currentUser,
    closeModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'qa' | 'ops'>('qa');

  // Multi-turn Q&A chat state
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([
    {
      id: 'init_1',
      role: 'model',
      content:
        'Greetings. I am Cortex AI, your server intelligence. You can ask me any technical or general questions (coding, algorithms, architecture, science, concepts), or switch to Server Ops to organize channels.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [questionInput, setQuestionInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Server Ops command input
  const [opsPrompt, setOpsPrompt] = useState('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory.length]);

  if (!currentServer) return null;

  const handleAskQuestion = async (queryText?: string) => {
    const text = queryText || questionInput;
    if (!text.trim() || isAiThinking) return;

    const userTurn: ChatTurn = {
      id: `turn_${Date.now()}`,
      role: 'user',
      content: stripEmojis(text),
      timestamp: new Date().toISOString(),
    };

    setChatHistory((prev) => [...prev, userTurn]);
    setQuestionInput('');

    // Format history for Gemini multi-turn
    const formattedHistory = chatHistory.map((h) => ({
      role: h.role,
      content: h.content,
    }));

    const answer = await askAiQuestion(userTurn.content, formattedHistory);

    const modelTurn: ChatTurn = {
      id: `turn_ai_${Date.now()}`,
      role: 'model',
      content: answer,
      timestamp: new Date().toISOString(),
    };

    setChatHistory((prev) => [...prev, modelTurn]);
  };

  const handleSendOpsPrompt = async (textToSend?: string) => {
    const text = textToSend || opsPrompt;
    if (!text.trim() || isAiThinking) return;
    setOpsPrompt('');
    await executeAiPrompt(stripEmojis(text));
  };

  const aiAuditLogs = currentServer.auditLog.filter((l) => l.isAiAction);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-slate-950 border border-indigo-900/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-950/40 border-b border-indigo-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Cortex AI Companion</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-300 border border-indigo-700/60">
                  Gemini 3.8
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Multi-turn intelligence assistant & autonomous server manager.
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-6 shrink-0">
          <button
            onClick={() => setActiveTab('qa')}
            className={`py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'qa'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ask AI (Multi-Turn Chat)</span>
          </button>
          <button
            onClick={() => setActiveTab('ops')}
            className={`py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'ops'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Channel & Server Ops</span>
          </button>
        </div>

        {/* Action Notice Banner if available */}
        {lastAiActionNotice && (
          <div className="px-6 py-2 bg-emerald-950/50 border-b border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{lastAiActionNotice}</span>
          </div>
        )}

        {/* Tab 1: Multi-Turn Q&A Chatbot */}
        {activeTab === 'qa' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {chatHistory.map((turn) => {
                const isModel = turn.role === 'model';
                return (
                  <div
                    key={turn.id}
                    className={`flex items-start gap-3 ${
                      isModel ? '' : 'flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isModel
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {isModel ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        <span className="font-semibold text-[11px]">You</span>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-xl p-3 leading-relaxed whitespace-pre-wrap ${
                        isModel
                          ? 'bg-slate-900 border border-slate-800 text-slate-200'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {turn.content}
                    </div>
                  </div>
                );
              })}

              {isAiThinking && (
                <div className="flex items-center gap-2 text-indigo-400 text-xs py-2">
                  <Bot className="w-4 h-4 animate-spin" />
                  <span>Cortex AI is generating answer...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Suggested Starter Questions */}
            {chatHistory.length <= 2 && (
              <div className="px-5 py-2 border-t border-slate-800/60 bg-slate-900/30 flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-slate-500 shrink-0">Quick prompts:</span>
                <button
                  onClick={() =>
                    handleAskQuestion('How do Server-Sent Events (SSE) compare to WebSockets?')
                  }
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0"
                >
                  SSE vs WebSockets
                </button>
                <button
                  onClick={() =>
                    handleAskQuestion('Explain how to build a modular layout system in React.')
                  }
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0"
                >
                  React Modular Layouts
                </button>
                <button
                  onClick={() =>
                    handleAskQuestion('How can we structure channels for a high-velocity engineering team?')
                  }
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0"
                >
                  Team Channel Taxonomy
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskQuestion();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(stripEmojis(e.target.value))}
                  placeholder="Ask Cortex AI any question (programming, concepts, advice)..."
                  className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!questionInput.trim() || isAiThinking}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Ask</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Channel & Server Ops */}
        {activeTab === 'ops' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Quick Action Presets */}
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400 mb-2">
                  Instant Architectural Actions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    disabled={isAiThinking}
                    onClick={() =>
                      handleSendOpsPrompt(
                        'Analyze recent chat discussions in this channel, determine top unaddressed themes, and create new channels or categories for them.'
                      )
                    }
                    className="p-3 text-left rounded-xl bg-slate-900/90 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-700/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2 text-indigo-400 font-medium text-xs mb-1 group-hover:text-indigo-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analyze & Suggest Channels</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Scans transcript in #{currentChannel?.name} to identify topics and spin up matching channels.
                    </p>
                  </button>

                  <button
                    disabled={isAiThinking}
                    onClick={() =>
                      handleSendOpsPrompt(
                        'Review all current channel names and topics in this server and rename or adjust topics so the server is clean, professional, and well organized.'
                      )
                    }
                    className="p-3 text-left rounded-xl bg-slate-900/90 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-700/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2 text-indigo-400 font-medium text-xs mb-1 group-hover:text-indigo-300">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Auto-Organize Server Channels</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Refines naming conventions to kebab-case and categorizes channels logically.
                    </p>
                  </button>

                  <button
                    disabled={isAiThinking}
                    onClick={() =>
                      handleSendOpsPrompt(
                        'Create a new category called PROJECT ARCHIVE and create a text channel called #project-briefs under it.'
                      )
                    }
                    className="p-3 text-left rounded-xl bg-slate-900/90 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-700/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2 text-indigo-400 font-medium text-xs mb-1 group-hover:text-indigo-300">
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Create Category & Channels</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Generates structured channel groups with default configurations.
                    </p>
                  </button>

                  <button
                    disabled={isAiThinking}
                    onClick={() =>
                      handleSendOpsPrompt(
                        'Create an announcement channel called #product-roadmap with topic "Weekly milestone releases and architecture updates".'
                      )
                    }
                    className="p-3 text-left rounded-xl bg-slate-900/90 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-700/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2 text-indigo-400 font-medium text-xs mb-1 group-hover:text-indigo-300">
                      <ListPlus className="w-3.5 h-3.5" />
                      <span>Create Announcement Channel</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Sets up dedicated broadcast channel with custom topic and permissions.
                    </p>
                  </button>
                </div>
              </div>

              {/* AI Execution History / Audit Log */}
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>AI Operations Log ({aiAuditLogs.length})</span>
                </div>

                {aiAuditLogs.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-500">
                    No autonomous AI actions logged yet. Send a command above to see Cortex AI execute channel operations in real-time.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {aiAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono text-indigo-400 font-semibold mr-2">
                            [{log.action}]
                          </span>
                          <span className="text-slate-200">{log.details}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 tabular-nums">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Natural Language Channel Instruction Input */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendOpsPrompt();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={opsPrompt}
                  onChange={(e) => setOpsPrompt(stripEmojis(e.target.value))}
                  placeholder="Tell Cortex AI what channels to create or organize..."
                  className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!opsPrompt.trim() || isAiThinking}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Execute Ops</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

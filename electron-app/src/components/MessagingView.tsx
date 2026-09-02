import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  User,
  CheckCheck,
  Phone,
} from 'lucide-react';
import { UserDID } from '../types/auth';

interface Message {
  id: string;
  sender: 'inbound' | 'outbound';
  text: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  contactName: string;
  phoneNumber: string;
  unreadCount: number;
  lastMessage: string;
  lastTimestamp: number;
  messages: Message[];
}

interface MessagingViewProps {
  dids: UserDID[];
  selectedDidId: string | null;
  onSelectDid: (id: string) => void;
  onCall?: (num: string) => void;
}

const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    contactName: 'Alice Smith',
    phoneNumber: '+14155552671',
    unreadCount: 1,
    lastMessage: 'Sounds great! Looking forward to the demo.',
    lastTimestamp: Date.now() - 1000 * 60 * 15,
    messages: [
      {
        id: 'm1',
        sender: 'inbound',
        text: 'Hello, are we still scheduled for today at 3pm?',
        timestamp: Date.now() - 1000 * 60 * 60,
      },
      {
        id: 'm2',
        sender: 'outbound',
        text: 'Yes absolutely! Connecting to conference line now.',
        timestamp: Date.now() - 1000 * 60 * 45,
      },
      {
        id: 'm3',
        sender: 'inbound',
        text: 'Sounds great! Looking forward to the demo.',
        timestamp: Date.now() - 1000 * 60 * 15,
      },
    ],
  },
  {
    id: 'conv-2',
    contactName: 'Delivery Dispatch',
    phoneNumber: '+18005550199',
    unreadCount: 0,
    lastMessage: 'Your equipment order #5821 has shipped.',
    lastTimestamp: Date.now() - 1000 * 60 * 60 * 5,
    messages: [
      {
        id: 'm4',
        sender: 'inbound',
        text: 'Your equipment order #5821 has shipped.',
        timestamp: Date.now() - 1000 * 60 * 60 * 5,
      },
    ],
  },
];

export const MessagingView: React.FC<MessagingViewProps> = ({
  dids,
  selectedDidId,
  onSelectDid,
  onCall,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string>(SAMPLE_CONVERSATIONS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const messagingDids = dids.filter((d) => d.messaging_enabled !== false);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !activeConv) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'outbound',
      text: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            lastMessage: newMsg.text,
            lastTimestamp: newMsg.timestamp,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setInputMessage('');
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.contactName.toLowerCase().includes(q) || c.phoneNumber.includes(q);
  });

  return (
    <div className="flex h-full w-full max-w-5xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-fadeIn">
      {/* Sidebar: Conversation List */}
      <div className="w-full sm:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        {/* Outbound DID Selector & Title */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Messages
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-semibold">
              SMS / Chat
            </span>
          </div>

          {/* Outbound DID Dropdown */}
          {messagingDids.length > 0 && (
            <div>
              <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block mb-1">
                Sending From (DID)
              </label>
              <select
                value={selectedDidId || messagingDids[0]?.id}
                onChange={(e) => onSelectDid(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {messagingDids.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.number || d.did_number} ({d.name || 'DID'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConv?.id;
            return (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  // mark read
                  setConversations((prev) =>
                    prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                  );
                }}
                className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-brand-50 dark:bg-brand-950/30 border-l-4 border-brand-600'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {conv.contactName.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {conv.contactName}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(conv.lastTimestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {conv.lastMessage}
                  </p>
                </div>

                {conv.unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] flex items-center justify-center font-bold">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Thread */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900">
        {activeConv ? (
          <>
            {/* Conversation Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-semibold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {activeConv.contactName}
                  </h3>
                  <p className="text-xs font-mono text-slate-500">{activeConv.phoneNumber}</p>
                </div>
              </div>

              {onCall && (
                <button
                  onClick={() => onCall(activeConv.phoneNumber)}
                  title="Call this number"
                  className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Message Bubbles Viewport */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {activeConv.messages.map((m) => {
                const isMe = m.sender === 'outbound';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-brand-600 text-white rounded-br-xs shadow-md shadow-brand-600/10'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                      <span>
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && <CheckCheck className="w-3 h-3 text-brand-600 dark:text-brand-400" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input Box */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 text-sm rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white transition-all shadow-md shadow-brand-600/20 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

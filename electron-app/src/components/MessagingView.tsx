import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  User,
  CheckCheck,
  Phone,
  ArrowLeft,
  Paperclip,
  Smile,
  X,
  FileText,
} from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { UserDID } from '../types/auth';

interface Message {
  id: string;
  sender: 'inbound' | 'outbound';
  text: string;
  timestamp: number;
  attachmentName?: string;
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
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputMessage]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const messagingDids = dids.filter((d) => d.messaging_enabled !== false);

  useEffect(() => {
    if (!isEmojiPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEmojiPickerOpen]);

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setInputMessage((prev) => prev + emojiData.emoji);
    setIsEmojiPickerOpen(false);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPendingAttachment(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && !pendingAttachment) || !activeConv) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'outbound',
      text: inputMessage.trim(),
      timestamp: Date.now(),
      attachmentName: pendingAttachment?.name,
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
    setPendingAttachment(null);
    setIsEmojiPickerOpen(false);
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.contactName.toLowerCase().includes(q) || c.phoneNumber.includes(q);
  });

  return (
    <div className="flex flex-1 w-full min-h-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden animate-fadeIn">
      {/* Sidebar: Conversation List */}
      <div
        className={`w-full sm:w-80 shrink-0 border-r border-slate-200 dark:border-slate-800 flex-col bg-slate-50/50 dark:bg-slate-900/50 ${
          showThreadOnMobile ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* Outbound DID Selector & Title */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Messages
            </h2>
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
                  setShowThreadOnMobile(true);
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
      <div
        className={`flex-1 flex-col h-full bg-white dark:bg-slate-900 min-w-0 ${
          showThreadOnMobile ? 'flex' : 'hidden sm:flex'
        }`}
      >
        {activeConv ? (
          <>
            {/* Conversation Header */}
            <div className="px-3 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setShowThreadOnMobile(false)}
                  title="Back to conversations"
                  className="sm:hidden p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-semibold text-xs shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {activeConv.contactName}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 truncate">{activeConv.phoneNumber}</p>
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
                      {m.attachmentName && (
                        <div
                          className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-xl mb-1.5 ${
                            isMe ? 'bg-white/15' : 'bg-white dark:bg-slate-700'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{m.attachmentName}</span>
                        </div>
                      )}
                      {m.text && <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>}
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
            <div className="border-t border-slate-200 dark:border-slate-800">
              {pendingAttachment && (
                <div className="flex items-center gap-2 px-3 pt-2.5">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 max-w-full">
                    <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                    <span className="truncate">{pendingAttachment.name}</span>
                    <button
                      type="button"
                      onClick={() => setPendingAttachment(null)}
                      title="Remove attachment"
                      className="p-0.5 rounded-md text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="p-3 flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleAttachmentChange}
                  className="hidden"
                />

                <div className="relative shrink-0" ref={emojiPickerRef}>
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen((v) => !v)}
                    title="Add emoji"
                    className={`p-2.5 rounded-2xl transition-colors cursor-pointer ${
                      isEmojiPickerOpen
                        ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {isEmojiPickerOpen && (
                    <div className="absolute bottom-full mb-2 left-0 z-30 animate-popIn">
                      <EmojiPicker
                        onEmojiClick={handleEmojiSelect}
                        theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                        width={300}
                        height={360}
                        searchDisabled={false}
                        skinTonesDisabled
                        previewConfig={{ showPreview: false }}
                      />
                    </div>
                  )}
                </div>

                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 min-w-0 min-h-[42px] px-4 py-2.5 text-sm rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none max-h-[120px] overflow-y-auto leading-normal"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach a file"
                  className="p-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={!inputMessage.trim() && !pendingAttachment}
                  className="p-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white transition-all shadow-md shadow-brand-600/20 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
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

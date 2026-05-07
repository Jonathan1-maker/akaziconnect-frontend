'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useSocket } from '@/lib/SocketContext';

const MESSAGE_LIMIT = 5;

export default function ChatPage() {
  const { userId } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { socket, onlineUsers, reconnect } = useSocket();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [limitReached, setLimitReached] = useState(false);
  const [limitMsg, setLimitMsg] = useState('');

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const isOnline = onlineUsers.some((id) => id.toString() === userId.toString());
  const remaining = Math.max(0, MESSAGE_LIMIT - messages.length);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (user && !socket) reconnect();
  }, [user, socket]);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    api.get(`/chat/${userId}`)
      .then((r) => {
        // handle both old array format and new object format
        const data = r.data;
        if (Array.isArray(data)) {
          setMessages(data);
          setLimitReached(data.length >= MESSAGE_LIMIT);
        } else {
          setMessages(data.messages || []);
          setLimitReached(data.limitReached || false);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));

    api.get(`/auth/user/${userId}`)
      .then((r) => setOtherUser(r.data))
      .catch(() => setOtherUser({ name: 'User' }));
  }, [userId, user]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;
      const myId = user?._id;

      if (
        senderId?.toString() === userId || receiverId?.toString() === userId ||
        senderId?.toString() === myId || receiverId?.toString() === myId
      ) {
        setMessages((prev) => {
          const exists = prev.find((m) => m._id?.toString() === msg._id?.toString());
          if (exists) return prev;
          const updated = [...prev, msg];
          if (updated.length >= MESSAGE_LIMIT) setLimitReached(true);
          return updated;
        });
        socket.emit('mark_read', { senderId: userId });
      }
    };

    const handleTyping = ({ senderId, isTyping: typing }) => {
      if (senderId?.toString() === userId?.toString()) setIsTyping(typing);
    };

    const handleLimitReached = ({ message }) => {
      setLimitReached(true);
      setLimitMsg(message);
    };

    socket.on('receive_message', handleMessage);
    socket.on('typing', handleTyping);
    socket.on('message_limit_reached', handleLimitReached);

    return () => {
      socket.off('receive_message', handleMessage);
      socket.off('typing', handleTyping);
      socket.off('message_limit_reached', handleLimitReached);
    };
  }, [socket, userId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket || limitReached) return;
    socket.emit('send_message', { receiverId: userId, content: input.trim() });
    setInput('');
    clearTimeout(typingTimeout.current);
    socket.emit('typing', { receiverId: userId, isTyping: false });
  };

  const handleTypingInput = (e) => {
    setInput(e.target.value);
    if (!socket || limitReached) return;
    socket.emit('typing', { receiverId: userId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', { receiverId: userId, isTyping: false });
    }, 1500);
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const groupByDate = (msgs) => {
    const groups = {};
    msgs.forEach((msg) => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const isMe = (msg) => {
    const senderId = msg.sender?._id?.toString() || msg.sender?.toString();
    return senderId === user?._id?.toString();
  };

  if (loading || fetching) return (
    <div className="flex flex-col h-[calc(100dvh-64px)] max-w-2xl mx-auto px-4 py-4 gap-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`h-10 w-48 rounded-2xl animate-pulse bg-gray-200 dark:bg-slate-700 ${i % 2 === 0 ? 'self-start' : 'self-end'}`} />
      ))}
    </div>
  );

  const grouped = groupByDate(messages);

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mr-1 text-lg">←</button>
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
            {otherUser?.name?.[0]?.toUpperCase() || '?'}
          </div>
          {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-800 dark:text-white text-sm">{otherUser?.name || 'User'}</p>
          <p className={`text-xs ${isOnline ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}>
            {isOnline ? '● Online' : 'Offline'}
          </p>
        </div>
        {/* Message counter */}
        <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          limitReached
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : remaining <= 2
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
            : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
        }`}>
          {limitReached ? '🔒 Limit reached' : `${messages.length}/${MESSAGE_LIMIT} msgs`}
        </div>
      </div>

      {/* Limit banner */}
      <AnimatePresence>
        {limitReached && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-700 px-4 py-3 text-center"
          >
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">🔒 Free message limit reached</p>
            <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">
              {limitMsg || `You've used all ${MESSAGE_LIMIT} free messages in this conversation.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1 bg-gray-50 dark:bg-slate-900">
        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
            No messages yet. Say hello! 👋
            <p className="text-xs mt-1">You have {MESSAGE_LIMIT} free messages</p>
          </div>
        )}

        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="text-center my-3">
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-700 px-3 py-1 rounded-full shadow-sm">{date}</span>
            </div>
            {msgs.map((msg, i) => (
              <motion.div
                key={msg._id || i}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex mb-1.5 ${isMe(msg) ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75vw] sm:max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  isMe(msg)
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-100 dark:border-slate-600 rounded-bl-sm'
                }`}>
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe(msg) ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}`}>
                    {formatTime(msg.createdAt)}
                    {isMe(msg) && <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ))}

        <AnimatePresence>
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="flex justify-start mb-1">
              <div className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center shadow-sm">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                    animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {limitReached ? (
        <div className="bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 px-4 py-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            🔒 Message limit reached for this conversation
          </p>
        </div>
      ) : (
        <form onSubmit={sendMessage} className="bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 px-4 py-3 flex gap-3 items-center">
          <input
            type="text" value={input} onChange={handleTypingInput}
            placeholder={`Type a message… (${remaining} left)`}
            className="flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors placeholder-gray-400"
          />
          <motion.button type="submit" whileTap={{ scale: 0.92 }}
            disabled={!input.trim() || !socket}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center transition-colors flex-shrink-0"
          >➤</motion.button>
        </form>
      )}
    </div>
  );
}

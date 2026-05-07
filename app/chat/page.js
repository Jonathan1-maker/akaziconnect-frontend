'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useT } from '@/lib/LangContext';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function ChatInboxPage() {
  const t = useT();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    api.get('/chat')
      .then((r) => setConversations(r.data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || fetching) return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t('chat.title')}</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl">
          <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-gray-200 dark:text-slate-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('chat.noConversations')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('chat.noConversationsHint')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conv, i) => (
            <motion.button
              key={conv.userId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => router.push(`/chat/${conv.userId}`)}
              className="w-full flex items-center gap-4 glass-card rounded-2xl p-4 text-left border-transparent"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg shadow-primary-500/20">
                {conv.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{conv.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(conv.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{conv.lastMessage}</p>
                  {conv.unread > 0 && (
                    <span className="bg-primary-600 text-white text-[10px] font-bold w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 animate-pulse">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

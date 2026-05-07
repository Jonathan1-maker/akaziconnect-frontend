'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from './api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  }, [user]);

  // fetch on mount and whenever user changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // re-fetch whenever socket reconnects — ensures admin gets fresh notifications after login
  useEffect(() => {
    if (connected && user) fetchNotifications();
  }, [connected, user]);

  // real-time: push incoming notification to top of list
  useEffect(() => {
    if (!socket) return;

    const handler = (notif) => {
      setNotifications((prev) => {
        // avoid duplicates
        const exists = prev.find((n) => n._id === notif._id);
        if (exists) return prev;
        return [notif, ...prev];
      });
      setUnreadCount((c) => c + 1);
    };

    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const remove = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      const notif = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (notif && !notif.read) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, remove, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

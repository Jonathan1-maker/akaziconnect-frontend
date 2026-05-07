'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  const connect = (token) => {
    if (!token) return;

    const s = io('http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('online_users', (users) => setOnlineUsers(users));

    setSocket(s);
    return s;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const s = connect(token);
    return () => {
      if (s) { s.disconnect(); setSocket(null); setConnected(false); }
    };
  }, []);

  const reconnect = () => {
    if (socket) { socket.disconnect(); setSocket(null); setConnected(false); }
    const token = localStorage.getItem('token');
    if (token) connect(token);
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, connected, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

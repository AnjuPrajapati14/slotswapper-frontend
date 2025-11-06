import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface UseSocketOptions {
  onSwapRequestReceived?: () => void;
  onSwapRequestResponded?: () => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    const socket = io(socketUrl, {
      autoConnect: false,
    });

    socketRef.current = socket;

    socket.connect();

    socket.on('connect', () => {
      console.log('Connected to server');
      socket.emit('join', user.id);
    });

    socket.on('swapRequestReceived', (data: { message: string; requesterName: string }) => {
      toast.success(`New swap request from ${data.requesterName}!`, {
        duration: 5000,
        icon: '🔄',
      });
      options.onSwapRequestReceived?.();
    });

    socket.on('swapRequestAccepted', (data: { message: string }) => {
      toast.success(data.message, {
        duration: 5000,
        icon: '✅',
      });
      options.onSwapRequestResponded?.();
    });

    socket.on('swapRequestRejected', (data: { message: string }) => {
      toast.error(data.message, {
        duration: 5000,
        icon: '❌',
      });
      options.onSwapRequestResponded?.();
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user, options.onSwapRequestReceived, options.onSwapRequestResponded]);

  return socketRef.current;
};
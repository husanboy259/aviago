import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3004';
const DRONE_WS_URL = process.env.NEXT_PUBLIC_DRONE_WS_URL || 'http://localhost:3005';

let orderSocket: Socket | null = null;
let trackingSocket: Socket | null = null;

export function getOrderSocket(): Socket {
  if (!orderSocket || !orderSocket.connected) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    orderSocket = io(`${WS_URL}/orders`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return orderSocket;
}

export function getTrackingSocket(): Socket {
  if (!trackingSocket || !trackingSocket.connected) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    trackingSocket = io(`${DRONE_WS_URL}/tracking`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
    });
  }
  return trackingSocket;
}

export function disconnectAll() {
  orderSocket?.disconnect();
  trackingSocket?.disconnect();
  orderSocket = null;
  trackingSocket = null;
}

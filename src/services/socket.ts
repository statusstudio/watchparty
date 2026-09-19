import { WSClientMessage, WSServerMessage } from '../types/index.js';

export type SocketListener = (msg: WSServerMessage) => void;

export class SocketService {
  private ws: WebSocket | null = null;
  private listeners: Set<SocketListener> = new Set();
  private reconnectTimer: any = null;
  private url: string;
  private isExplicitlyClosed = false;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.url = `${protocol}//${host}/ws`;
  }

  public connect(onOpen?: () => void) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('✅ Connected to WatchParty WebSocket server');
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      onOpen?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSServerMessage;
        this.listeners.forEach((listener) => listener(data));
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    this.ws.onclose = () => {
      if (!this.isExplicitlyClosed) {
        console.warn('WebSocket connection lost, reconnecting in 2s...');
        this.reconnectTimer = setTimeout(() => this.connect(onOpen), 2000);
      }
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  public send(msg: WSClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('Cannot send message, WebSocket is not open', msg);
    }
  }

  public subscribe(listener: SocketListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socketService = new SocketService();

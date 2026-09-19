import { WSClientMessage, WSServerMessage } from '../types/index.js';

export type SocketListener = (msg: WSServerMessage) => void;

export class SocketService {
  private ws: WebSocket | null = null;
  private listeners: Set<SocketListener> = new Set();
  private onConnectCallbacks: Set<() => void> = new Set();
  private messageQueue: WSClientMessage[] = [];
  private reconnectTimer: any = null;
  private url: string;
  private isExplicitlyClosed = false;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.url = `${protocol}//${host}/ws`;
  }

  public registerOnConnect(cb: () => void): () => void {
    this.onConnectCallbacks.add(cb);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        cb();
      } catch (err) {
        console.error('Error in onConnect callback:', err);
      }
    }
    return () => {
      this.onConnectCallbacks.delete(cb);
    };
  }

  public connect(onOpen?: () => void) {
    if (onOpen) {
      this.registerOnConnect(onOpen);
    }

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

      // 1. Run all registered onConnect handlers (e.g. re-join room)
      this.onConnectCallbacks.forEach((cb) => {
        try {
          cb();
        } catch (err) {
          console.error('Error in onConnect handler:', err);
        }
      });

      // 2. Flush queued messages
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        if (msg && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(msg));
        }
      }
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
        console.warn('WebSocket connection lost, reconnecting in 1.5s...');
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 1500);
        }
      }
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  public send(msg: WSClientMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
      return true;
    } else {
      console.warn('WebSocket not open, queuing message for reconnect:', msg);
      this.messageQueue.push(msg);
      this.connect();
      return false;
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

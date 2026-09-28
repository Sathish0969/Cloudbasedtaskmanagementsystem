/**
 * Real-time WebSocket Client for Cloud Task Manager
 * Features automatic reconnection with exponential backoff, heartbeat keep-alive,
 * and typed event dispatcher for task mutations.
 */

class TaskWebSocketClient {
  constructor() {
    this.ws = null;
    this.url = this.resolveWsUrl();
    this.statusListeners = new Set();
    this.eventListeners = new Map();
    this.status = 'disconnected'; // 'connecting' | 'connected' | 'disconnected'
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 20;
    this.reconnectTimeout = null;
    this.heartbeatInterval = null;
  }

  resolveWsUrl() {
    if (typeof window === 'undefined') return 'ws://127.0.0.1:5000/ws/tasks';
    const isHttps = window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    const host = window.location.host;
    // When running Vite dev server (e.g. localhost:5173), Vite proxies /ws to FastAPI port 5000
    return `${protocol}//${host}/ws/tasks`;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const message = JSON.parse(event.data);
          if (message.type) {
            this.dispatch(message.type, message.payload);
          }
        } catch (err) {
          console.warn('[WS] Non-JSON payload received:', event.data);
        }
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[WS] Connection issue:', err);
        if (this.ws) this.ws.close();
      };
    } catch (err) {
      console.warn('[WS] Connection init error:', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 25000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  setStatus(newStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((listener) => {
      try {
        listener(newStatus);
      } catch (e) {
        console.error('[WS Status Listener error]', e);
      }
    });
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  on(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType).add(callback);
    return () => {
      const set = this.eventListeners.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.eventListeners.delete(eventType);
      }
    };
  }

  dispatch(eventType, payload) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`[WS Event handler error: ${eventType}]`, e);
        }
      });
    }

    // Also dispatch wildcard
    const allListeners = this.eventListeners.get('*');
    if (allListeners) {
      allListeners.forEach((cb) => {
        try {
          cb(eventType, payload);
        } catch (e) {
          console.error('[WS Wildcard handler error]', e);
        }
      });
    }
  }

  disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }
}

export const taskWs = new TaskWebSocketClient();

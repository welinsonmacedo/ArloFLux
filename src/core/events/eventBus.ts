import { EventType, EventPayloads } from './eventTypes';
import { logger } from '@/core/logger/logger';

type EventCallback<T extends EventType> = (payload: EventPayloads[T]) => void;

class EventBus {
  private listeners: Map<EventType, Set<EventCallback<any>>> = new Map();

  on<T extends EventType>(event: T, callback: EventCallback<T>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // Retorna função de unsubscribe
    return () => this.off(event, callback);
  }

  off<T extends EventType>(event: T, callback: EventCallback<T>) {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;
    eventListeners.delete(callback);
    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<T extends EventType>(event: T, payload: EventPayloads[T]) {
    logger.debug(`[EventBus] Emitting ${event}`, payload);
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;
    
    eventListeners.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        logger.error(`[EventBus] Error in listener for ${event}`, error);
      }
    });
  }
}

export const eventBus = new EventBus();

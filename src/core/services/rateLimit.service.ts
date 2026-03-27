// core/services/rateLimit.service.ts
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorTypes';

interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

class RateLimitService {
  private storage: Map<string, RateLimitRecord> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutos
  private readonly BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

  async checkLimit(identifier: string): Promise<void> {
    const now = Date.now();
    const record = this.storage.get(identifier);

    if (!record) {
      return;
    }

    // Verificar se está bloqueado
    if (record.blockedUntil && record.blockedUntil > now) {
      const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
      throw new AppError(
        ErrorCode.AUTH_RATE_LIMIT_EXCEEDED,
        `Muitas tentativas. Aguarde ${remainingMinutes} minutos.`,
        { field: identifier }
      );
    }

    // Resetar se a janela expirou
    if (now - record.firstAttempt > this.WINDOW_MS) {
      this.storage.delete(identifier);
      return;
    }

    // Verificar se excedeu o limite
    if (record.attempts >= this.MAX_ATTEMPTS) {
      record.blockedUntil = now + this.BLOCK_DURATION_MS;
      throw new AppError(
        ErrorCode.AUTH_RATE_LIMIT_EXCEEDED,
        'Muitas tentativas de login. Tente novamente em 15 minutos.',
        { field: identifier }
      );
    }
  }

  async recordAttempt(identifier: string, success: boolean): Promise<void> {
    const now = Date.now();
    let record = this.storage.get(identifier);

    if (!record) {
      record = {
        attempts: 0,
        firstAttempt: now,
        lastAttempt: now,
      };
    }

    if (!success) {
      record.attempts++;
      record.lastAttempt = now;
    } else {
      // Limpar após login bem-sucedido
      this.storage.delete(identifier);
      return;
    }

    this.storage.set(identifier, record);

    // Cleanup automático após 1 hora
    setTimeout(() => {
      const current = this.storage.get(identifier);
      if (current && now - current.lastAttempt > 3600000) {
        this.storage.delete(identifier);
      }
    }, 3600000);
  }

  // Método para limpar registros (útil em testes)
  clear(): void {
    this.storage.clear();
  }
}

export const rateLimitService = new RateLimitService();
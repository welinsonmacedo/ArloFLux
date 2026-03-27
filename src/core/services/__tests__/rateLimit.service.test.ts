// src/core/services/__tests__/rateLimit.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimitService } from '../rateLimit.service';
import { AppError } from '../../errors/AppError';
import { ErrorCode } from '../../errors/errorTypes';

describe('RateLimitService', () => {
  beforeEach(() => {
    rateLimitService.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow login attempts within limit', async () => {
    const identifier = 'test@email.com:tenant1';
    
    for (let i = 0; i < 4; i++) {
      await expect(rateLimitService.checkLimit(identifier)).resolves.not.toThrow();
      await rateLimitService.recordAttempt(identifier, false);
    }
    
    await expect(rateLimitService.checkLimit(identifier)).resolves.not.toThrow();
  });

  it('should block after max attempts', async () => {
    const identifier = 'test@email.com:tenant1';
    
    for (let i = 0; i < 5; i++) {
      await rateLimitService.recordAttempt(identifier, false);
    }
    
    await expect(rateLimitService.checkLimit(identifier)).rejects.toThrow(AppError);
    await expect(rateLimitService.checkLimit(identifier)).rejects.toMatchObject({
      code: ErrorCode.AUTH_RATE_LIMIT_EXCEEDED,
    });
  });

  it('should reset after successful login', async () => {
    const identifier = 'test@email.com:tenant1';
    
    // 3 tentativas falhas
    for (let i = 0; i < 3; i++) {
      await rateLimitService.recordAttempt(identifier, false);
    }
    
    // Login bem-sucedido
    await rateLimitService.recordAttempt(identifier, true);
    
    // Deve permitir novas tentativas
    await expect(rateLimitService.checkLimit(identifier)).resolves.not.toThrow();
  });

  it('should reset after window expires', async () => {
    const identifier = 'test@email.com:tenant1';
    
    for (let i = 0; i < 5; i++) {
      await rateLimitService.recordAttempt(identifier, false);
    }
    
    // Avançar 16 minutos
    vi.advanceTimersByTime(16 * 60 * 1000);
    
    await expect(rateLimitService.checkLimit(identifier)).resolves.not.toThrow();
  });
});
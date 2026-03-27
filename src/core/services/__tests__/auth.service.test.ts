// src/core/services/__tests__/auth.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../auth.service';
import { supabase } from '@/core/api/supabaseClient';
import { AppError } from '../../errors/AppError';
import { ErrorCode } from '../../errors/errorTypes';

vi.mock('@/core/api/supabaseClient');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      const mockUser = { id: 'user-123', email: mockCredentials.email };
      const mockStaff = {
        id: 'staff-123',
        name: 'Test User',
        role: 'ADMIN',
        email: mockCredentials.email,
        tenant_id: 'tenant-123',
        tenants: { id: 'tenant-123', slug: 'test-restaurant', name: 'Test' },
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockStaff, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockStaff, error: null }),
      } as any));

      const result = await AuthService.login(mockCredentials, 'test-restaurant');
      
      expect(result.user).toEqual(mockUser);
      expect(result.staff).toEqual(mockStaff);
    });

    it('should throw error for invalid credentials', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', code: 'invalid_credentials' },
      });

      await expect(AuthService.login(mockCredentials, 'test-restaurant'))
        .rejects
        .toThrow(AppError);
      
      await expect(AuthService.login(mockCredentials, 'test-restaurant'))
        .rejects
        .toMatchObject({
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        });
    });

    it('should throw error for tenant mismatch', async () => {
      const mockUser = { id: 'user-123', email: mockCredentials.email };
      const mockStaff = {
        id: 'staff-123',
        name: 'Test User',
        role: 'ADMIN',
        email: mockCredentials.email,
        tenant_id: 'tenant-456',
        tenants: { id: 'tenant-456', slug: 'other-restaurant', name: 'Other' },
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockStaff, error: null }),
      } as any));

      await expect(AuthService.login(mockCredentials, 'test-restaurant'))
        .rejects
        .toMatchObject({
          code: ErrorCode.AUTH_TENANT_MISMATCH,
        });
    });
  });

  describe('register', () => {
    const mockRegisterData = {
      email: 'new@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    it('should successfully register new user', async () => {
      const mockUser = { id: 'user-123', email: mockRegisterData.email };
      
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await AuthService.register(mockRegisterData);
      
      expect(result.user).toEqual(mockUser);
      expect(result.requiresEmailConfirmation).toBe(true);
    });

    it('should throw error for existing email', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', code: 'user_already_exists' },
      });

      await expect(AuthService.register(mockRegisterData))
        .rejects
        .toThrow(AppError);
    });
  });
});
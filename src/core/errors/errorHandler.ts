// src/core/errors/errorHandler.ts (atualizado)
import { captureException, addBreadcrumb } from '../monitoring/sentry';
import { AppError } from './AppError';
import { ErrorCode } from './errorTypes';

export class ErrorHandler {
  static handle(error: unknown): AppError {
    console.error('Error caught:', error);
    
    // Adicionar breadcrumb
    addBreadcrumb('Error caught', { error: JSON.stringify(error) });
    
    let appError: AppError;
    
    if (error instanceof AppError) {
      appError = error;
    } else if (error && typeof error === 'object' && 'code' in error) {
      appError = this.handleSupabaseError(error as any);
    } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
      appError = new AppError(
        ErrorCode.NETWORK_CONNECTION_ERROR,
        error.message,
        { originalError: error }
      );
    } else if (error instanceof DOMException && error.name === 'TimeoutError') {
      appError = new AppError(
        ErrorCode.NETWORK_TIMEOUT,
        error.message,
        { originalError: error }
      );
    } else {
      appError = new AppError(
        ErrorCode.UNKNOWN_ERROR,
        error instanceof Error ? error.message : 'Unknown error',
        { originalError: error }
      );
    }
    
    // Capturar no Sentry
    captureException(appError, {
      component: 'ErrorHandler',
      timestamp: new Date().toISOString(),
    });

    // Já é um AppError
    if (error instanceof AppError) {
      return error;
    }

    // Erro do Supabase
    if (error && typeof error === 'object' && 'code' in error) {
      return this.handleSupabaseError(error as any);
    }

    // Erro de rede
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return new AppError(
        ErrorCode.NETWORK_CONNECTION_ERROR,
        error.message,
        { originalError: error }
      );
    }

    // Erro de timeout
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return new AppError(
        ErrorCode.NETWORK_TIMEOUT,
        error.message,
        { originalError: error }
      );
    }

    // Erro de validação genérico
    if (error instanceof Error) {
      if (error.message.includes('password')) {
        return new AppError(
          ErrorCode.VALIDATION_WEAK_PASSWORD,
          error.message,
          { originalError: error }
        );
      }
      
      if (error.message.includes('email')) {
        return new AppError(
          ErrorCode.VALIDATION_INVALID_EMAIL,
          error.message,
          { originalError: error }
        );
      }
    }

    // Erro desconhecido
    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      error instanceof Error ? error.message : 'Unknown error',
      { originalError: error }
    );
  }

  private static handleSupabaseError(error: any): AppError {
    const errorMap: Record<string, { code: ErrorCode; message: string }> = {
      'invalid_credentials': {
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: error.message
      },
      'email_not_confirmed': {
        code: ErrorCode.AUTH_EMAIL_NOT_CONFIRMED,
        message: error.message
      },
      'user_not_found': {
        code: ErrorCode.AUTH_USER_NOT_FOUND,
        message: error.message
      },
      'rate_limit_exceeded': {
        code: ErrorCode.AUTH_RATE_LIMIT_EXCEEDED,
        message: error.message
      },
      '23505': { // Unique violation
        code: ErrorCode.DB_CONFLICT,
        message: 'Registro duplicado encontrado.'
      },
      'PGRST116': { // Not found
        code: ErrorCode.DB_NOT_FOUND,
        message: 'Registro não encontrado.'
      }
    };

    const mapped = errorMap[error.code] || errorMap[error.message];
    
    if (mapped) {
      return new AppError(
        mapped.code,
        mapped.message,
        { originalError: error },
        error.status
      );
    }

    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      error.message,
      { originalError: error },
      error.status
    );
  }

  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Não retentar erros de autenticação
        if (error instanceof AppError && 
            error.code.startsWith('AUTH_')) {
          throw error;
        }
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError!;
  }
}
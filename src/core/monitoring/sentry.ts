// src/core/monitoring/sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { AppError } from '../errors/AppError';

const isDevelopment = import.meta.env.MODE === 'development';

export const initSentry = () => {
  if (isDevelopment) {
    console.log('Sentry disabled in development');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.VITE_APP_ENV || 'production',
    beforeSend(event) {
      // Não enviar erros de desenvolvimento
      if (isDevelopment) return null;
      return event;
    },
  });
};

export const captureException = (error: Error | AppError, context?: Record<string, any>) => {
  if (isDevelopment) {
    console.error('Error captured:', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
    tags: {
      errorCode: error instanceof AppError ? error.code : 'UNKNOWN',
    },
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (isDevelopment) {
    console.log(`[${level}] ${message}`);
    return;
  }

  Sentry.captureMessage(message, level);
};

export const setUserContext = (user: { id: string; email: string; role?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

export const addBreadcrumb = (message: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  });
};
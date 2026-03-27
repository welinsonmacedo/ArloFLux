// src/core/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { captureException } from '../monitoring/sentry';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      throwOnError: (error) => {
        // Não lançar erro para certos tipos
        if (error instanceof Error && error.message.includes('404')) {
          return false;
        }
        return true;
      },
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        captureException(error as Error, { source: 'mutation' });
      },
    },
  },
});

// Cache utilities
export const invalidateQueries = async (queryKeys: string[]) => {
  await Promise.all(queryKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
};

export const clearCache = () => {
  queryClient.clear();
};

export const prefetchData = async <T>(
  queryKey: string[],
  queryFn: () => Promise<T>
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: 60 * 1000, // 1 minuto
  });
};
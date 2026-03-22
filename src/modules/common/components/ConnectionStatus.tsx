
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCcw } from 'lucide-react';
import { offlineService } from '@/core/api/offlineService';

export const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      offlineService.sync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkPending = async () => {
      const ops = await offlineService.getPendingOperations();
      setPendingCount(ops.length);
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-[9999] flex items-center gap-3 px-4 py-2 rounded-2xl shadow-2xl border animate-bounce-subtle ${isOnline ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
      {isOnline ? (
        <>
          <RefreshCcw size={18} className="animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest">Sincronizando {pendingCount} pendentes...</span>
        </>
      ) : (
        <>
          <WifiOff size={18} />
          <span className="text-xs font-black uppercase tracking-widest">Modo Offline {pendingCount > 0 && `(${pendingCount} pendentes)`}</span>
        </>
      )}
    </div>
  );
};

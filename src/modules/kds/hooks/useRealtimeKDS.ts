import { useEffect } from 'react';
import { supabase } from '@/core/api/supabaseClient';

export const useRealtimeKDS = (tenantId: string | null, onUpdate: () => void) => {
  useEffect(() => {
    if (!tenantId) return;

    // Targeted subscription for KDS
    // Only listen to order_items that are relevant for the kitchen
    // and orders to know when an order is created or updated
    const channel = supabase.channel(`kds_realtime:${tenantId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'order_items', 
          filter: `tenant_id=eq.${tenantId}` 
        },
        () => {
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'order_items', 
          filter: `tenant_id=eq.${tenantId}` 
        },
        (payload: any) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          // Only trigger update if status changed
          if (newRecord.status !== oldRecord.status) {
            onUpdate();
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders', 
          filter: `tenant_id=eq.${tenantId}` 
        },
        (payload: any) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          // Trigger if order status changed (e.g. cancelled)
          if (newRecord.status !== oldRecord.status) {
            onUpdate();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, onUpdate]);
};

import { useState, useEffect, useCallback } from 'react';
import { TableService } from '@/modules/tables/services/tableService';
import { Table, CreateTableDTO, UpdateTableDTO } from '@/types';
import { supabase } from '@/core/api/supabaseClient';

export const useTables = (tenantId: string | null) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const data = await TableService.getTables(tenantId);
      setTables(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTables();

    if (tenantId) {
      const channel = supabase.channel(`tables:${tenantId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tables', filter: `tenant_id=eq.${tenantId}` }, fetchTables)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tables', filter: `tenant_id=eq.${tenantId}` }, fetchTables)
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tables', filter: `tenant_id=eq.${tenantId}` }, fetchTables)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [tenantId, fetchTables]);

  const addTable = async (payload: Omit<CreateTableDTO, 'tenant_id'>) => {
    if (!tenantId) return;
    await TableService.createTable({ ...payload, tenant_id: tenantId });
    await fetchTables();
  };

  const updateTable = async (id: string, payload: UpdateTableDTO) => {
    await TableService.updateTable(id, payload);
    await fetchTables();
  };

  const removeTable = async (id: string) => {
    await TableService.deleteTable(id);
    await fetchTables();
  };

  return {
    tables,
    isLoading,
    error,
    addTable,
    updateTable,
    removeTable,
    refreshTables: fetchTables
  };
};

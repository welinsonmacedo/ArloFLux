import { supabase } from '@/core/api/supabaseClient';
import { Table, CreateTableDTO, UpdateTableDTO } from '@/types';

export const TableService = {
  async getTables(tenantId: string): Promise<Table[]> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');
    
    if (error) throw new Error(error.message);
    return data as Table[];
  },

  async createTable(payload: CreateTableDTO): Promise<Table> {
    const { data, error } = await supabase
      .from('tables')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Table;
  },

  async updateTable(id: string, payload: UpdateTableDTO): Promise<Table> {
    const { data, error } = await supabase
      .from('tables')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Table;
  },

  async deleteTable(id: string): Promise<void> {
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};

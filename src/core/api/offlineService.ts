
import { supabase } from './supabaseClient';

export interface PendingOperation {
  id: string;
  type: 'PROCESS_POS_SALE' | 'PLACE_ORDER' | 'PROCESS_PAYMENT' | 'CANCEL_ORDER' | 'DISPATCH_ORDER' | 'RPC' | 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  action?: string;
  data: any;
  tenantId?: string;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'FluxEatOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_operations';

class OfflineService {
  private db: IDBDatabase | null = null;
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDB();
      window.addEventListener('online', () => this.sync());
    }
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve(this.db!);
        this.sync(); // Tenta sincronizar ao iniciar se estiver online
      };

      request.onerror = (event: any) => {
        console.error('Erro ao abrir IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return this.initDB();
  }

  async addPendingOperation(operationData: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const db = await this.getDB();
    const id = crypto.randomUUID();
    const operation: PendingOperation = {
      ...operationData,
      id,
      timestamp: Date.now(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(operation);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingOperations(): Promise<PendingOperation[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeOperation(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateOperation(operation: PendingOperation): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(operation);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async sync(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;

    try {
      const operations = await this.getPendingOperations();
      if (operations.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`Iniciando sincronização de ${operations.length} operações pendentes...`);

      // Ordena por timestamp para manter a ordem cronológica
      const sortedOps = operations.sort((a, b) => a.timestamp - b.timestamp);

      for (const op of sortedOps) {
        try {
          await this.processOperation(op);
          await this.removeOperation(op.id);
          console.log(`Operação ${op.type} (${op.id}) sincronizada com sucesso.`);
        } catch (error) {
          console.error(`Erro ao sincronizar operação ${op.id}:`, error);
          op.retryCount++;
          if (op.retryCount > 10) {
             // Se falhar muitas vezes, talvez os dados estejam corrompidos ou a regra de negócio mudou
             // Por enquanto mantemos, mas poderíamos mover para um log de erros
             console.error(`Operação ${op.id} atingiu o limite de tentativas.`);
          } else {
            await this.updateOperation(op);
          }
          // Se falhou por erro de rede, para a sincronização e tenta depois
          if (!navigator.onLine) break;
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async processOperation(op: PendingOperation): Promise<void> {
    const { type, data } = op;

    switch (type) {
      case 'PROCESS_POS_SALE':
        const { error: posError } = await supabase.rpc('process_pos_sale', {
          p_tenant_id: data.tenantId,
          p_customer_name: data.customerName,
          p_method: data.method,
          p_items: data.items,
          p_cashier_name: data.cashierName
        });
        if (posError) throw posError;
        break;

      case 'PLACE_ORDER':
        const { error: orderError } = await supabase.rpc('place_order', {
          p_tenant_id: data.tenantId,
          p_table_id: data.tableId,
          p_order_type: data.orderType,
          p_delivery_info: data.deliveryInfo,
          p_items: data.items
        });
        if (orderError) throw orderError;
        break;

      case 'PROCESS_PAYMENT':
        const { error: paymentError } = await supabase.rpc('process_payment', {
          p_tenant_id: data.tenantId,
          p_table_id: data.tableId,
          p_amount: data.amount,
          p_method: data.method,
          p_cashier_name: data.cashierName,
          p_order_id: data.orderId,
          p_specific_order_ids: data.specificOrderIds,
          p_courier_info: data.courierInfo
        });
        if (paymentError) throw paymentError;
        break;

      case 'CANCEL_ORDER':
        const { error: cancelError } = await supabase.from('orders').update({ deleted_at: new Date().toISOString() }).eq('id', data.orderId);
        if (cancelError) throw cancelError;
        break;

      case 'DISPATCH_ORDER':
        const { error: dispatchError } = await supabase.rpc('dispatch_order', {
          p_tenant_id: data.tenantId,
          p_order_id: data.orderId,
          p_courier_info: data.courierInfo
        });
        if (dispatchError) throw dispatchError;
        break;

      case 'RPC':
        if (!op.action) throw new Error("Ação RPC não definida");
        const { error: rpcError } = await supabase.rpc(op.action, data);
        if (rpcError) throw rpcError;
        break;

      case 'INSERT':
        if (!op.table) throw new Error("Tabela não definida para INSERT");
        const { error: insertError } = await supabase.from(op.table).insert(data);
        if (insertError) throw insertError;
        break;

      case 'UPDATE':
        if (!op.table) throw new Error("Tabela não definida para UPDATE");
        const { id: updateId, ...updateData } = data;
        const { error: updateError } = await supabase.from(op.table).update(updateData).eq('id', updateId);
        if (updateError) throw updateError;
        break;

      case 'DELETE':
        if (!op.table) throw new Error("Tabela não definida para DELETE");
        const { error: deleteError } = await supabase.from(op.table).delete().eq('id', data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }
}

export const offlineService = new OfflineService();

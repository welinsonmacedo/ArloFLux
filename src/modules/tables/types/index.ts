export interface Table {
  id: string;
  tenant_id: string;
  name: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  capacity: number;
  created_at: string;
}

export interface CreateTableDTO {
  tenant_id: string;
  name: string;
  status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  capacity?: number;
}

export interface UpdateTableDTO {
  name?: string;
  status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  capacity?: number;
}

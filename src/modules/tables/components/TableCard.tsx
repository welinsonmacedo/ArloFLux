import React from 'react';
import { Table } from '@/types';

interface TableCardProps {
  table: Table;
  onClick?: (table: Table) => void;
}

export const TableCard: React.FC<TableCardProps> = ({ table, onClick }) => {
  const statusColors: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800',
    OCCUPIED: 'bg-red-100 text-red-800',
    WAITING_PAYMENT: 'bg-yellow-100 text-yellow-800',
    CLOSED: 'bg-gray-100 text-gray-800'
  };

  return (
    <div 
      className="p-4 border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick && onClick(table)}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Mesa {table.number}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[table.status] || 'bg-gray-100 text-gray-800'}`}>
          {table.status}
        </span>
      </div>
      {table.customerName && (
        <p className="text-sm text-gray-600">Cliente: {table.customerName}</p>
      )}
    </div>
  );
};

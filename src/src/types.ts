export interface Client {
  id: number;
  name: string;
  cuit?: string;
  address?: string;
  phone?: string;
  contact_person?: string;
  location_lat?: number;
  location_lng?: number;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'technician';
  created_at: string;
}

export interface Task {
  id: number;
  client_id: number;
  client_name?: string;
  ticket_number: string;
  description: string;
  status: 'Pendiente' | 'En Proceso' | 'Finalizado';
  priority: 'Baja' | 'Media' | 'Alta';
  type: 'Espontáneo' | 'Programado' | 'Presupuestado';
  technician_name?: string;
  budget_id?: number;
  budget_number?: string;
  created_at: string;
  finished_at?: string;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  created_at: string;
}

export interface BudgetItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Budget {
  id: number;
  client_id: number;
  client_name?: string;
  task_id?: number;
  budget_number: string;
  date: string;
  validity_days: number;
  subtotal: number;
  total: number;
  signature_data?: string;
  photo_url?: string;
  technician_name?: string;
  created_at: string;
  items?: BudgetItem[];
}

export interface AgendaEvent {
  id: number;
  client_id: number;
  client_name?: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  type: 'Visita' | 'Mantenimiento';
}

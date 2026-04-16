export interface Stat {
  label: string;
  value: string;
  change: string;
  icon: any;
  trend: 'up' | 'down' | 'neutral';
}

export interface Activity {
  user: string;
  action: string;
  target: string;
  time: string;
  img?: string;
  online?: boolean;
  isBot?: boolean;
}

export interface Lead {
  id: string;
  name: string;
  desc: string;
  value: string;
  time: string;
  stage: 'prospect' | 'meeting' | 'proposal' | 'closing';
  event?: { time: string; label: string };
  status?: string;
  verified?: boolean;
}

export interface Project {
  id: string;
  title: string;
  status: string;
  progress: number;
  team: string[];
  deadline: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  type: 'Plano' | 'Único';
  value?: string; // For one-time projects
  script?: string;
  isEditing?: boolean;
  rawMaterialLink?: string;
  referenceLink?: string;
  insertsLink?: string;
  responsible?: string;
  description?: string;
  caption?: string;
  completedAt?: string; // ISO string
  editedVideoLink?: string;
}

export interface ClientMetricRecord {
  id: string;
  clientId: string;
  date: string; // ISO string (e.g., start of the week)
  periodType: 'weekly' | 'monthly';
  metrics: {
    conversionRate: number;
    viewRate: number;
    conversationsStarted: number;
    cpv: number;
    cpm: number;
  };
  optimizationsDone: string;
  optimizationsDoing: string;
  optimizationsToNext: string;
  campaigns: {
    name: string;
    spend: number;
    leads: number;
    cpa: number;
    roas: number;
  }[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  assignedTo?: string;
  createdAt: string;
}

export type UserRole = 'CEO' | 'RH' | 'Colaborador' | 'Vendedor';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface SystemUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
}

export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  product: string;
  value: number;
  discount: boolean;
  discountValue?: number;
  sellerId: string;
  sellerName: string;
  date: string; // ISO string
}

export interface Seller {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface Goal {
  id: string;
  month: string; // "YYYY-MM"
  targetValue: number; // New sales target
  renewalTarget: number; // Renewal target
}

export interface Note {
  id: string;
  userId: string;
  content: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  industry: string;
  status: 'Ativo' | 'Onboarding' | 'Pausado';
  revenue: string; // This will be the monthly investment
  location: string;
  contact: string;
  since: string;
  createdAt: string; // ISO string for tracking new clients
  logo: string;
  website?: string;
  driveFolderId?: string;
  contractLink?: string;
  managerId?: string;
  strategyLink?: string;
  healthStatus?: 'green' | 'yellow' | 'red';
  lastRenewalMonth?: string; // "YYYY-MM"
  confidentialData?: {
    emails?: string;
    passwords?: string;
    other?: string;
  };
  planDetails?: {
    included: string;
    totalEdits: number;
    totalCaptures: number;
    workScope: string;
  };
}

export interface ManagerTask {
  id: string;
  clientId: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  daysOfWeek?: number[]; // 0-6 for weekly
  interval?: number; // for custom (every X days)
  lastCompleted?: string; // ISO date
  nextOccurrence: string; // ISO date
  completed: boolean;
}

export interface StrategyItem {
  id: string;
  title: string;
  client: string;
  status: string;
  priority: 'Crítica' | 'Alta' | 'Média' | 'Baixa';
  progress: number;
  tags: string[];
}

export interface OKR {
  id: string;
  title: string;
  progress: number;
  target: string;
  category: string;
}

export interface Step {
  action: string;
  due: string;
  priority: 'Urgente' | 'Alta' | 'Média' | 'Baixa';
}

export interface Capture {
  id: string;
  title: string;
  location: string;
  lat?: number;
  lng?: number;
  clientContact: string;
  date: string; // Display date (e.g. "04 Nov")
  time: string; // Display time (e.g. "09:00")
  startDateTime: string; // ISO string for calendar sync
  endDateTime: string; // ISO string for calendar sync
  status: 'Ativo Agora' | 'Confirmado' | 'Pendente';
  type: string;
  img?: string;
  driveFolderId?: string;
  script?: string;
}

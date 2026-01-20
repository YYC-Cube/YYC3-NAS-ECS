export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  lastUpdated: string;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  responses: SupportResponse[];
}

export interface SupportResponse {
  id: string;
  ticketId: string;
  message: string;
  createdBy: string;
  createdAt: string;
  isInternal: boolean;
}

export interface ContactInfo {
  email: string;
  phone: string;
  website: string;
  address: string;
  workingHours: string;
}

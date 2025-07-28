export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  canAssignTasks: boolean;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo: string;
  assignedBy: string;
  createdAt: Date;
  dueDate: Date;
  completedAt?: Date;
  reminderSet?: Date;
  tags?: string[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  avatar?: string;
  tasksCount: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  };
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'reminder' | 'deadline_approaching';
  title: string;
  message: string;
  userId: string;
  taskId?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
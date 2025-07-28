import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Task, User, Client, Notification } from '../types';

interface AppContextType {
  tasks: Task[];
  users: User[];
  clients: Client[];
  notifications: Notification[];
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Design Landing Page',
      description: 'Create wireframes and mockups for the new landing page',
      priority: 'high',
      status: 'in-progress',
      assignedTo: '2',
      assignedBy: '1',
      createdAt: new Date('2024-01-15'),
      dueDate: new Date('2024-01-25'),
      tags: ['design', 'frontend'],
    },
    {
      id: '2',
      title: 'Database Migration',
      description: 'Migrate user data to new database schema',
      priority: 'urgent',
      status: 'pending',
      assignedTo: '3',
      assignedBy: '1',
      createdAt: new Date('2024-01-14'),
      dueDate: new Date('2024-01-20'),
      tags: ['backend', 'database'],
    },
    {
      id: '3',
      title: 'User Testing',
      description: 'Conduct user testing sessions for the new features',
      priority: 'medium',
      status: 'completed',
      assignedTo: '4',
      assignedBy: '1',
      createdAt: new Date('2024-01-10'),
      dueDate: new Date('2024-01-18'),
      completedAt: new Date('2024-01-17'),
      tags: ['testing', 'ux'],
    },
  ]);

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@company.com',
      role: 'admin',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
      canAssignTasks: true,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date(),
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      role: 'user',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
      canAssignTasks: false,
      isActive: true,
      createdAt: new Date('2024-01-02'),
      lastLogin: new Date('2024-01-15'),
    },
    {
      id: '3',
      name: 'Michael Chen',
      email: 'michael@company.com',
      role: 'user',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
      canAssignTasks: true,
      isActive: true,
      createdAt: new Date('2024-01-03'),
      lastLogin: new Date('2024-01-14'),
    },
    {
      id: '4',
      name: 'Emma Wilson',
      email: 'emma@company.com',
      role: 'user',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      canAssignTasks: false,
      isActive: true,
      createdAt: new Date('2024-01-04'),
      lastLogin: new Date('2024-01-13'),
    },
  ]);

  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      name: 'TechCorp Solutions',
      email: 'contact@techcorp.com',
      company: 'TechCorp Inc.',
      avatar: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
      tasksCount: { total: 15, completed: 8, pending: 4, inProgress: 3 },
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Digital Innovations',
      email: 'hello@digitalinnovations.com',
      company: 'Digital Innovations Ltd.',
      avatar: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400',
      tasksCount: { total: 12, completed: 7, pending: 3, inProgress: 2 },
      createdAt: new Date('2024-01-05'),
    },
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: 'You have been assigned a new task: Design Landing Page',
      userId: '2',
      taskId: '1',
      isRead: false,
      createdAt: new Date('2024-01-15T10:30:00'),
    },
    {
      id: '2',
      type: 'deadline_approaching',
      title: 'Deadline Approaching',
      message: 'Database Migration task is due in 2 days',
      userId: '3',
      taskId: '2',
      isRead: false,
      createdAt: new Date('2024-01-18T09:00:00'),
    },
  ]);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...updates } : user
    ));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, isRead: true } : notif
    ));
  };

  return (
    <AppContext.Provider value={{
      tasks,
      users,
      clients,
      notifications,
      selectedClient,
      setSelectedClient,
      addTask,
      updateTask,
      deleteTask,
      addUser,
      updateUser,
      deleteUser,
      addNotification,
      markNotificationAsRead,
    }}>
      {children}
    </AppContext.Provider>
  );
};
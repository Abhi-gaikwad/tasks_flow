// src/contexts/AppContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Task, User, Client, Notification } from '../types';
import { createUser as apiCreateUser, fetchUsers as apiFetchUsers } from '../services/api'; // Import your API functions
import { useAuth } from './AuthContext'; // To get the current user for admin checks

interface AppContextType {
  tasks: Task[];
  users: User[]; // Now fetched from backend
  clients: Client[];
  notifications: Notification[];
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'owner_id'>) => Promise<void>; // Added owner_id to Omit
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'avatar' | 'canAssignTasks' | 'lastLogin'> & { password?: string }) => Promise<void>; // Updated Omit
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (id: string) => void;
  loadUsers: () => Promise<void>; // Function to explicitly load users
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Initialize with empty array
  const [clients, setClients] = useState<Client[]>([]); // Assuming clients are static for now or fetched elsewhere
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { token, isAuthenticated, isLoading, user: authUser } = useAuth(); // Get auth status and user from AuthContext

  // Load users from backend
  const loadUsers = async () => {
    if (!isAuthenticated || !authUser?.role || authUser.role !== 'admin') {
      // Only admins can load all users from the backend
      setUsers([]); // Clear users if not admin
      return;
    }
    try {
      const fetchedUsers = await apiFetchUsers();
      // Map backend UserInDB schema to frontend User schema
      const mappedUsers: User[] = fetchedUsers.map((u: any) => ({
        id: String(u.id), // Convert int to string
        email: u.email,
        name: u.email.split('@')[0], // Derive name from email for frontend display
        role: u.is_admin ? 'admin' : 'user',
        canAssignTasks: u.is_admin, // Admins can assign tasks
        isActive: true, // Assuming all fetched users are active by default or add a field in backend
        createdAt: new Date(), // Placeholder, backend doesn't return this in UserInDB
        avatar: `https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400`, // Default avatar
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Handle error, e.g., show a notification
    }
  };

  useEffect(() => {
    if (isAuthenticated && authUser?.role === 'admin') {
      loadUsers(); // Load users when authenticated as admin
    } else {
      setUsers([]); // Clear users if not authenticated or not admin
    }
  }, [isAuthenticated, authUser?.role]); // Re-run when auth state or user role changes

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'owner_id'>) => {
    // This needs to be implemented with backend API calls for tasks
    // For now, it will just add to frontend state
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date(),
      owner_id: authUser?.id || 'unknown', // Assign current user as owner
      // Ensure assignedBy is also included if needed for frontend Task type
      assignedBy: authUser?.name || authUser?.email || 'unknown',
    };
    setTasks(prev => [...prev, newTask]);
    addNotification({
      type: 'task_assigned',
      title: 'New Task Created!',
      message: `Task "${task.title}" has been created.`,
      userId: authUser?.id || 'admin',
      taskId: newTask.id,
      isRead: false,
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const addUser = async (user: Omit<User, 'id' | 'createdAt' | 'avatar' | 'canAssignTasks' | 'lastLogin'> & { password?: string }) => {
    if (!user.password) {
      throw new Error("Password is required to create a new user.");
    }
    try {
      // Prepare data for backend
      const userDataForBackend = {
        email: user.email,
        password: user.password,
        is_admin: user.role === 'admin', // Map frontend role to backend is_admin
      };
      const newUserBackend = await apiCreateUser(userDataForBackend); // Call backend API

      // Map backend response to frontend User type and update state
      const newUserFrontend: User = {
        id: String(newUserBackend.id), // Convert int to string
        name: newUserBackend.email.split('@')[0], // Derive name from email
        email: newUserBackend.email,
        role: newUserBackend.is_admin ? 'admin' : 'user',
        avatar: `https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400`,
        canAssignTasks: newUserBackend.is_admin,
        isActive: true, // Assuming active on creation
        createdAt: new Date(), // Placeholder as backend doesn't return this
        lastLogin: undefined,
      };
      setUsers(prev => [...prev, newUserFrontend]);
      console.log("User created successfully:", newUserBackend);
      loadUsers(); // Reload users to ensure the list is up-to-date
    } catch (error) {
      console.error('Failed to add user:', error);
      throw error; // Re-throw to be caught by UserForm for error display
    }
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
      loadUsers,
    }}>
      {children}
    </AppContext.Provider>
  );
};
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { LoginForm } from './components/auth/LoginForm';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { TaskList } from './components/tasks/TaskList';
import { UserList } from './components/users/UserList';
import { Reports } from './components/reports/Reports';
import { Notifications } from './components/notifications/Notifications';
import { Settings } from './components/settings/Settings';
import { Modal } from './components/common/Modal';
import { TaskForm } from './components/tasks/TaskForm';
import { useApp } from './contexts/AppContext';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { addTask, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return; // Wait until authentication check is complete

    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        setActiveTab('dashboard'); // Admins always start on dashboard
      } else {
        setActiveTab('tasks'); // Non-admin users start on tasks
      }
    } else if (!isAuthenticated && !isLoading) {
      setActiveTab(''); // Clear active tab if not authenticated
    }
  }, [isAuthenticated, user, isLoading]);

  const handleNewTask = () => {
    setIsCreateTaskModalOpen(true);
  };

  const handleCreateTask = (taskData: Parameters<typeof addTask>[0]) => {
    addTask(taskData);
    addNotification({
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${taskData.title}`,
      userId: taskData.assignedTo,
      taskId: '',
      isRead: false,
    });
    setIsCreateTaskModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <TaskList />;
      case 'users':
        if (user?.role === 'admin') {
          return <UserList />;
        }
        return <Dashboard />; // Redirect non-admins to dashboard if they try to access 'users'
      case 'reports':
        if (user?.role === 'admin') {
          return <Reports />;
        }
        return <Dashboard />; // Redirect non-admins to dashboard if they try to access 'reports'
      case 'notifications':
        return <Notifications />;
      case 'settings':
        return <Settings />;
      default:
        return user?.role === 'admin' ? <Dashboard /> : <TaskList />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onNewTask={handleNewTask} />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>

      <Modal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        title="Create New Task"
        maxWidth="lg"
      >
        <TaskForm
          onSubmit={handleCreateTask}
          onClose={() => setIsCreateTaskModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
// src/components/users/UserForm.tsx
import React, { useState } from 'react';
import { Mail, User, Shield, CheckSquare, Lock } from 'lucide-react';
import { Button } from '../common/Button';
import { User as UserType } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface UserFormProps {
  onClose: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ onClose }) => {
  const { addUser } = useApp();
  const [formData, setFormData] = useState({
    name: '', // Keeping name for frontend consistency, though backend UserCreate doesn't have it
    email: '',
    password: '',
    role: 'user' as UserType['role'], // Default to 'user'
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all required fields (Name, Email, Password).");
      return;
    }

    try {
      await addUser({
        email: formData.email,
        password: formData.password,
        is_admin: formData.role === 'admin', // Map frontend role to backend is_admin
        // For frontend UserType, we need to provide other fields, but they will be ignored by backend createUser
        name: formData.name, // Will be ignored by backend createUser
        role: formData.role, // Will be ignored by backend createUser, set by backend based on is_admin
        canAssignTasks: formData.role === 'admin', // Derived from role
        isActive: formData.isActive,
      });
      onClose(); // Close modal on success
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to create user. Please try again.";
      setError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1 text-gray-500" />
            Name
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1 text-gray-500" />
            Email
          </label>
          <input
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="john.doe@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Lock className="w-4 h-4 inline mr-1 text-gray-500" />
          Password
        </label>
        <input
          type="password"
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Shield className="w-4 h-4 inline mr-1 text-gray-500" />
          Role
        </label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserType['role'] })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="canAssignTasks"
            checked={formData.role === 'admin'} // Tied to role selection
            readOnly // Make it read-only as it's derived from role
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="canAssignTasks" className="text-sm text-gray-700">
            <CheckSquare className="w-4 h-4 inline mr-1" />
            Can assign tasks to other users (Admin role grants this)
          </label>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">
            User is active
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button type="submit">Create User</Button>
      </div>
    </form>
  );
};
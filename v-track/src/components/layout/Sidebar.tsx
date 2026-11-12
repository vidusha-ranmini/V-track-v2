"use client";

import { logout } from '@/lib/auth';
import {
  Home, 
  UserPlus, 
  Users, 
  Building, 
  Lightbulb, 
  MapPin,
  Construction,
  LogOut 
} from 'lucide-react';
import type { AuthUser } from '@/lib/auth';

interface SidebarProps {
  user: AuthUser;
  activePage: string;
  onPageChange: (page: string) => void;
}

export default function Sidebar({ user, activePage, onPageChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'add-details', label: 'Add Details', icon: UserPlus },
    { id: 'view-details', label: 'View Details', icon: Users },
    { id: 'add-business', label: 'Add Business', icon: Building },
    { id: 'road-lamps', label: 'Road Lamps', icon: Lightbulb },
    { id: 'road-details', label: 'Road Details', icon: MapPin },
    { id: 'road-development', label: 'Road Development', icon: Construction },
    // { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
  ];
  const visibleMenuItems = user.role === 'road-manager'
    ? menuItems.filter((item) => item.id === 'road-details' || item.id === 'road-lamps')
    : menuItems;

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800">
          Village Management
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {user.role === 'admin' ? 'Administrator Panel' : 'Roads & Lamps Access'}
        </p>
      </div>
      
      <nav className="mt-6">
        {visibleMenuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                activePage === item.id
                  ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600'
                  : 'text-gray-700'
              }`}
            >
              <IconComponent className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
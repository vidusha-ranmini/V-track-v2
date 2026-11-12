"use client";

import { useEffect, useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import Dashboard from '@/components/Dashboard';
import { checkAuth, type AuthUser } from '@/lib/auth';

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setUser(await checkAuth());
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <Dashboard user={user} />
      ) : (
        <LoginForm onLoginSuccess={setUser} />
      )}
    </div>
  );
}

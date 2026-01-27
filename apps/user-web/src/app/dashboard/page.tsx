'use client';

import { Suspense } from 'react';
import { AuthProviderWrapper } from '../../components/providers/AuthProviderWrapper';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'next/navigation';

function DashboardContentInner() {
  const { user, logout } = useAuth();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('welcome') === 'true';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">ImagePivot</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
              <button
                onClick={logout}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {isNewUser && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-800">
                Welcome! Your account has been created successfully.
              </div>
            </div>
          )}
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">Email: {user?.email}</p>
                <p className="text-gray-600">Name: {user?.name || 'Not set'}</p>
                <p className="text-gray-600">
                  Email Verified: {user?.emailVerified ? 'Yes' : 'No'}
                </p>
                <p className="text-gray-600">Provider: {user?.provider}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardContent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContentInner />
    </Suspense>
  );
}

export default function DashboardPage() {
  return (
    <AuthProviderWrapper>
      <ProtectedRoute>
        <DashboardContent />
      </ProtectedRoute>
    </AuthProviderWrapper>
  );
}


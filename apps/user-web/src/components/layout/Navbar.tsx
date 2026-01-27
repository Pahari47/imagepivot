'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export function Navbar({ onLoginClick, onSignupClick }: NavbarProps) {
  const { user } = useAuth();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold">
              <span className="text-gray-900">/IMAGE</span>
              <span className="text-gray-900 font-bold">PIVOT</span>
            </Link>
          </div>
          <div className="flex items-center space-x-8">
            <Link
              href="#about"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              About
            </Link>
            <Link
              href="#features"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              Feature
            </Link>
            <Link
              href="#pricing"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              Pricing
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 text-sm font-medium"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <button
                  key="sign-in"
                  onClick={onLoginClick}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign in
                </button>
                <button
                  key="sign-up"
                  onClick={onSignupClick}
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 text-sm font-medium"
                >
                  Create free account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}


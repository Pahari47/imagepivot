'use client';

import { useState } from 'react';
import { AuthProviderWrapper } from '../components/providers/AuthProviderWrapper';
import { Navbar } from '../components/layout/Navbar';
import { LoginModal } from '../features/auth/LoginModal';
import { SignupModal } from '../features/auth/SignupModal';
import { HeroSection } from '../features/landing/HeroSection';

export default function HomePage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  return (
    <AuthProviderWrapper>
      <div className="min-h-screen bg-white">
        <Navbar
          onLoginClick={() => setIsLoginOpen(true)}
          onSignupClick={() => setIsSignupOpen(true)}
        />
        <HeroSection
          onGetStarted={() => setIsSignupOpen(true)}
          onStartTrial={() => setIsSignupOpen(true)}
        />
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onSwitchToSignup={() => setIsSignupOpen(true)}
        />
        <SignupModal
          isOpen={isSignupOpen}
          onClose={() => setIsSignupOpen(false)}
          onSwitchToLogin={() => setIsLoginOpen(true)}
        />
      </div>
    </AuthProviderWrapper>
  );
}

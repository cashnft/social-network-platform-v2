import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="max-w-lg w-full mx-4">
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-full shadow-lg">
              <MessageCircle size={48} className="text-blue-500" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-white tracking-tight">
            Welcome to Chirper
          </h1>
          
          <p className="text-xl text-white/90">
            Join the conversation and connect with people around the world
          </p>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-white text-blue-600 rounded-xl text-lg font-semibold shadow-lg hover:bg-opacity-90 transition-all transform hover:scale-105"
          >
            Get Started
          </button>

          <p className="text-sm text-white/75">
            Already have an account? {' '}
            <button 
              onClick={() => navigate('/login')}
              className="text-white hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
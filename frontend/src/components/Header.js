import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Bell, User, LogOut } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

function Header() {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-blue-500">Chirper</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="p-2 text-gray-600 hover:text-blue-500 rounded-full hover:bg-blue-50"
            >
              <Home className="w-6 h-6" />
            </Link>
            <Link 
              to="/notifications" 
              className="p-2 text-gray-600 hover:text-blue-500 rounded-full hover:bg-blue-50"
            >
              <Bell className="w-6 h-6" />
            </Link>
            <Link 
              to={`/profile/${user.username}`} 
              className="p-2 text-gray-600 hover:text-blue-500 rounded-full hover:bg-blue-50"
            >
              <User className="w-6 h-6" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-500 rounded-full hover:bg-red-50"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
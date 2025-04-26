// src/components/Layout/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold hover:text-gray-300">
          CRISIS MAPPER
        </Link>
        <ul className="flex space-x-4 items-center">
          <li>
            <Link to="/map" className="hover:text-gray-300">Crisis Map</Link>
          </li>
          <li>
            <Link to="/crises" className="hover:text-gray-300">All Crises</Link> {/* <--- ADD THIS LINK */}
          </li>
          <li>
            <Link to="/about" className="hover:text-gray-300">About</Link>
          </li>
          {user ? (
            <>
              <li>
                <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-gray-300">Profile</Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                >
                  Logout ({user.name})
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="hover:text-gray-300">Login</Link>
              </li>
              <li>
                <Link to="/register" className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-sm">
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
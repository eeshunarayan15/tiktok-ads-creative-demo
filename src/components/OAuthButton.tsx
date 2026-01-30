import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const OAuthButton: React.FC = () => {
  const { login, isAuthenticated } = useAuth();

  return (
      <button
          onClick={login}
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
      >
        {isAuthenticated ? 'Reconnect TikTok' : 'Connect TikTok Ads Account'}
      </button>
  );
};
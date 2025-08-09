// Authentication Page Component - Login/Register Switcher
import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

type AuthMode = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <>
      {mode === 'login' ? (
        <Login onSwitchToRegister={() => setMode('register')} />
      ) : (
        <Register onSwitchToLogin={() => setMode('login')} />
      )}
    </>
  );
};

export default AuthPage;

import React from 'react';
import { LoginForm } from '@/components/LoginForm';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary to-background p-4 overflow-hidden">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-pulse rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="h-8 w-8 bg-white rounded-full"></div>
          </div>
          <h1 className="text-3xl font-bold">Pulse CRM Control</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;


import React from 'react';
import { LoginForm } from '@/components/LoginForm';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary to-background p-4 overflow-hidden">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          
          <div className="h-32 w-32 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
          <img src='https://www.pawartechnologyservices.com/images/log.png' alt='Logo' />
          </div>
          <h1 className="text-3xl font-bold">PTS CRM</h1>
          <p className="text-muted-foreground mt-2">Creating a better version for you</p>
        </div>
        
        <div className='mt-[-100px]'>
        <LoginForm />

        </div>
      </div>
    </div>
  );
};

export default Login;

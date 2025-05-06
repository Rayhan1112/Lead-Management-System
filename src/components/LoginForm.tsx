
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'agent'>('admin');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    login(email, password, role);
    toast.success(`Logged in as ${role}`);
  };

  return (
    <div className="w-full max-w-md">
      <Tabs defaultValue="admin" className="w-full" onValueChange={(value) => setRole(value as 'admin' | 'agent')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="agent">Agent</TabsTrigger>
        </TabsList>
        
        <TabsContent value="admin">
          <form onSubmit={handleSubmit} className="neuro p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-center text-pulse">Admin Login</h2>
              <p className="text-sm text-muted-foreground text-center">
                Access your admin dashboard
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="admin-email" className="text-sm font-medium">Email</label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@pulsecrm.com"
                  className="neuro-inset focus:shadow-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="admin-password" className="text-sm font-medium">Password</label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  className="neuro-inset focus:shadow-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full neuro hover:shadow-none transition-all duration-300">
              Login as Admin
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="agent">
          <form onSubmit={handleSubmit} className="neuro p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-center text-pulse">Agent Login</h2>
              <p className="text-sm text-muted-foreground text-center">
                Access your agent dashboard
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="agent-email" className="text-sm font-medium">Email</label>
                <Input
                  id="agent-email"
                  type="email"
                  placeholder="agent@pulsecrm.com"
                  className="neuro-inset focus:shadow-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="agent-password" className="text-sm font-medium">Password</label>
                <Input
                  id="agent-password"
                  type="password"
                  placeholder="••••••••"
                  className="neuro-inset focus:shadow-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full neuro hover:shadow-none transition-all duration-300">
              Login as Agent
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoginForm;

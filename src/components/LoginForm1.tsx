import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { database } from '../firebase';
import { ref, get } from 'firebase/database';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'agent'>('admin');
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      const userCredential = await login(email, password, role);
      const user = userCredential.user; // Get the authenticated user

      // Store the user ID in adminKey regardless of role
      localStorage.setItem('adminKey', user.uid);
      localStorage.setItem('role', role);

      if (role === 'agent') {
        // Search for agent in all admin accounts
        const adminsRef = ref(database, 'users');
        const snapshot = await get(adminsRef);
        
        if (snapshot.exists()) {
          let agentFound = false;
          
          snapshot.forEach((adminSnapshot) => {
            const adminId = adminSnapshot.key;
            const agentsRef = ref(database, `users/${adminId}/agents`);
            
            get(agentsRef).then((agentsSnapshot) => {
              if (agentsSnapshot.exists()) {
                agentsSnapshot.forEach((agentSnapshot) => {
                  const agentData = agentSnapshot.val();
                  if (agentData.email === email) {
                    agentFound = true;
                    // Store both admin and agent keys for agent users
                    localStorage.setItem('adminKey', adminId!);
                    localStorage.setItem('agentKey', agentSnapshot.key!);
                    localStorage.setItem('role', role);
                    
                    console.log('Agent verification successful!');
                    console.log('Admin ID:', adminId);
                    console.log('Agent ID:', agentSnapshot.key);
                    
                    toast.success(`Welcome back, ${agentData.name || 'Agent'}`);
                    navigate('/dashboard'); // Redirect to dashboard
                  }
                });
              }
            });
          });

          if (!agentFound) {
            throw new Error('No matching agent found in any admin account');
          }
        } else {
          throw new Error('No admin accounts found in database');
        }
      } else {
        // Admin login - already stored adminKey above
        toast.success('Admin login successful');
        navigate('/dashboard'); // Redirect to dashboard
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please check your credentials.');
      // Clear storage on failed login
      localStorage.removeItem('adminKey');
      localStorage.removeItem('agentKey');
      localStorage.removeItem('role');
    } finally {
      setIsLoading(false);
    }
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
            {/* Admin form content remains the same */}
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
                  required
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
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full neuro hover:shadow-none transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login as Admin'}
            </Button>
            
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-pulse hover:underline">
                Sign up
              </Link>
            </p>
          </form>
          </form>
        </TabsContent>
        
        <TabsContent value="agent">
          <form onSubmit={handleSubmit} className="neuro p-6 space-y-6">
            {/* Agent form content remains the same */}
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
                  required
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
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full neuro hover:shadow-none transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login as Agent'}
            </Button>
            
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-pulse hover:underline">
                Sign up
              </Link>
            </p>
          </form>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoginForm;
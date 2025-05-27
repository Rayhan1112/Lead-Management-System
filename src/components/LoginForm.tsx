import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { database } from '../firebase';
import { ref, get, update } from 'firebase/database';
import { signInWithEmailAndPassword, getAuth, onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Encryption key management
const getEncryptionKey = async (role: 'admin' | 'agent'): Promise<CryptoKey> => {
  const KEY_NAME = `pulse-crm-${role}-key`;
  
  try {
    const storedKey = localStorage.getItem(KEY_NAME);
    if (storedKey) {
      const keyData = JSON.parse(storedKey);
      return await crypto.subtle.importKey(
        'jwk',
        keyData,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );
    }
    
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const exportedKey = await crypto.subtle.exportKey('jwk', key);
    localStorage.setItem(KEY_NAME, JSON.stringify(exportedKey));
    
    return key;
  } catch (error) {
    console.error(`Error getting ${role} encryption key:`, error);
    throw error;
  }
};

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'agent'>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();

  // Custom toast function for centered messages
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    toast[type](message, {
      position: 'top-center',
      duration: 5000,
    });
  };

  // Check auth state on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = ref(database, 'users');
          const snapshot = await get(userRef);

          if (snapshot.exists()) {
            const users = snapshot.val();
            let userFound = false;
            let userRole = '';
            let adminId = '';
            let isActive = false;

            // Check if user is admin
            if (users[user.uid]) {
              userRole = 'admin';
              adminId = user.uid;
              isActive = users[user.uid].status === 'active';
              userFound = true;
            } 
            // If not admin, check if user is agent
            else {
              for (const [dbAdminId, adminData] of Object.entries(users)) {
                const admin = adminData as any;
                if (admin.agents && admin.agents[user.uid]) {
                  userRole = 'agent';
                  adminId = dbAdminId;
                  isActive = admin.agents[user.uid].status === 'active';
                  userFound = true;
                  break;
                }
              }
            }

            if (userFound) {
              if (!isActive) {
                await auth.signOut();
                localStorage.clear();
                // showToast('Your account is currently disabled. Please contact the super admin.');
                return;
              }

              // Initialize encryption keys for the role
              await getEncryptionKey(userRole as 'admin' | 'agent');
              
              // Store user identifiers
              localStorage.setItem('currentRole', userRole);
              localStorage.setItem('adminId', adminId);
              
              if (userRole === 'agent') {
                localStorage.setItem('agentId', user.uid);
              } else {
                localStorage.removeItem('agentId');
              }
              
              navigate('/dashboard');
            } else {
              await auth.signOut();
              localStorage.clear();
              showToast('User not found in database');
            }
          }
        } catch (error) {
          console.error('Auth state check error:', error);
          showToast('Authentication check failed');
        }
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Check user in Realtime Database
      const userRef = ref(database, 'users');
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        await auth.signOut();
        throw new Error('User not found in database');
      }

      const users = snapshot.val();
      let userData: any = null;
      let isAdmin = false;
      let isActive = false;

      // 3. Check if user is admin
      if (users[user.uid]) {
        userData = users[user.uid];
        isAdmin = true;
        isActive = userData.status === 'active';
      } 
      // 4. If not admin, check if agent
      else {
        for (const adminId in users) {
          if (users[adminId].agents && users[adminId].agents[user.uid]) {
            userData = users[adminId].agents[user.uid];
            userData.adminId = adminId; // Store admin reference
            isActive = userData.status === 'active';
            break;
          }
        }
      }

      // 5. Strict validation checks
      if (!userData) {
        await auth.signOut();
        throw new Error('User not found in database');
      }

      // Check active status first
      if (!isActive) {
        await auth.signOut();
        throw new Error('Your account is currently disabled. Please contact the super admin.');
      }

      const userRole = isAdmin ? 'admin' : 'agent';
      if (userRole !== role) {
        await auth.signOut();
        throw new Error(`Please login as ${userRole}`);
      }

      // 6. Only proceed if all checks passed
      await getEncryptionKey(userRole as 'admin' | 'agent');

      // Store user data
      localStorage.setItem('currentRole', userRole);
      localStorage.setItem('adminId', isAdmin ? user.uid : userData.adminId);
      localStorage.setItem('agentLimit', userData.agentLimit?.toString() || '0');
      localStorage.setItem('leadLimit', userData.leadLimit?.toString() || '0');

      if (userRole === 'agent') {
        localStorage.setItem('agentId', user.uid);
        showToast('Welcome back, Agent!', 'success');
        
        // Update last login
        const now = new Date().toLocaleString();
        await update(ref(database, `users/${userData.adminId}/agents/${user.uid}`), { 
          lastLogin: now 
        });
      } else {
        localStorage.removeItem('agentId');
        showToast('Welcome back, Admin!', 'success');
      }

      // 7. FINAL STEP - Only navigate if everything succeeded
      navigate('/dashboard');

    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-primary"
          >
            <Loader2 className="w-12 h-12" />
          </motion.div>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-medium"
          >
            Checking authentication...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center min-h-screen"
      >
        <div className="w-full max-w-md p-4">
          <Tabs defaultValue="admin" className="w-full" onValueChange={(value) => setRole(value as 'admin' | 'agent')}>
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin">Admin</TabsTrigger>
                <TabsTrigger value="agent">Agent</TabsTrigger>
              </TabsList>
            </motion.div>
            
            <TabsContent value="admin">
              <motion.form
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onSubmit={handleSubmit}
                className="neuro p-6 space-y-12"
              >
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
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging in...</span>
                    </div>
                  ) : (
                    'Login as Admin'
                  )}
                </Button>
                <div className="space-y-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-pulse hover:underline">
                      Sign up
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Forgot your password?{' '}
                    <Link to="/forgot-password" className="text-pulse hover:underline">
                      Reset it here
                    </Link>
                  </p>
                </div>
              </motion.form>
            </TabsContent>
            
            <TabsContent value="agent">
              <motion.form
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onSubmit={handleSubmit}
                className="neuro p-6 space-y-12"
              >
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
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging in...</span>
                    </div>
                  ) : (
                    'Login as Agent'
                  )}
                </Button>
                <div className="space-y-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-pulse hover:underline">
                      Sign up
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Forgot your password?{' '}
                    <Link to="/forgot-password" className="text-pulse hover:underline">
                      Reset it here
                    </Link>
                  </p>
                </div>
              </motion.form>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoginForm;
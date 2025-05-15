import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseUser, UserCredential } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';

type UserRole = 'admin' | 'agent' | null;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  parentAdminId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<UserCredential>;
  signup: (firstName: string, lastName: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAgent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const firebaseConfig = {
  apiKey: "AIzaSyA8_GQNQB1kw803JB_bvo240Oh-a6PZEsM",
  authDomain: "final-lms-d15f0.firebaseapp.com",
  databaseURL: "https://final-lms-d15f0-default-rtdb.firebaseio.com",
  projectId: "final-lms-d15f0",
  storageBucket: "final-lms-d15f0.firebasestorage.app",
  messagingSenderId: "700655769720",
  appId: "1:700655769720:web:569b445a99bdf6375bb58d",
  measurementId: "G-13D5MWJD3E"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        await handleUserAuth(firebaseUser);
      } else {
        clearAuthState();
      }
    });
    return unsubscribe;
  }, []);

  const handleUserAuth = async (firebaseUser: FirebaseUser) => {
    const agentCheck = await checkIfAgentExists(firebaseUser.email || '');
    if (agentCheck) {
      setAgentAuthState(firebaseUser, agentCheck);
      return;
    }

    const userRef = ref(database, `users/${firebaseUser.uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      setUser({
        id: firebaseUser.uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: firebaseUser.email || '',
        role: userData.role
      });
      
      localStorage.setItem('userRole', userData.role || '');
      if (userData.role === 'admin') {
        localStorage.setItem('adminkey', firebaseUser.uid);
      }
    }
  };

  const setAgentAuthState = (firebaseUser: FirebaseUser, agentData: {firstName: string, lastName: string, parentAdminId: string}) => {
    setUser({
      id: firebaseUser.uid,
      firstName: agentData.firstName,
      lastName: agentData.lastName,
      email: firebaseUser.email || '',
      role: 'agent',
      parentAdminId: agentData.parentAdminId
    });
    localStorage.setItem('userRole', 'agent');
    localStorage.setItem('agentkey', firebaseUser.uid);
    localStorage.setItem('adminkey', agentData.parentAdminId);
  };

  const clearAuthState = () => {
    setUser(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminkey');
    localStorage.removeItem('agentkey');
  };

  const checkIfAgentExists = async (email: string) => {
    try {
      const adminsRef = ref(database, 'users');
      const snapshot = await get(adminsRef);
      
      if (snapshot.exists()) {
        for (const [adminId, adminData] of Object.entries(snapshot.val()) as [string, any][]) {
          if (adminData.agents) {
            for (const [agentId, agentData] of Object.entries(adminData.agents) as [string, any][]) {
              if (agentData.email === email) {
                return {
                  firstName: agentData.firstName,
                  lastName: agentData.lastName,
                  parentAdminId: adminId
                };
              }
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error checking for agent:', error);
      return null;
    }
  };

  const signup = async (firstName: string, lastName: string, email: string, password: string, role: UserRole) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      await set(ref(database, `users/${firebaseUser.uid}`), {
        firstName,
        lastName,
        email,
        role,
        createdAt: new Date().toISOString()
      });

      setUser({
        id: firebaseUser.uid,
        firstName,
        lastName,
        email,
        role
      });

      localStorage.setItem('userRole', role || '');
      if (role === 'admin') {
        localStorage.setItem('adminkey', firebaseUser.uid);
      }

      navigate('/dashboard');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const login = async (email: string, password: string, role: UserRole): Promise<UserCredential> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (role === 'agent') {
        const agentCheck = await checkIfAgentExists(email);
        if (!agentCheck) {
          await auth.signOut(); // Sign out if not a valid agent
          throw new Error('Agent not found under any admin account');
        }
      } else {
        const userRef = ref(database, `users/${userCredential.user.uid}`);
        const snapshot = await get(userRef);
        
        if (!snapshot.exists()) {
          await auth.signOut(); // Sign out if user doesn't exist
          throw new Error('User not found');
        }
  
        const userData = snapshot.val();
        if (userData.role !== role) {
          await auth.signOut(); // Sign out if role doesn't match
          throw new Error(`Invalid role. Expected ${role} but found ${userData.role}`);
        }
  
        // Additional check for email match
        if (userData.email !== email) {
          await auth.signOut();
          throw new Error('Email mismatch in database');
        }
      }
  
      return userCredential;
    } catch (error: any) {
      // If Firebase auth succeeds but our checks fail, make sure to sign out
      if (auth.currentUser) {
        await auth.signOut();
      }
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      clearAuthState();
      navigate('/login');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isAgent: user?.role === 'agent',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
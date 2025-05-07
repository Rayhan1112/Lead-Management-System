import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';

type UserRole = 'admin' | 'agent' | null;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAgent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4tt2fFP7I0TYm3sGhTWQF_59LZ9uiERQ",
  authDomain: "new-lms-3a0dc.firebaseapp.com",
  databaseURL: "https://new-lms-3a0dc-default-rtdb.firebaseio.com", // Add Realtime DB URL
  projectId: "new-lms-3a0dc",
  storageBucket: "new-lms-3a0dc.appspot.com",
  messagingSenderId: "956423626146",
  appId: "1:956423626146:web:63b0c32e4640181dc7e6fb",
  measurementId: "G-NZ9H6VP6TB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // In a real app, you would fetch user data from your database here
        const token = await firebaseUser.getIdTokenResult();
        const role = token.claims.role as UserRole || null;
        
        setUser({
          id: firebaseUser.uid,
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ')[1] || '',
          email: firebaseUser.email || '',
          role
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (firstName: string, lastName: string, email: string, password: string, role: UserRole) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Set custom user claims (for role-based access)
      // Note: In a real app, you would do this via a Firebase Cloud Function
      
      // Save additional user data to Realtime Database
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

      navigate('/dashboard');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Fetch user data from database
      // In a real app, you would fetch this data
      const token = await firebaseUser.getIdTokenResult();
      const role = token.claims.role as UserRole || 'agent';
      
      setUser({
        id: firebaseUser.uid,
        firstName: firebaseUser.displayName?.split(' ')[0] || '',
        lastName: firebaseUser.displayName?.split(' ')[1] || '',
        email: firebaseUser.email || '',
        role
      });

      navigate('/dashboard');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate('/login');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent';

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      isAuthenticated: isAuthenticated,
      isAdmin,
      isAgent,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
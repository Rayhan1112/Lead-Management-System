import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { auth, database } from '../firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import ReCAPTCHA from 'react-google-recaptcha';

export const SignupForm: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'agent'>('admin');
  const [verificationSent, setVerificationSent] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const agentLimit = 2;
  const leadLimit = 500;
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !user.emailVerified) {
        await signOut(auth);
        setCurrentUser(null);
        setVerificationSent(true);
        toast.error('Email not verified. Please verify your email.');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentUser && verificationSent) {
      interval = setInterval(async () => {
        await currentUser.reload();
        if (currentUser.emailVerified) {
          await set(ref(database, `users/${currentUser.uid}/emailVerified`), true);
          toast.success('Email verified successfully!');
          clearInterval(interval);
          navigate('/login');
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [currentUser, verificationSent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }

    if (!captchaVerified) {
      toast.error('Please verify reCAPTCHA');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      await set(ref(database, `users/${user.uid}`), {
        firstName,
        lastName,
        email,
        role,
        leadLimit,
        agentLimit,
        emailVerified: false,
        createdAt: new Date().toISOString()
      });

      await sendEmailVerification(user);
      setCurrentUser(user);
      setVerificationSent(true);

      toast.success('Account created! Please verify your email.');
      await signOut(auth);

    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
    }
  };

  const resendEmailVerification = async () => {
    if (currentUser) {
      try {
        await sendEmailVerification(currentUser);
        toast.success('Verification email resent');
      } catch (error: any) {
        toast.error('Failed to resend email');
      }
    }
  };

  const manuallyCheckVerification = async () => {
    if (currentUser) {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        await set(ref(database, `users/${currentUser.uid}/emailVerified`), true);
        toast.success('Email verified');
        navigate('/login');
      } else {
        toast.error('Email not verified yet');
      }
    }
  };

  if (verificationSent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-4">
        <h2 className="text-xl font-bold text-center">Verify Your Email</h2>
        <p className="text-sm text-center text-muted-foreground">
          A verification email has been sent to <strong>{email}</strong>. <br />
          Please verify your email to continue.
        </p>
        <div className="flex space-x-4">
          <Button onClick={resendEmailVerification}>Resend Email</Button>
          <Button onClick={manuallyCheckVerification}>Manually Verified</Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Once verified, you'll be redirected to login automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="neuro p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-pulse">Create an Account</h2>
          <p className="text-sm text-muted-foreground">
            Join Pulse CRM to manage your customers
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
              <Input id="firstName" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
              <Input id="lastName" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" type="email" placeholder="user@pulsecrm.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          <div className="flex justify-center pt-2">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LfcvEQrAAAAAGZk6NDz1q1HaYuJCO--BHzGeTOh" // 🔁 Replace this with your actual Site Key
              onChange={() => setCaptchaVerified(true)}
              onExpired={() => setCaptchaVerified(false)}
            />
          </div>
        </div>

        <Button type="submit" className="w-full neuro hover:shadow-none transition-all duration-300">
          Create Account
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-pulse hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignupForm;
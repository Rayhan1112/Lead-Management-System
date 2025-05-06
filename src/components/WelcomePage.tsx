
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-background p-4">
      <div className="neuro max-w-4xl w-full p-8 flex flex-col items-center space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold text-pulse md:text-6xl">
            Welcome to Pulse CRM Control
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A comprehensive CRM system designed for managing leads, agents, tasks, meetings, and deals with a beautiful neomorphic interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-8">
          <div className="neuro p-6 space-y-4 text-center">
            <h2 className="text-2xl font-semibold text-pulse">For Admins</h2>
            <ul className="space-y-2 text-left">
              <li className="flex items-center">
                <div className="mr-2 h-4 w-4 rounded-full bg-pulse"></div>
                Complete lead management
              </li>
              <li className="flex items-center">
                <div className="mr-2 h-4 w-4 rounded-full bg-pulse"></div>
                Agent supervision and assignment
              </li>
              <li className="flex items-center">
                <div className="mr-2 h-4 w-4 rounded-full bg-pulse"></div>
                Analytics and reporting
              </li>
              <li className="flex items-center">
                <div className="mr-2 h-4 w-4 rounded-full bg-pulse"></div>
                Task and meeting scheduling
              </li>
            </ul>
          </div>

          <div className="neuro p-6 space-y-4 text-center">
            <h2 className="text-2xl font-semibold text-pulse">For Agents</h2>
            <ul className="space-y-2 text-left">
              <li className="flex items-center">
                <div className="mr-2 h-4 w-4 rounded-full bg-pulse"></div>
                Manage assigned leads
              </li>
              <li className="flex items-center">
                <div className="mr-2 h-4 w-4 rounded-full bg-pulse"></div>
                Schedule meetings and tasks
              </li>
              <li className="flex items-center">
                <div className="mr-2 h-4 w-4 rounded-full bg-pulse"></div>
                Track deal progress
              </li>
              <li className="flex items-center">
                <div className="mr-2 h-4 w-4 rounded-full bg-pulse"></div>
                Stay updated with notifications
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button 
            className="neuro hover:shadow-none transition-all duration-300 min-w-[150px]"
            onClick={() => navigate('/login')}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;

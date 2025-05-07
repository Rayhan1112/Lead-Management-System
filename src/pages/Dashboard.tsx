
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartSelector } from '@/components/dashboard/ChartSelector';
import { ActionCards } from '@/components/dashboard/ActionCards';
import { FileText, Users, Phone, Calendar as CalendarIcon } from 'lucide-react';
import { dashboardStats } from '@/lib/mockData';
import { EnhancedCalendar } from '@/components/dashboard/EnhancedCalendar';

const Dashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard 
            title="Total Leads" 
            value={dashboardStats.totalLeads}
            icon={<FileText className="h-4 w-4" />}
            trend={{ value: 12, positive: true }}
          />
          
          {isAdmin && (
            <StatCard 
              title="Total Agents" 
              value={dashboardStats.totalAgents}
              icon={<Users className="h-4 w-4" />}
            />
          )}
          
          <StatCard 
            title="Today's Calls" 
            value={dashboardStats.todaysCalls}
            icon={<Phone className="h-4 w-4" />}
          />
          
          <StatCard 
            title="Upcoming Calls" 
            value={dashboardStats.upcomingCalls}
            icon={<Phone className="h-4 w-4" />}
          />
          
          <StatCard 
            title="Today's Meetings" 
            value={dashboardStats.todaysMeetings}
            icon={<CalendarIcon className="h-4 w-4" />}
          />
          
          <StatCard 
            title="Upcoming Meetings" 
            value={dashboardStats.upcomingMeetings}
            icon={<CalendarIcon className="h-4 w-4" />}
            trend={{ value: 8, positive: true }}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartSelector className="lg:col-span-2" />
          <EnhancedCalendar />
        </div>
        
        <ActionCards />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

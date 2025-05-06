
import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MeetingsTable } from '@/components/meetings/MeetingsTable';

const Meetings: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meeting Scheduler</h1>
          <p className="text-muted-foreground">
            Schedule and manage meetings with participants.
          </p>
        </div>
        
        <MeetingsTable />
      </div>
    </DashboardLayout>
  );
};

export default Meetings;

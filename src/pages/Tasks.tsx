
import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { TasksTable } from '@/components/tasks/TasksTable';

const Tasks: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">
            Assign and track tasks for your team.
          </p>
        </div>
        
        <TasksTable />
      </div>
    </DashboardLayout>
  );
};

export default Tasks;

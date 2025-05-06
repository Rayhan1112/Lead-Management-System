
import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SettingsTabs } from '@/components/settings/SettingsTabs';

const Settings: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile, notifications, and account preferences.
          </p>
        </div>
        
        <SettingsTabs />
      </div>
    </DashboardLayout>
  );
};

export default Settings;

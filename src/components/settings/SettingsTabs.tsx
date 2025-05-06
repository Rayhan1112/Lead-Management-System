
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Bell, Shield, HelpCircle, Database, Palette
} from 'lucide-react';
import { ThemeSettings } from './ThemeSettings';
import { StorageSettings } from './StorageSettings';
import { ProfileSettings } from './ProfileSettings';
import { NotificationSettings } from './NotificationSettings';
import { HelpFAQs } from './HelpFAQs';

export const SettingsTabs = () => {
  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList className="neuro border-none h-auto flex-wrap">
        <TabsTrigger value="profile" className="data-[state=active]:neuro-inset py-2 px-4">
          <User className="h-4 w-4 mr-2" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="notifications" className="data-[state=active]:neuro-inset py-2 px-4">
          <Bell className="h-4 w-4 mr-2" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="appearance" className="data-[state=active]:neuro-inset py-2 px-4">
          <Palette className="h-4 w-4 mr-2" />
          Appearance
        </TabsTrigger>
        <TabsTrigger value="storage" className="data-[state=active]:neuro-inset py-2 px-4">
          <Database className="h-4 w-4 mr-2" />
          Storage
        </TabsTrigger>
        <TabsTrigger value="security" className="data-[state=active]:neuro-inset py-2 px-4">
          <Shield className="h-4 w-4 mr-2" />
          Security
        </TabsTrigger>
        <TabsTrigger value="help" className="data-[state=active]:neuro-inset py-2 px-4">
          <HelpCircle className="h-4 w-4 mr-2" />
          Help & FAQs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileSettings />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationSettings />
      </TabsContent>

      <TabsContent value="appearance">
        <ThemeSettings />
      </TabsContent>

      <TabsContent value="storage">
        <StorageSettings />
      </TabsContent>

      <TabsContent value="security">
        <div className="neuro border-none p-6">
          <h3 className="text-xl font-semibold mb-4">Security Settings</h3>
          <p className="text-muted-foreground">Configure your security preferences.</p>
        </div>
      </TabsContent>

      <TabsContent value="help">
        <HelpFAQs />
      </TabsContent>
    </Tabs>
  );
};

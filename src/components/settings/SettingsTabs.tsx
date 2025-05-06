
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Settings, Bell, Shield, HelpCircle, Database, Palette
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ThemeSettings } from './ThemeSettings';
import { StorageSettings } from './StorageSettings';

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
        <Card className="neuro border-none p-6">
          <h3 className="text-xl font-semibold mb-4">Profile Settings</h3>
          <p className="text-muted-foreground">Manage your account information and preferences.</p>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card className="neuro border-none p-6">
          <h3 className="text-xl font-semibold mb-4">Notification Settings</h3>
          <p className="text-muted-foreground">Configure how you want to be notified.</p>
        </Card>
      </TabsContent>

      <TabsContent value="appearance">
        <ThemeSettings />
      </TabsContent>

      <TabsContent value="storage">
        <StorageSettings />
      </TabsContent>

      <TabsContent value="security">
        <Card className="neuro border-none p-6">
          <h3 className="text-xl font-semibold mb-4">Security Settings</h3>
          <p className="text-muted-foreground">Configure your security preferences.</p>
        </Card>
      </TabsContent>

      <TabsContent value="help">
        <Card className="neuro border-none p-6">
          <h3 className="text-xl font-semibold mb-4">Help & FAQs</h3>
          <p className="text-muted-foreground">Find answers to commonly asked questions.</p>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

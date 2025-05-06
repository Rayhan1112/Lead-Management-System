
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const SettingsTabs: React.FC = () => {
  const { user } = useAuth();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile updated successfully');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Notification preferences saved');
  };

  const handleSubmitHelp = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Support request submitted');
  };

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="help">Help & FAQ</TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile">
        <Card className="neuro border-none">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Update your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6 items-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                  <AvatarFallback className="text-2xl">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <Label htmlFor="avatar">Profile Picture</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      id="avatar" 
                      type="file" 
                      className="neuro-inset focus:shadow-none"
                    />
                    <Button 
                      variant="outline"
                      className="neuro hover:shadow-none transition-all duration-300"
                    >
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    defaultValue={user?.name || ''}
                    className="neuro-inset focus:shadow-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    defaultValue={user?.email || ''}
                    className="neuro-inset focus:shadow-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone"
                    className="neuro-inset focus:shadow-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input 
                    id="role"
                    defaultValue={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || ''}
                    readOnly
                    className="neuro-inset focus:shadow-none bg-muted"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio"
                  placeholder="Tell us about yourself..."
                  className="neuro-inset focus:shadow-none min-h-[100px]"
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit"
                  className="neuro hover:shadow-none transition-all duration-300"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="notifications">
        <Card className="neuro border-none">
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Manage how you receive notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveNotifications} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Notifications</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="new-leads">New leads</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when new leads are added
                      </p>
                    </div>
                    <Switch id="new-leads" defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="task-updates">Task Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when tasks are assigned or updated
                      </p>
                    </div>
                    <Switch id="task-updates" defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="meeting-reminders">Meeting Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Email reminders before scheduled meetings
                      </p>
                    </div>
                    <Switch id="meeting-reminders" defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="deal-updates">Deal Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications about deal status changes
                      </p>
                    </div>
                    <Switch id="deal-updates" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">System Notifications</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="in-app">In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show notifications in the app
                      </p>
                    </div>
                    <Switch id="in-app" defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="browser">Browser Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show desktop notifications in your browser
                      </p>
                    </div>
                    <Switch id="browser" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit"
                  className="neuro hover:shadow-none transition-all duration-300"
                >
                  Save Preferences
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="security">
        <Card className="neuro border-none">
          <CardHeader>
            <CardTitle>Security & Privacy</CardTitle>
            <CardDescription>
              Manage your password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Change Password</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password"
                    className="neuro-inset focus:shadow-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    className="neuro-inset focus:shadow-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    className="neuro-inset focus:shadow-none"
                  />
                </div>
                
                <Button 
                  onClick={() => toast.success('Password updated successfully')}
                  className="neuro hover:shadow-none transition-all duration-300"
                >
                  Update Password
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sessions</h3>
              <p className="text-sm text-muted-foreground">
                You're currently signed in on this device.
              </p>
              
              <Button 
                variant="outline"
                onClick={() => toast.success('All other sessions have been logged out')}
                className="neuro hover:shadow-none transition-all duration-300"
              >
                Sign out from other devices
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Privacy</h3>
              <p className="text-sm text-muted-foreground">
                Manage your data and privacy settings
              </p>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => toast.success('Your data export has been initiated')}
                  className="neuro hover:shadow-none transition-all duration-300"
                >
                  Export your data
                </Button>
                
                <Button 
                  variant="destructive"
                  onClick={() => toast.error('Please contact an administrator to delete your account')}
                >
                  Delete account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="help">
        <Card className="neuro border-none">
          <CardHeader>
            <CardTitle>Help & Support</CardTitle>
            <CardDescription>
              Get help with using the CRM system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Frequently Asked Questions</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">How do I add a new lead?</h4>
                  <p className="text-sm text-muted-foreground">
                    Navigate to the Leads page and click on the "Add Lead" button. Fill in the lead details in the form and click "Add Lead" to save.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">How do I schedule a meeting?</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to the Meetings page and click on "Schedule Meeting". Select the date, time, and participants, then click "Schedule Meeting".
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">How do I assign tasks to agents?</h4>
                  <p className="text-sm text-muted-foreground">
                    Visit the Tasks page and click "Assign Task". Choose the agent, set the task details and date range, then click "Assign Task".
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">How do I export leads to Excel?</h4>
                  <p className="text-sm text-muted-foreground">
                    On the Leads page, click the download icon in the actions bar to export all your leads to an Excel file.
                  </p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Support</h3>
              
              <form onSubmit={handleSubmitHelp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input 
                    id="subject"
                    className="neuro-inset focus:shadow-none"
                    placeholder="Briefly describe your issue"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="details">Details</Label>
                  <Textarea 
                    id="details"
                    className="neuro-inset focus:shadow-none min-h-[100px]"
                    placeholder="Please provide detailed information about your issue"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="attachment">Attachments (Optional)</Label>
                  <Input 
                    id="attachment"
                    type="file"
                    className="neuro-inset focus:shadow-none"
                  />
                </div>
                
                <Button 
                  type="submit"
                  className="neuro hover:shadow-none transition-all duration-300"
                >
                  Submit Support Request
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

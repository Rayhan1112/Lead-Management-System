
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Camera, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

export const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '123-456-7890', // Example placeholder
    avatar: user?.avatar || '/placeholder.svg',
    bio: 'CRM professional with 5+ years of experience managing client relationships.',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = () => {
    // In a real application, this would update the user profile in the backend
    toast.success('Profile updated successfully');
  };

  const handleAvatarChange = () => {
    // This would trigger a file upload in a real application
    toast.info('Avatar upload functionality would open here');
  };

  return (
    <Card className="neuro border-none">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Manage your personal information and how others see you on the platform.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-24 w-24 cursor-pointer relative group" onClick={handleAvatarChange}>
              <AvatarImage src={formData.avatar} alt={formData.name} />
              <AvatarFallback className="text-2xl">
                {formData.name.charAt(0)}
              </AvatarFallback>
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </Avatar>
            <span className="text-xs text-muted-foreground">Click to change</span>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input 
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="neuro-inset focus:shadow-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input 
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="neuro-inset focus:shadow-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input 
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="neuro-inset focus:shadow-none"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bio">Professional Bio</Label>
          <textarea 
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="w-full neuro-inset p-3 rounded-md focus:shadow-none focus:outline-none resize-none"
          />
        </div>
      </CardContent>
      
      <CardFooter>
        <Button onClick={handleSave} className="neuro hover:shadow-none transition-all duration-300">
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
};

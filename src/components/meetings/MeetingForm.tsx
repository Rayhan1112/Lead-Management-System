
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Meeting, mockAgents } from '@/lib/mockData';

interface MeetingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (meeting: Meeting) => void;
  meeting?: Meeting;
}

export const MeetingForm: React.FC<MeetingFormProps> = ({ isOpen, onClose, onSubmit, meeting }) => {
  const [formData, setFormData] = useState<Partial<Meeting>>(
    meeting || {
      title: '',
      startDate: '',
      startTime: '',
      duration: 30,
      participants: [],
      reminder: '15min',
      status: 'scheduled',
    }
  );
  
  const [selectedAgents, setSelectedAgents] = useState<string[]>(
    meeting?.participants || []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prevSelected => {
      if (prevSelected.includes(agentId)) {
        return prevSelected.filter(id => id !== agentId);
      } else {
        return [...prevSelected, agentId];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newMeeting: Meeting = {
      id: meeting?.id || `meeting-${Date.now()}`,
      title: formData.title || '',
      startDate: formData.startDate || '',
      startTime: formData.startTime || '',
      duration: formData.duration || 30,
      participants: selectedAgents,
      reminder: (formData.reminder as Meeting['reminder']) || '15min',
      status: (formData.status as Meeting['status']) || 'scheduled',
    };
    
    onSubmit(newMeeting);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] neuro border-none">
        <DialogHeader>
          <DialogTitle>{meeting ? 'Edit Meeting' : 'Schedule New Meeting'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              name="title"
              className="neuro-inset focus:shadow-none"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                className="neuro-inset focus:shadow-none"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startTime">Time</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                className="neuro-inset focus:shadow-none"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select 
                defaultValue={formData.duration?.toString()}
                onValueChange={(value) => handleSelectChange('duration', value)}
              >
                <SelectTrigger className="neuro-inset focus:shadow-none">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reminder">Reminder</Label>
              <Select 
                defaultValue={formData.reminder}
                onValueChange={(value) => handleSelectChange('reminder', value)}
              >
                <SelectTrigger className="neuro-inset focus:shadow-none">
                  <SelectValue placeholder="Select reminder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5min">5 minutes before</SelectItem>
                  <SelectItem value="10min">10 minutes before</SelectItem>
                  <SelectItem value="15min">15 minutes before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="participants">Participants</Label>
            <div className="neuro-inset p-3 rounded-md space-y-2 max-h-40 overflow-y-auto">
              {mockAgents.filter(a => a.status === 'active').map(agent => (
                <div key={agent.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`agent-${agent.id}`} 
                    checked={selectedAgents.includes(agent.id)}
                    onCheckedChange={() => handleAgentToggle(agent.id)}
                  />
                  <label htmlFor={`agent-${agent.id}`} className="text-sm">
                    {agent.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button"
              variant="outline"
              onClick={onClose}
              className="neuro hover:shadow-none transition-all duration-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="neuro hover:shadow-none transition-all duration-300"
            >
              {meeting ? 'Update Meeting' : 'Schedule Meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

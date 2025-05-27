import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AuthContext';
import { database, messaging } from '../../firebase';
import { ref, push, set, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { getToken, onMessage } from 'firebase/messaging';
import { toast } from 'sonner';
import { format, parseISO, subMinutes, addMinutes, isBefore, isAfter, addDays, addWeeks, addMonths } from 'date-fns';
import { encryptObject, decryptObject } from '../../lib/utils';

interface Meeting {
  id: string;
  title: string;
  startDate: string;
  startTime: string;
  duration: number;
  participants: string[];
  reminder: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdBy: string;
  agentId?: string;
  isAgentMeeting?: boolean;
  originalMeetingId?: string;
  notificationId?: string;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  recurrenceEndDate?: string;
  followUp?: boolean;
  parentMeetingId?: string;
}

interface MeetingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  meeting?: Meeting;
}

export const MeetingForm: React.FC<MeetingFormProps> = ({ isOpen, onClose, onSubmit, meeting }) => {
  const { user, isAdmin } = useAuth();
  const adminId = localStorage.getItem('adminkey');
  const agentId = localStorage.getItem('agentkey');
  
  const [formData, setFormData] = useState<Partial<Meeting>>({
    title: '',
    startDate: '',
    startTime: '',
    duration: 30,
    participants: [],
    reminder: '15min',
    status: 'scheduled',
    isRecurring: false,
    recurrencePattern: 'weekly',
    recurrenceEndDate: '',
    followUp: false
  });
  
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [conflicts, setConflicts] = useState<{agentId: string, conflicts: Meeting[]}[]>([]);
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([]);
  const [agentAvailabilities, setAgentAvailabilities] = useState<Record<string, {start: string, end: string}>>({});

  useEffect(() => {
    if (meeting) {
      setFormData({
        title: meeting.title,
        startDate: meeting.startDate,
        startTime: meeting.startTime,
        duration: meeting.duration,
        participants: meeting.participants || [],
        reminder: meeting.reminder,
        status: meeting.status,
        isRecurring: meeting.isRecurring || false,
        recurrencePattern: meeting.recurrencePattern || 'weekly',
        recurrenceEndDate: meeting.recurrenceEndDate || '',
        followUp: meeting.followUp || false,
        parentMeetingId: meeting.parentMeetingId
      });
      setSelectedAgents(meeting.participants || []);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const defaultTime = new Date();
      defaultTime.setHours(10, 0, 0, 0); // Default to 10:00 AM
      
      setFormData({
        title: '',
        startDate: today,
        startTime: format(defaultTime, 'HH:mm'),
        duration: 30,
        participants: [],
        reminder: '15min',
        status: 'scheduled',
        isRecurring: false,
        recurrencePattern: 'weekly',
        recurrenceEndDate: '',
        followUp: false
      });
      setSelectedAgents([]);
    }
  }, [meeting, isOpen]);

  useEffect(() => {
    const initializeNotifications = async () => {
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted' && messaging) {
        try {
          const currentToken = await getToken(messaging, { 
            vapidKey: 'YOUR_VAPID_KEY'
          });
          if (currentToken && user?.id) {
            await update(ref(database, `users/${user.id}/fcmToken`), currentToken);
          }
        } catch (error) {
          console.error('Error getting FCM token:', error);
        }
      }

      if (messaging) {
        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};
          if (title && body) {
            showLocalNotification(title, body);
          }
        });
      }
    };

    if (isOpen) {
      initializeNotifications();
      fetchAgents();
    }
  }, [isOpen, user]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      let agentsRef;
      
      if (isAdmin && adminId) {
        agentsRef = ref(database, `users/${adminId}/agents`);
      } else if (agentId && adminId) {
        agentsRef = ref(database, `users/${adminId}/agents`);
      } else {
        throw new Error('No admin or agent ID found');
      }

      const snapshot = await get(agentsRef);
      
      if (snapshot.exists()) {
        const agentsData: any[] = [];
        snapshot.forEach((childSnapshot) => {
          agentsData.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        setAvailableAgents(agentsData.filter(agent => agent.status === 'active'));
        
        // Fetch default working hours for each agent
        const availabilities: Record<string, {start: string, end: string}> = {};
        for (const agent of agentsData) {
          const availabilityRef = ref(database, `users/${adminId}/agents/${agent.id}/availability`);
          const availabilitySnapshot = await get(availabilityRef);
          if (availabilitySnapshot.exists()) {
            availabilities[agent.id] = availabilitySnapshot.val();
          } else {
            // Default working hours (9am-5pm)
            availabilities[agent.id] = { start: '09:00', end: '17:00' };
          }
        }
        setAgentAvailabilities(availabilities);
        
        if (!meeting && !isAdmin && agentId) {
          setSelectedAgents([agentId]);
        }
      } else {
        setAvailableAgents([]);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  };

  // Check for scheduling conflicts when time or participants change
  useEffect(() => {
    if (formData.startDate && formData.startTime && formData.duration && selectedAgents.length > 0) {
      checkConflicts();
    }
  }, [formData.startDate, formData.startTime, formData.duration, selectedAgents]);

  const checkConflicts = useCallback(async () => {
    if (!adminId || !formData.startDate || !formData.startTime || !formData.duration) return;

    const meetingStart = parseISO(`${formData.startDate}T${formData.startTime}`);
    const meetingEnd = addMinutes(meetingStart, formData.duration);
    
    const conflictResults: {agentId: string, conflicts: Meeting[]}[] = [];
    
    for (const agentId of selectedAgents) {
      try {
        const meetingsRef = ref(database, `users/${adminId}/agents/${agentId}/meetingdetails`);
        const snapshot = await get(meetingsRef);
        
        const agentConflicts: Meeting[] = [];
        
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const meetingData = childSnapshot.val();
            if (meetingData.id === formData.id) return; // Skip current meeting if editing
            
            const existingStart = parseISO(`${meetingData.startDate}T${meetingData.startTime}`);
            const existingEnd = addMinutes(existingStart, meetingData.duration);
            
            // Check if time ranges overlap
            if (
              (isBefore(meetingStart, existingEnd) && isAfter(meetingStart, existingStart)) ||
              (isBefore(meetingEnd, existingEnd) && isAfter(meetingEnd, existingStart)) ||
              (isBefore(existingStart, meetingEnd) && isAfter(existingStart, meetingStart)) ||
              (isBefore(existingEnd, meetingEnd) && isAfter(existingEnd, meetingStart))
            ) {
              agentConflicts.push(meetingData);
            }
          });
        }
        
        if (agentConflicts.length > 0) {
          conflictResults.push({agentId, conflicts: agentConflicts});
        }
      } catch (error) {
        console.error(`Error checking conflicts for agent ${agentId}:`, error);
      }
    }
    
    setConflicts(conflictResults);
    
    // If conflicts found, suggest alternative times
    if (conflictResults.length > 0) {
      suggestAlternativeTimes();
    }
  }, [formData, selectedAgents, adminId]);

  const suggestAlternativeTimes = useCallback(() => {
    if (!formData.startDate || !formData.startTime || !formData.duration) return;

    const originalTime = parseISO(`${formData.startDate}T${formData.startTime}`);
    const suggestions: string[] = [];
    
    // Suggest times at 30-minute intervals around the original time
    for (let i = 1; i <= 3; i++) {
      // Earlier times
      const earlierTime = subMinutes(originalTime, i * 30);
      if (isWithinWorkingHours(earlierTime)) {
        suggestions.push(format(earlierTime, 'HH:mm'));
      }
      
      // Later times
      const laterTime = addMinutes(originalTime, i * 30);
      if (isWithinWorkingHours(laterTime)) {
        suggestions.push(format(laterTime, 'HH:mm'));
      }
    }
    
    setSuggestedTimes(suggestions);
  }, [formData, selectedAgents, agentAvailabilities]);

  const isWithinWorkingHours = (time: Date) => {
    if (selectedAgents.length === 0) return true;
    
    // Check if time is within working hours for all selected agents
    return selectedAgents.every(agentId => {
      const availability = agentAvailabilities[agentId];
      if (!availability) return true;
      
      const startHour = parseInt(availability.start.split(':')[0]);
      const startMinute = parseInt(availability.start.split(':')[1]);
      const endHour = parseInt(availability.end.split(':')[0]);
      const endMinute = parseInt(availability.end.split(':')[1]);
      
      const timeHour = time.getHours();
      const timeMinute = time.getMinutes();
      
      // Convert to minutes since midnight for easier comparison
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      const timeMinutes = timeHour * 60 + timeMinute;
      
      return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
    });
  };

  const showLocalNotification = (title: string, body: string) => {
    if (notificationPermission === 'granted') {
      new Notification(title, { 
        body,
        icon: '/notification-icon.png'
      });
    }
  };

  const scheduleNotification = async (meeting: Meeting) => {
    if (!('Notification' in window)) return;

    try {
      const meetingDateTime = parseISO(`${meeting.startDate}T${meeting.startTime}`);
      let reminderMinutes = 15;
      
      if (meeting.reminder === '5min') reminderMinutes = 5;
      else if (meeting.reminder === '10min') reminderMinutes = 10;
      
      const notificationTime = subMinutes(meetingDateTime, reminderMinutes);
      const now = new Date();
      
      if (notificationTime > now) {
        const timeUntilNotification = notificationTime.getTime() - now.getTime();
        
        setTimeout(() => {
          if (notificationPermission === 'granted') {
            new Notification(`Meeting Reminder: ${meeting.title}`, {
              body: `Your meeting starts in ${reminderMinutes} minutes`,
              icon: '/notification-icon.png',
            });
          }
        }, timeUntilNotification);
        
        const notificationId = `notification-${Date.now()}`;
        const notificationRef = ref(database, `notifications/${notificationId}`);
        
        await set(notificationRef, {
          meetingId: meeting.id,
          title: `Meeting Reminder: ${meeting.title}`,
          body: `Your meeting starts in ${reminderMinutes} minutes`,
          recipientIds: meeting.participants,
          scheduledTime: notificationTime.toISOString(),
          status: 'scheduled',
          createdAt: new Date().toISOString(),
        });
        
        await update(ref(database, `users/${adminId}/meetingdetails/${meeting.id}`), {
          notificationId
        });
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

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

  const handleTimeSuggestionClick = (time: string) => {
    setFormData(prev => ({
      ...prev,
      startTime: time
    }));
    setSuggestedTimes([]);
  };

  const createRecurringMeetings = async (baseMeeting: Meeting) => {
    if (!formData.isRecurring || !formData.recurrencePattern || !formData.recurrenceEndDate) {
      return [];
    }

    const recurringMeetings: Meeting[] = [];
    const baseDate = parseISO(`${baseMeeting.startDate}T${baseMeeting.startTime}`);
    const endDate = parseISO(formData.recurrenceEndDate);
    
    let currentDate = baseDate;
    let iteration = 1;

    while (currentDate <= endDate) {
      iteration++;
      
      // Calculate next occurrence based on pattern
      switch (formData.recurrencePattern) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
      }
      
      if (currentDate > endDate) break;
      
      const recurringMeeting: Meeting = {
        ...baseMeeting,
        id: `${baseMeeting.id}-recur-${iteration}`,
        startDate: format(currentDate, 'yyyy-MM-dd'),
        startTime: format(currentDate, 'HH:mm'),
        originalMeetingId: baseMeeting.id,
        isRecurring: true,
        recurrencePattern: formData.recurrencePattern,
        recurrenceEndDate: formData.recurrenceEndDate
      };
      
      recurringMeetings.push(recurringMeeting);
    }

    return recurringMeetings;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !adminId) {
      toast.error('Authentication error');
      return;
    }
  
    setIsLoading(true);
    try {
      const meetingId = meeting?.id || `meeting-${Date.now()}`;
      
      // Prepare meeting data
      const newMeeting: Meeting = {
        id: meetingId,
        title: formData.title || '',
        startDate: formData.startDate || '',
        startTime: formData.startTime || '',
        duration: formData.duration || 30,
        participants: selectedAgents,
        reminder: formData.reminder || '15min',
        status: formData.status || 'scheduled',
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        isRecurring: formData.isRecurring || false,
        recurrencePattern: formData.recurrencePattern,
        recurrenceEndDate: formData.recurrenceEndDate,
        followUp: formData.followUp || false,
        ...(meeting?.isAgentMeeting && { isAgentMeeting: true }),
        ...(meeting?.originalMeetingId && { originalMeetingId: meeting.originalMeetingId }),
        ...(!isAdmin && { agentId: agentId }),
      };
  
      const updates: Record<string, any> = {};
  
      if (isAdmin) {
        // Store meeting for admin
        updates[`users/${adminId}/meetingdetails/${meetingId}`] = newMeeting;
  
        if (selectedAgents.length > 0) {
          // Store meetings for each agent
          selectedAgents.forEach(agentId => {
            const agentMeeting = {
              ...newMeeting,
              isAgentMeeting: true,
              originalMeetingId: meetingId,
              agentId: agentId,
            };
            updates[`users/${adminId}/agents/${agentId}/meetingdetails/${meetingId}`] = agentMeeting;
          });
        }
  
        // Remove meetings for deselected agents
        if (meeting?.participants) {
          const removedAgents = meeting.participants.filter(id => !selectedAgents.includes(id));
          removedAgents.forEach(agentId => {
            updates[`users/${adminId}/agents/${agentId}/meetingdetails/${meetingId}`] = null;
          });
        }
      } else {
        // Agent creating a meeting
        updates[`users/${adminId}/agents/${agentId}/meetingdetails/${meetingId}`] = newMeeting;
  
        // Create reference in admin's meetingdetails
        const adminMeetingRef = push(ref(database, `users/${adminId}/meetingdetails`));
        updates[`users/${adminId}/meetingdetails/${adminMeetingRef.key}`] = {
          ...newMeeting,
          isAgentMeeting: true,
          agentId: agentId
        };
  
        // Share with other participants if any
        selectedAgents.filter(id => id !== agentId).forEach(participantId => {
          updates[`users/${adminId}/agents/${participantId}/meetingdetails/${meetingId}`] = {
            ...newMeeting,
            isAgentMeeting: true,
            originalMeetingId: meetingId,
            agentId: agentId
          };
        });
      }
  
      // Create recurring meetings if enabled
      if (formData.isRecurring && formData.recurrencePattern && formData.recurrenceEndDate) {
        const recurringMeetings = await createRecurringMeetings(newMeeting);
        
        for (const recurringMeeting of recurringMeetings) {
          updates[`users/${adminId}/meetingdetails/${recurringMeeting.id}`] = recurringMeeting;
          
          selectedAgents.forEach(agentId => {
            updates[`users/${adminId}/agents/${agentId}/meetingdetails/${recurringMeeting.id}`] = {
              ...recurringMeeting,
              isAgentMeeting: true,
              agentId: agentId
            };
          });
        }
      }
  
      // Save all updates
      await update(ref(database), updates);
      
      // Schedule notification
      await scheduleNotification(newMeeting);
  
      // If this is a follow-up meeting, update the original meeting
      if (formData.followUp && meeting?.id) {
        await update(ref(database, `users/${adminId}/meetingdetails/${meeting.id}`), {
          followUpMeetingId: meetingId
        });
      }
  
      toast.success(meeting ? 'Meeting updated successfully' : 'Meeting scheduled successfully');
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast.error('Failed to save meeting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] neuro border-none max-h-[90vh] overflow-y-auto">
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
                min={new Date().toISOString().split('T')[0]}
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
              {suggestedTimes.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Suggested times: {suggestedTimes.map(time => (
                    <span 
                      key={time} 
                      className="cursor-pointer text-blue-500 hover:underline mr-2"
                      onClick={() => handleTimeSuggestionClick(time)}
                    >
                      {time}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select 
                value={formData.duration?.toString() || '30'}
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
                value={formData.reminder || '15min'}
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
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status || 'scheduled'}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger className="neuro-inset focus:shadow-none">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Recurring meeting options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isRecurring"
                checked={formData.isRecurring || false}
                onCheckedChange={(checked) => setFormData({...formData, isRecurring: Boolean(checked)})}
              />
              <label htmlFor="isRecurring" className="text-sm font-medium leading-none">
                Recurring Meeting
              </label>
            </div>
            
            {formData.isRecurring && (
              <div className="pl-6 space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="recurrencePattern">Recurrence Pattern</Label>
                  <Select 
                    value={formData.recurrencePattern || 'weekly'}
                    onValueChange={(value) => handleSelectChange('recurrencePattern', value)}
                  >
                    <SelectTrigger className="neuro-inset focus:shadow-none">
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recurrenceEndDate">End Date</Label>
                  <Input
                    id="recurrenceEndDate"
                    name="recurrenceEndDate"
                    type="date"
                    className="neuro-inset focus:shadow-none"
                    value={formData.recurrenceEndDate || ''}
                    onChange={handleChange}
                    min={formData.startDate}
                    required={formData.isRecurring}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Follow-up meeting option */}
          {meeting && !meeting.followUp && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="followUp"
                  checked={formData.followUp || false}
                  onCheckedChange={(checked) => setFormData({...formData, followUp: Boolean(checked)})}
                />
                <label htmlFor="followUp" className="text-sm font-medium leading-none">
                  Schedule as Follow-up Meeting
                </label>
              </div>
            </div>
          )}
          
          {(isAdmin || agentId) && (
            <div className="space-y-2">
              <Label htmlFor="participants">Participants</Label>
              <div className="relative">
                <Select
                  open={isDropdownOpen}
                  onOpenChange={setIsDropdownOpen}
                >
                  <SelectTrigger 
                    className="neuro-inset focus:shadow-none w-full"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <SelectValue placeholder={`${selectedAgents.length} participant(s) selected`} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {isLoading ? (
                      <div className="text-center text-sm text-muted-foreground p-2">Loading agents...</div>
                    ) : availableAgents.length > 0 ? (
                      availableAgents.map(agent => (
                        <div 
                          key={agent.id} 
                          className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAgentToggle(agent.id);
                          }}
                        >
                          <Checkbox 
                            id={`agent-${agent.id}`} 
                            checked={selectedAgents.includes(agent.id)}
                            onCheckedChange={() => {}}
                            disabled={!isAdmin && agent.id === user?.id && selectedAgents.length <= 1}
                          />
                          <label htmlFor={`agent-${agent.id}`} className="text-sm cursor-pointer">
                            {agent.firstName} {agent.lastName} ({agent.email})
                            {agent.id === user?.id && " (You)"}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-muted-foreground p-2">No agents available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {selectedAgents.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Selected: {selectedAgents.map(id => {
                    const agent = availableAgents.find(a => a.id === id);
                    return agent ? `${agent.firstName} ${agent.lastName}` : '';
                  }).filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          )}
          
          {/* Show scheduling conflicts if any */}
          {conflicts.length > 0 && (
            <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-md">
              <h4 className="font-medium text-yellow-800">Scheduling Conflicts Detected</h4>
              <ul className="mt-2 text-sm text-yellow-700">
                {conflicts.map(({agentId, conflicts}) => {
                  const agent = availableAgents.find(a => a.id === agentId);
                  return (
                    <li key={agentId}>
                      {agent?.firstName} {agent?.lastName} has conflicts:
                      <ul className="ml-4 list-disc">
                        {conflicts.map(conflict => (
                          <li key={conflict.id}>
                            {conflict.title} at {conflict.startTime} ({conflict.duration} mins)
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button"
              variant="outline"
              onClick={onClose}
              className="neuro hover:shadow-none transition-all duration-300"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="neuro hover:shadow-none transition-all duration-300"
              disabled={isLoading || (!isAdmin && selectedAgents.length === 0)}
            >
              {isLoading ? (meeting ? 'Updating...' : 'Scheduling...') : (meeting ? 'Update Meeting' : 'Schedule Meeting')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
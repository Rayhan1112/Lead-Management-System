
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { mockMeetings } from '@/lib/mockData';
import { format, isToday, addDays } from 'date-fns';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Filter upcoming meetings for notifications
  const upcomingMeetings = mockMeetings
    .filter(meeting => {
      const meetingDate = new Date(meeting.startDate);
      return isToday(meetingDate) || (meetingDate > new Date() && meetingDate <= addDays(new Date(), 3));
    })
    .slice(0, 5);
  
  const hasNotifications = upcomingMeetings.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-muted-foreground hover:text-foreground relative"
        >
          <Bell size={20} />
          {hasNotifications && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="bg-background rounded-md shadow-md">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium">Notifications</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {upcomingMeetings.length > 0 ? (
              <div className="divide-y divide-border">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="p-4 hover:bg-muted transition-colors">
                    <div className="flex items-start">
                      <div className="h-8 w-8 rounded-full bg-pulse text-white flex items-center justify-center mr-3">
                        <span className="text-xs font-bold">
                          {meeting.title.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {isToday(new Date(meeting.startDate)) 
                            ? `Today at ${meeting.startTime}`
                            : `${format(new Date(meeting.startDate), 'MMM d')} at ${meeting.startTime}`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reminder: {meeting.reminder} before
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No new notifications
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-border">
            <Button 
              variant="ghost" 
              className="w-full text-sm h-9" 
              onClick={() => setIsOpen(false)}
            >
              Mark all as read
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

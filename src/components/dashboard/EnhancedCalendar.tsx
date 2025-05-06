
import React, { useState } from 'react';
import { format, startOfToday, eachDayOfInterval, endOfMonth, startOfMonth, isToday, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { mockMeetings } from '@/lib/mockData';

export const EnhancedCalendar: React.FC = () => {
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showMeetings, setShowMeetings] = useState(false);
  
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Get meetings for the day
  const getMeetingsForDate = (date: Date) => {
    return mockMeetings.filter(meeting => meeting.startDate === format(date, 'yyyy-MM-dd'));
  };

  const handleDayClick = (date: Date) => {
    const meetings = getMeetingsForDate(date);
    if (meetings.length > 0) {
      setSelectedDate(date);
      setShowMeetings(true);
    }
  };

  const selectedDateMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

  return (
    <>
      <div className="neuro p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Calendar</h2>
          <div className="flex space-x-1">
            <Button 
              onClick={previousMonth}
              size="icon"
              variant="ghost"
              className="h-8 w-8"
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="text-sm font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <Button 
              onClick={nextMonth}
              size="icon"
              variant="ghost"
              className="h-8 w-8"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs font-medium text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const meetings = getMeetingsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const hasMeetings = meetings.length > 0;
            
            return (
              <div
                key={day.toString()}
                className={cn(
                  "aspect-square p-1 relative",
                  !isCurrentMonth && "opacity-30",
                )}
              >
                <div
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "h-full w-full flex flex-col items-center justify-start p-1 text-xs rounded-md cursor-pointer transition-all duration-200 hover:bg-muted/50",
                    isToday(day) && "bg-pulse/10 font-bold",
                    hasMeetings && "ring-1 ring-pulse"
                  )}
                >
                  <span className="mb-1">{format(day, 'd')}</span>
                  {hasMeetings && (
                    <div className="w-full mt-auto">
                      <div className="bg-pulse text-white text-[10px] rounded px-1 py-0.5 truncate">
                        {meetings.length} {meetings.length === 1 ? 'meeting' : 'meetings'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={showMeetings} onOpenChange={setShowMeetings}>
        <DialogContent className="sm:max-w-[500px] neuro border-none">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && `Meetings on ${format(selectedDate, 'MMMM d, yyyy')}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedDateMeetings.map((meeting) => (
              <div key={meeting.id} className="neuro p-3 space-y-2">
                <h3 className="font-medium">{meeting.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Time: {meeting.startTime} ({meeting.duration} mins)
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    meeting.status === 'scheduled' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' 
                      : meeting.status === 'ongoing'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                      : meeting.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>{meeting.status}</span>
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

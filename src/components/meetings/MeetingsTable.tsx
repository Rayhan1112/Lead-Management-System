
import React, { useState } from 'react';
import { Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { mockMeetings, Meeting, mockAgents } from '@/lib/mockData';
import { MeetingForm } from './MeetingForm';
import { useIsMobile } from '@/hooks/use-mobile';

export const MeetingsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [meetings, setMeetings] = useState(mockMeetings);
  const [isAddingMeeting, setIsAddingMeeting] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const isMobile = useIsMobile();

  const filteredMeetings = meetings.filter(meeting => {
    return meeting.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = (id: string) => {
    setMeetings(meetings.filter(meeting => meeting.id !== id));
    toast.success('Meeting deleted successfully');
  };

  const handleAddMeeting = (newMeeting: Meeting) => {
    setMeetings([newMeeting, ...meetings]);
    setIsAddingMeeting(false);
    setSelectedMeeting(null);
    toast.success('Meeting scheduled successfully');
  };

  const handleEdit = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsAddingMeeting(true);
  };

  const getParticipantNames = (participantIds: string[]): string[] => {
    return participantIds.map(id => {
      const agent = mockAgents.find(a => a.id === id);
      return agent ? agent.name : 'Unknown';
    });
  };

  const getStatusClassName = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center mb-4">
        <Button 
          onClick={() => {
            setSelectedMeeting(null);
            setIsAddingMeeting(true);
          }}
          className="neuro hover:shadow-none transition-all duration-300 w-full sm:w-auto"
        >
          Schedule Meeting
        </Button>
        
        <Input
          placeholder="Search meetings..."
          className="neuro-inset focus:shadow-none w-full sm:w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Meetings Table - Desktop */}
      <div className="overflow-auto neuro hidden sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Title</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date & Time</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Duration</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Participants</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Reminder</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredMeetings.map((meeting) => (
              <tr key={meeting.id} className="hover:bg-muted/20">
                <td className="p-3">
                  <p className="font-medium">{meeting.title}</p>
                </td>
                <td className="p-3">{meeting.startDate} @ {meeting.startTime}</td>
                <td className="p-3">{meeting.duration} mins</td>
                <td className="p-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8">
                        <Users className="h-4 w-4 mr-1" />
                        {meeting.participants.length} participants
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-0">
                      <div className="p-4">
                        <h4 className="font-medium mb-2">Participants</h4>
                        <ul className="space-y-2">
                          {getParticipantNames(meeting.participants).map((name, idx) => (
                            <li key={idx} className="text-sm flex items-center">
                              <div className="w-2 h-2 rounded-full bg-pulse mr-2"></div>
                              {name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </PopoverContent>
                  </Popover>
                </td>
                <td className="p-3">{meeting.reminder}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    getStatusClassName(meeting.status)
                  }`}>
                    {meeting.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(meeting)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(meeting.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Meetings Cards - Mobile */}
      <div className="sm:hidden space-y-4">
        {filteredMeetings.map((meeting) => (
          <div key={meeting.id} className="neuro p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">{meeting.title}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                getStatusClassName(meeting.status)
              }`}>
                {meeting.status}
              </span>
            </div>
            
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <div>Date & Time:</div>
                <div className="font-medium">{meeting.startDate} @ {meeting.startTime}</div>
              </div>
              
              <div className="flex justify-between text-sm">
                <div>Duration:</div>
                <div className="font-medium">{meeting.duration} mins</div>
              </div>
              
              <div className="flex justify-between text-sm">
                <div>Reminder:</div>
                <div className="font-medium">{meeting.reminder}</div>
              </div>
            </div>
            
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {meeting.participants.length} participants
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0">
                  <div className="p-4">
                    <h4 className="font-medium mb-2">Participants</h4>
                    <ul className="space-y-2">
                      {getParticipantNames(meeting.participants).map((name, idx) => (
                        <li key={idx} className="text-sm flex items-center">
                          <div className="w-2 h-2 rounded-full bg-pulse mr-2"></div>
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="mt-3 pt-3 border-t flex justify-end space-x-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleEdit(meeting)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600"
                onClick={() => handleDelete(meeting.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Meeting Form Dialog */}
      <MeetingForm 
        isOpen={isAddingMeeting} 
        onClose={() => {
          setIsAddingMeeting(false);
          setSelectedMeeting(null);
        }} 
        onSubmit={handleAddMeeting}
        meeting={selectedMeeting}
      />
    </div>
  );
};

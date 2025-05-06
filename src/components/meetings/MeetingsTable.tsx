
import React, { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { mockMeetings, Meeting } from '@/lib/mockData';
import { MeetingForm } from './MeetingForm';

export const MeetingsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [meetings, setMeetings] = useState(mockMeetings);
  const [isAddingMeeting, setIsAddingMeeting] = useState(false);

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
    toast.success('Meeting scheduled successfully');
  };

  const handleEdit = (meeting: Meeting) => {
    toast.info(`Edit functionality for meeting ${meeting.title} coming soon`);
  };

  return (
    <div className="space-y-4">
      {/* Actions and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <Button 
          onClick={() => setIsAddingMeeting(true)}
          className="neuro hover:shadow-none transition-all duration-300"
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

      {/* Meetings Table */}
      <div className="overflow-auto neuro">
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
                <td className="p-3">{meeting.participants.length} participants</td>
                <td className="p-3">{meeting.reminder}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    meeting.status === 'scheduled' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' 
                      : meeting.status === 'ongoing'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                      : meeting.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
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

      {/* Meeting Form Dialog */}
      <MeetingForm isOpen={isAddingMeeting} onClose={() => setIsAddingMeeting(false)} onSubmit={handleAddMeeting} />
    </div>
  );
};

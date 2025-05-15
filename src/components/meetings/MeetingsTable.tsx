import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Users, Phone, Mail, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { MeetingForm } from './MeetingForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { database } from '../../firebase';
import { ref, onValue, off, remove, get, update } from 'firebase/database';
import { useAuth } from '@/context/AuthContext';

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
}

interface Agent {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export const MeetingsTable: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isAddingMeeting, setIsAddingMeeting] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [meetingsPerPage] = useState(10);
  const isMobile = useIsMobile();
  const adminId = localStorage.getItem('adminkey');
  const agentId = localStorage.getItem('agentkey');

  useEffect(() => {
    const fetchMeetings = () => {
      let meetingsRef;
      
      if (isAdmin && adminId) {
        meetingsRef = ref(database, `users/${adminId}/meetingdetails`);
      } else if (agentId && adminId) {
        meetingsRef = ref(database, `users/${adminId}/agents/${agentId}/meetingdetails`);
      } else {
        return;
      }

      onValue(meetingsRef, (snapshot) => {
        const meetingsData: Meeting[] = [];
        snapshot.forEach((childSnapshot) => {
          const meeting = {
            id: childSnapshot.key!,
            ...childSnapshot.val()
          };
          meetingsData.push(meeting);
        });
        setMeetings(meetingsData);
      });

      return () => off(meetingsRef);
    };

    const fetchAgents = () => {
      if (!adminId) return;
      
      const agentsRef = isAdmin 
        ? ref(database, `users/${adminId}/agents`)
        : ref(database, `users/${adminId}/agents/${agentId}`);
      
      onValue(agentsRef, (snapshot) => {
        if (isAdmin) {
          const agentsData: Agent[] = [];
          snapshot.forEach((childSnapshot) => {
            agentsData.push({
              id: childSnapshot.key!,
              ...childSnapshot.val()
            });
          });
          setAgents(agentsData);
        } else {
          if (snapshot.exists()) {
            setAgents([{
              id: snapshot.key!,
              ...snapshot.val()
            }]);
          }
        }
      });

      return () => off(agentsRef);
    };

    fetchMeetings();
    fetchAgents();
  }, [isAdmin, adminId, agentId]);

  const filteredMeetings = meetings.filter(meeting => {
    return meeting.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const indexOfLastMeeting = currentPage * meetingsPerPage;
  const indexOfFirstMeeting = indexOfLastMeeting - meetingsPerPage;
  const currentMeetings = filteredMeetings.slice(indexOfFirstMeeting, indexOfLastMeeting);
  const totalPages = Math.ceil(filteredMeetings.length / meetingsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      const meetingToDelete = meetings.find(m => m.id === id);
      if (!meetingToDelete) return;

      if (isAdmin && adminId) {
        await remove(ref(database, `users/${adminId}/meetingdetails/${id}`));

        if (meetingToDelete.participants?.length > 0) {
          const updates: Record<string, null> = {};
          meetingToDelete.participants.forEach(agentId => {
            updates[`users/${adminId}/agents/${agentId}/meetingdetails/${id}`] = null;
          });
          await update(ref(database), updates);
        }
      } else if (agentId && adminId) {
        await remove(ref(database, `users/${adminId}/agents/${agentId}/meetingdetails/${id}`));

        const adminMeetingRef = ref(database, `users/${adminId}/meetingdetails`);
        const snapshot = await get(adminMeetingRef);
        if (snapshot.exists()) {
          snapshot.forEach(child => {
            if (child.val().agentId === agentId && child.val().id === id) {
              remove(ref(database, `users/${adminId}/meetingdetails/${child.key}`));
            }
          });
        }
      }

      toast.success('Meeting deleted successfully');
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error('Failed to delete meeting');
    }
  };

  const handleEdit = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsAddingMeeting(true);
  };

  const handleCall = (participantId: string) => {
    const participant = agents.find(a => a.id === participantId);
    if (participant?.phone) {
      window.open(`tel:${participant.phone}`, '_blank');
    } else {
      toast.warning('No phone number available for this participant');
    }
  };

  const handleEmail = (participantId: string) => {
    const participant = agents.find(a => a.id === participantId);
    if (participant?.email) {
      window.open(`mailto:${participant.email}?subject=Regarding our meeting`, '_blank');
    } else {
      toast.warning('No email available for this participant');
    }
  };

  const handleWhatsApp = (participantId: string) => {
    const participant = agents.find(a => a.id === participantId);
    if (participant?.phone) {
      const phone = participant.phone.startsWith('+') ? participant.phone : `+${participant.phone}`;
      window.open(`https://wa.me/${phone}`, '_blank');
    } else {
      toast.warning('No phone number available for WhatsApp');
    }
  };

  const getParticipantNames = (participantIds: string[]): {id: string, name: string, phone?: string, email?: string}[] => {
    if (!agents || agents.length === 0) return [{id: 'loading', name: 'Loading...'}];
    
    return participantIds.map(id => {
      const agent = agents.find(a => a.id === id);
      if (!agent) return {id, name: 'Unknown'};
      
      const firstName = agent.firstName || '';
      const lastName = agent.lastName || '';
      return {
        id,
        name: `${firstName} ${lastName}`.trim() || agent.email || 'Unnamed Participant',
        phone: agent.phone,
        email: agent.email
      };
    });
  };

  const getStatusClassName = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
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
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center mb-4">
        <Button 
          onClick={() => {
            setSelectedMeeting(null);
            setIsAddingMeeting(true);
          }}
          className="neuro hover:shadow-none transition-all duration-300 w-full sm:w-auto"
          disabled={!user}
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

      {filteredMeetings.length > 0 ? (
        <>
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
                {currentMeetings.map((meeting) => (
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
                            {meeting.participants?.length || 0} participants
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-0">
                          <div className="p-4">
                            <h4 className="font-medium mb-2">Participants</h4>
                            <ul className="space-y-2">
                              {getParticipantNames(meeting.participants || []).map((participant) => (
                                <li key={participant.id} className="text-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 rounded-full bg-pulse mr-2"></div>
                                      {participant.name}
                                    </div>
                                    <div className="flex space-x-1">
                                      {participant.phone && (
                                        <>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 text-blue-500 hover:text-blue-600"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCall(participant.id);
                                            }}
                                            title="Call"
                                          >
                                            <Phone className="h-3 w-3" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 text-green-600 hover:text-green-700"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleWhatsApp(participant.id);
                                            }}
                                            title="WhatsApp"
                                          >
                                            <MessageSquare className="h-3 w-3" />
                                          </Button>
                                        </>
                                      )}
                                      {participant.email && (
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 text-green-500 hover:text-green-600"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEmail(participant.id);
                                          }}
                                          title="Email"
                                        >
                                          <Mail className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
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
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(meeting.id)}
                          title="Delete"
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

          <div className="sm:hidden space-y-4">
            {currentMeetings.map((meeting) => (
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
                
                <div className="mt-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs w-full justify-start">
                        <Users className="h-3 w-3 mr-1" />
                        {meeting.participants?.length || 0} participants
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-0">
                      <div className="p-4">
                        <h4 className="font-medium mb-2">Participants</h4>
                        <ul className="space-y-2">
                          {getParticipantNames(meeting.participants || []).map((participant) => (
                            <li key={participant.id} className="text-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 rounded-full bg-pulse mr-2"></div>
                                  {participant.name}
                                </div>
                                <div className="flex space-x-1">
                                  {participant.phone && (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 text-blue-500 hover:text-blue-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCall(participant.id);
                                        }}
                                        title="Call"
                                      >
                                        <Phone className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 text-green-600 hover:text-green-700"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleWhatsApp(participant.id);
                                        }}
                                        title="WhatsApp"
                                      >
                                        <MessageSquare className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                  {participant.email && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 text-green-500 hover:text-green-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEmail(participant.id);
                                      }}
                                      title="Email"
                                    >
                                      <Mail className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
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
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(meeting.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination controls - always shown */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {indexOfFirstMeeting + 1}-{Math.min(indexOfLastMeeting, filteredMeetings.length)} of {filteredMeetings.length} meetings
            </div>
            
            {totalPages > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1 || totalPages <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <Button
                    key={number}
                    variant={currentPage === number ? "default" : "outline"}
                    size="sm"
                    onClick={() => paginate(number)}
                    className="h-8 w-8 p-0"
                    disabled={totalPages <= 1}
                  >
                    {number}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages || totalPages <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="neuro p-8 text-center rounded-lg">
          <p className="text-muted-foreground">No meetings found. Schedule your first meeting!</p>
        </div>
      )}

      <MeetingForm 
        isOpen={isAddingMeeting} 
        onClose={() => {
          setIsAddingMeeting(false);
          setSelectedMeeting(null);
        }} 
        onSubmit={() => {
          setIsAddingMeeting(false);
          setSelectedMeeting(null);
          toast.success(selectedMeeting ? 'Meeting updated successfully' : 'Meeting scheduled successfully');
        }}
        meeting={selectedMeeting}
      />
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Edit, 
  Trash2, 
  Plus,
  User,
  Briefcase,
  Calendar,
  Smartphone,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { AgentForm } from './AgentForm';
import { database } from '../../firebase';
import { ref, onValue, remove } from 'firebase/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  status: 'active' | 'inactive';
  avatar?: string;
  birthDate?: string;
  assignedLeads?: {
    from: number;
    to: number;
  };
  createdAt?: string;
  lastUpdated?: string;
}

export const AgentCards: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [viewingAgent, setViewingAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [agentsPerPage] = useState(8); // Show 8 agents per page

  useEffect(() => {
    const fetchAgents = () => {
      try {
        const adminKey = localStorage.getItem('adminkey');
        if (!adminKey) {
          toast.error('User not authenticated');
          setLoading(false);
          return;
        }

        const agentsRef = ref(database, `users/${adminKey}/agents`);
        
        const unsubscribe = onValue(agentsRef, (snapshot) => {
          const agentsData = snapshot.val();
          if (agentsData) {
            const agentsArray = Object.entries(agentsData).map(([id, agent]: [string, any]) => ({
              id,
              ...agent,
              assignedLeads: agent.assignedLeads ? {
                from: agent.assignedLeads.from || 0,
                to: agent.assignedLeads.to || 0
              } : undefined
            }));
            setAgents(agentsArray);
          } else {
            setAgents([]);
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching agents:', error);
        toast.error('Failed to fetch agents');
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Filter agents based on search term
  const filteredAgents = agents.filter(agent => {
    return agent?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           agent?.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get current agents for pagination
  const indexOfLastAgent = currentPage * agentsPerPage;
  const indexOfFirstAgent = indexOfLastAgent - agentsPerPage;
  const currentAgents = filteredAgents.slice(indexOfFirstAgent, indexOfLastAgent);
  const totalPages = Math.ceil(filteredAgents.length / agentsPerPage);

  // Change page
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

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      const adminKey = localStorage.getItem('adminkey');
      if (!adminKey) {
        toast.error('User not authenticated');
        return;
      }

      const agentRef = ref(database, `users/${adminKey}/agents/${id}`);
      await remove(agentRef);
      toast.success('Agent removed successfully');
      setViewingAgent(null);
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to remove agent');
    }
  };

  const handleContactAction = (type: string, agent: Agent) => {
    switch (type) {
      case 'call':
        window.open(`tel:${agent.phone}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:${agent.email}`, '_blank');
        break;
      case 'whatsapp':
        const phoneNumber = agent.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phoneNumber}`, '_blank');
        break;
      default:
        break;
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setViewingAgent(null);
  };

  const handleAddAgent = () => {
    setIsAddingAgent(false);
    toast.success('Agent added successfully');
  };

  const handleUpdateAgent = () => {
    setEditingAgent(null);
    toast.success('Agent updated successfully');
  };

  const handleCardClick = (agent: Agent) => {
    setViewingAgent(agent);
  };

  const navigateAgent = (direction: 'prev' | 'next') => {
    if (!viewingAgent) return;
    
    const currentIndex = filteredAgents.findIndex(a => a.id === viewingAgent.id);
    if (currentIndex === -1) return;

    if (direction === 'prev' && currentIndex > 0) {
      setViewingAgent(filteredAgents[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < filteredAgents.length - 1) {
      setViewingAgent(filteredAgents[currentIndex + 1]);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading agents...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Actions and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <Button 
          onClick={() => setIsAddingAgent(true)}
          className="neuro hover:shadow-none transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
        
        <Input
          placeholder="Search agents..."
          className="neuro-inset focus:shadow-none w-full sm:w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Agent Cards */}
      {filteredAgents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No agents found</p>
          <Button 
            onClick={() => setIsAddingAgent(true)}
            className="mt-4 neuro hover:shadow-none transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Agent
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentAgents.map((agent) => (
              <div 
                key={agent.id} 
                className="neuro p-4 space-y-4 cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleCardClick(agent)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={agent.avatar} alt={agent.name} />
                      <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.designation}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    agent.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">{agent.email}</p>
                  <p className="text-sm text-muted-foreground">{agent.phone}</p>
                </div>

                {agent.assignedLeads && (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">
                      Leads: {agent.assignedLeads.from} - {agent.assignedLeads.to}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination controls - always shown */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {indexOfFirstAgent + 1}-{Math.min(indexOfLastAgent, filteredAgents.length)} of {filteredAgents.length} agents
            </div>
            
            {totalPages > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
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
                  >
                    {number}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Agent Details Dialog */}
      <Dialog open={!!viewingAgent} onOpenChange={(open) => !open && setViewingAgent(null)}>
        <DialogContent className="sm:max-w-[600px] neuro border-none max-h-[90vh] overflow-y-auto">
          {viewingAgent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateAgent('prev');
                      }}
                      disabled={filteredAgents.findIndex(a => a.id === viewingAgent.id) === 0}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span>Agent Details</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateAgent('next');
                      }}
                      disabled={filteredAgents.findIndex(a => a.id === viewingAgent.id) === filteredAgents.length - 1}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-red-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(viewingAgent.id);
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={viewingAgent.avatar} alt={viewingAgent.name} />
                    <AvatarFallback>{viewingAgent.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold">{viewingAgent.name}</h2>
                    <p className="text-lg text-muted-foreground">{viewingAgent.designation}</p>
                    <div className="flex items-center justify-center sm:justify-start mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        viewingAgent.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {viewingAgent.status === 'active' ? (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1" />
                        )}
                        {viewingAgent.status.charAt(0).toUpperCase() + viewingAgent.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p>{viewingAgent.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Smartphone className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p>{viewingAgent.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Briefcase className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Designation</p>
                        <p>{viewingAgent.designation}</p>
                      </div>
                    </div>
                    {viewingAgent.birthDate && (
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Birth Date</p>
                          <p>{new Date(viewingAgent.birthDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {viewingAgent.assignedLeads && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Performance</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {viewingAgent.assignedLeads.from} - {viewingAgent.assignedLeads.to}
                        </p>
                        <p className="text-sm text-muted-foreground">Assigned Leads Range</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {viewingAgent.assignedLeads.to - viewingAgent.assignedLeads.from}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Leads</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">-</p>
                        <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(viewingAgent);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Agent
                  </Button>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactAction('call', viewingAgent);
                      }}
                      title="Call"
                    >
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactAction('email', viewingAgent);
                      }}
                      title="Email"
                    >
                      <Mail className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactAction('whatsapp', viewingAgent);
                      }}
                      title="WhatsApp"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Agent Form Dialogs */}
      <AgentForm 
        isOpen={isAddingAgent} 
        onClose={() => setIsAddingAgent(false)} 
        onSubmit={handleAddAgent} 
      />
      
      <AgentForm 
        isOpen={!!editingAgent} 
        onClose={() => setEditingAgent(null)} 
        onSubmit={handleUpdateAgent} 
        agent={editingAgent || undefined}
      />
    </div>
  );
};
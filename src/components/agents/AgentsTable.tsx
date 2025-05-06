
import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { mockAgents, Agent } from '@/lib/mockData';
import { AgentForm } from './AgentForm';

export const AgentsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [agents, setAgents] = useState(mockAgents);
  const [isAddingAgent, setIsAddingAgent] = useState(false);

  const filteredAgents = agents.filter(agent => {
    return agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           agent.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = (id: string) => {
    setAgents(agents.filter(agent => agent.id !== id));
    toast.success('Agent deleted successfully');
  };

  const handleAddAgent = (newAgent: Agent) => {
    setAgents([newAgent, ...agents]);
    setIsAddingAgent(false);
    toast.success('Agent added successfully');
  };

  const handleAction = (type: string, agent: Agent) => {
    switch (type) {
      case 'call':
        toast.success(`Calling ${agent.name} at ${agent.phone}`);
        break;
      case 'email':
        toast.success(`Composing email to ${agent.name} at ${agent.email}`);
        break;
      case 'whatsapp':
        toast.success(`Opening WhatsApp for ${agent.name}`);
        break;
      case 'edit':
        toast.info(`Edit functionality for ${agent.name} coming soon`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <Button 
          onClick={() => setIsAddingAgent(true)}
          className="neuro hover:shadow-none transition-all duration-300"
        >
          Add Agent
        </Button>
        
        <Input
          placeholder="Search agents..."
          className="neuro-inset focus:shadow-none w-full sm:w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Agents Table */}
      <div className="overflow-auto neuro">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Role</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Leads</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Joined</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredAgents.map((agent) => (
              <tr key={agent.id} className="hover:bg-muted/20">
                <td className="p-3">
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-muted-foreground">{agent.email}</p>
                  </div>
                </td>
                <td className="p-3 capitalize">{agent.role}</td>
                <td className="p-3">{agent.assignedLeads}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    agent.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {agent.status}
                  </span>
                </td>
                <td className="p-3">{agent.createdAt}</td>
                <td className="p-3">
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleAction('call', agent)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleAction('email', agent)}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleAction('whatsapp', agent)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleAction('edit', agent)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(agent.id)}
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

      {/* Agent Form Dialog */}
      <AgentForm isOpen={isAddingAgent} onClose={() => setIsAddingAgent(false)} onSubmit={handleAddAgent} />
    </div>
  );
};

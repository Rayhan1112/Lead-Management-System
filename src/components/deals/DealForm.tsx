import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { database } from '../../firebase';
import { ref, set, push, onValue, off } from 'firebase/database';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { decryptObject } from '@/lib/utils';

interface Deal {
  id: string;
  name: string;
  leadId: string;
  leadName: string;
  agentId: string;
  agentName: string;
  amount: number;
  status: 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  createdAt: string;
  closingDate: string;
  company: string;
  description?: string;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  status: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface DealFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deal: Deal) => void;
  deal?: Deal | null;
  isLoading?: boolean;
}

export const DealForm: React.FC<DealFormProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  deal,
  isLoading = false 
}) => {
  const { user } = useAuth();
  const adminId = localStorage.getItem('adminkey');
  const agentId = localStorage.getItem('agentkey');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Deal>>(
    deal || {
      name: '',
      leadId: '',
      leadName: '',
      agentId: '',
      agentName: '',
      amount: 0,
      status: 'proposal',
      closingDate: '',
      company: '',
      description: ''
    }
  );

  // Reset form when opening/closing or when deal prop changes
  useEffect(() => {
    if (isOpen) {
      setFormData(
        deal || {
          name: '',
          leadId: '',
          leadName: '',
          agentId: '',
          agentName: '',
          amount: 0,
          status: 'proposal',
          closingDate: '',
          company: '',
          description: ''
        }
      );
      setSearchTerm('');
    }
  }, [isOpen, deal]);

  // Fetch leads from Firebase
  useEffect(() => {
    if (!adminId || !isOpen) return;
  
    const leadsRef = ref(database, `users/${adminId}/leads`);
    
    const fetchLeads = () => {
      onValue(leadsRef, async (snapshot) => {
        const leadsData: Lead[] = [];
        
        // Gather all leads from snapshot
        snapshot.forEach((childSnapshot) => {
          leadsData.push({
            id: childSnapshot.key || '',
            ...childSnapshot.val()
          });
        });
  
        // Decrypt all lead objects asynchronously
        const decryptedLeads = await Promise.all(
          leadsData.map(async (lead) => {
            const decryptedLead = await decryptObject(lead);
            return decryptedLead;
          })
        );
  
        setLeads(decryptedLeads);
      });
    };
  
    fetchLeads();
  
    return () => {
      off(leadsRef);
    };
  }, [adminId, isOpen]);
  

  // Fetch agents from Firebase
  useEffect(() => {
    if (!adminId || !isOpen) return;

    const agentsRef = ref(database, `users/${adminId}/agents`);
    
    const fetchAgents = () => {
      onValue(agentsRef, (snapshot) => {
        const agentsData: Agent[] = [];
        snapshot.forEach((childSnapshot) => {
          agentsData.push({
            id: childSnapshot.key || '',
            ...childSnapshot.val()
          });
        });
        setAgents(agentsData);
      });
    };

    fetchAgents();

    return () => {
      off(agentsRef);
    };
  }, [adminId, isOpen]);

  const filteredLeads = leads.filter(lead => {
    return (
      lead?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead?.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.name === 'amount' ? parseFloat(e.target.value) || 0 : e.target.value;
    
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSelectChange = (field: string, value: string) => {
    let updatedData: Partial<Deal> = { ...formData, [field]: value };

    // If selecting a lead, auto-fill the company and lead name
    if (field === 'leadId') {
      const selectedLead = leads.find(lead => lead.id === value);
      if (selectedLead) {
        updatedData = {
          ...updatedData,
          company: selectedLead.company,
          leadName: `${selectedLead.firstName} ${selectedLead.lastName}`
        };
      }
    }

    // If selecting an agent, auto-fill the agent name
    if (field === 'agentId') {
      const selectedAgent = agents.find(agent => agent.id === value);
      if (selectedAgent) {
        updatedData = {
          ...updatedData,
          agentName: selectedAgent.name
        };
      }
    }

    setFormData(updatedData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.leadId || !formData.agentId || !formData.company || !formData.closingDate) {
      toast.error('Please fill all required fields');
      return;
    }

    // Prepare the deal object
    const dealData: Deal = {
      id: deal?.id || '',
      name: formData.name || '',
      leadId: formData.leadId || '',
      leadName: formData.leadName || '',
      agentId: formData.agentId || '',
      agentName: formData.agentName || '',
      amount: formData.amount || 0,
      status: (formData.status as Deal['status']) || 'proposal',
      createdAt: deal?.createdAt || format(new Date(), 'yyyy-MM-dd'),
      closingDate: formData.closingDate || '',
      company: formData.company || '',
      description: formData.description || ''
    };

    try {
      if (deal) {
        // Update existing deal
        const dealRef = ref(database, `users/${adminId}/deals/${deal.id}`);
        await set(dealRef, dealData);
        toast.success('Deal updated successfully');
      } else {
        // Create new deal with push key
        const dealsRef = ref(database, `users/${adminId}/deals`);
        const newDealRef = push(dealsRef);
        const newDealId = newDealRef.key;
        
        // Set the ID in the deal data
        dealData.id = newDealId || '';
        
        // Write the data to the new location
        await set(newDealRef, dealData);
        toast.success('Deal created successfully');
      }

      // Call the onSubmit callback with the complete deal data
      onSubmit(dealData);
      onClose();
    } catch (error) {
      console.error('Error saving deal:', error);
      toast.error('Failed to save deal');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden neuro border-none">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
          <DialogTitle>{deal ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
        </DialogHeader>
        
        {/* Scrollable form content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-1 py-2">
          <form onSubmit={handleSubmit} className="space-y-4" id="deal-form">
            <div className="space-y-2">
              <Label htmlFor="name">Deal Name *</Label>
              <Input
                id="name"
                name="name"
                className="neuro-inset focus:shadow-none"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leadId">Lead *</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search leads..."
                    className="mb-2 neuro-inset focus:shadow-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select 
                    value={formData.leadId}
                    onValueChange={(value) => handleSelectChange('leadId', value)}
                    required
                  >
                    <SelectTrigger className="neuro-inset focus:shadow-none">
                      <SelectValue placeholder="Select lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLeads.length > 0 ? (
                        filteredLeads.map(lead => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.firstName} {lead.lastName} ({lead.email})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground px-2 py-1.5">
                          No leads found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agentId">Agent *</Label>
                <Select 
                  value={formData.agentId}
                  onValueChange={(value) => handleSelectChange('agentId', value)}
                  required
                >
                  <SelectTrigger className="neuro-inset focus:shadow-none">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.filter(a => a.status === 'active').length > 0 ? (
                      agents.filter(a => a.status === 'active').map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground px-2 py-1.5">
                        No active agents found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="neuro-inset focus:shadow-none"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                  required
                >
                  <SelectTrigger className="neuro-inset focus:shadow-none">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="closed_won">Closed Won</SelectItem>
                    <SelectItem value="closed_lost">Closed Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                name="company"
                className="neuro-inset focus:shadow-none"
                value={formData.company}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="closingDate">Expected Closing Date *</Label>
              <Input
                id="closingDate"
                name="closingDate"
                type="date"
                className="neuro-inset focus:shadow-none"
                value={formData.closingDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                className="neuro-inset focus:shadow-none"
                value={formData.description || ''}
                onChange={handleChange}
              />
            </div>
          </form>
        </div>
        
        {/* Sticky footer */}
        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
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
            form="deal-form"
            className="neuro hover:shadow-none transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {deal ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              deal ? 'Update Deal' : 'Add Deal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
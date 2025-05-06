
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Deal, mockLeads, mockAgents } from '@/lib/mockData';
import { format } from 'date-fns';

interface DealFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deal: Deal) => void;
  deal?: Deal;
}

export const DealForm: React.FC<DealFormProps> = ({ isOpen, onClose, onSubmit, deal }) => {
  const [formData, setFormData] = useState<Partial<Deal>>(
    deal || {
      name: '',
      leadId: '',
      agentId: '',
      amount: 0,
      status: 'proposal',
      closingDate: '',
      company: '', // Added company field
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.name === 'amount' ? parseFloat(e.target.value) || 0 : e.target.value;
    
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    // If selecting a lead, auto-fill the company name
    if (field === 'leadId') {
      const selectedLead = mockLeads.find(lead => lead.id === value);
      if (selectedLead) {
        setFormData(prev => ({
          ...prev,
          company: selectedLead.company
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newDeal: Deal = {
      id: deal?.id || `deal-${Date.now()}`,
      name: formData.name || '',
      leadId: formData.leadId || '',
      agentId: formData.agentId || '',
      amount: formData.amount || 0,
      status: (formData.status as Deal['status']) || 'proposal',
      createdAt: deal?.createdAt || format(new Date(), 'yyyy-MM-dd'),
      closingDate: formData.closingDate || '',
      company: formData.company || '', // Added company field
      description: formData.description // Added description field
    };
    
    onSubmit(newDeal);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] neuro border-none">
        <DialogHeader>
          <DialogTitle>{deal ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Deal Name</Label>
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
              <Label htmlFor="leadId">Lead</Label>
              <Select 
                defaultValue={formData.leadId}
                onValueChange={(value) => handleSelectChange('leadId', value)}
              >
                <SelectTrigger className="neuro-inset focus:shadow-none">
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  {mockLeads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} - {lead.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agentId">Agent</Label>
              <Select 
                defaultValue={formData.agentId}
                onValueChange={(value) => handleSelectChange('agentId', value)}
              >
                <SelectTrigger className="neuro-inset focus:shadow-none">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {mockAgents.filter(a => a.status === 'active').map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
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
              <Label htmlFor="status">Status</Label>
              <Select 
                defaultValue={formData.status}
                onValueChange={(value) => handleSelectChange('status', value)}
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
            <Label htmlFor="company">Company</Label>
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
            <Label htmlFor="closingDate">Expected Closing Date</Label>
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
              {deal ? 'Update Deal' : 'Add Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

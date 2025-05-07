
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Agent } from '@/lib/mockData';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Eye, EyeOff } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AgentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (agent: Agent) => void;
  agent?: Agent;
}

export const AgentForm: React.FC<AgentFormProps> = ({ isOpen, onClose, onSubmit, agent }) => {
  const [formData, setFormData] = useState<Partial<Agent> & { password?: string; confirmPassword?: string }>(
    agent || {
      name: '',
      email: '',
      phone: '',
      role: 'junior',
      status: 'active',
      assignedLeads: 0,
      birthDate: '',
      password: '',
      confirmPassword: ''
    }
  );
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    formData.birthDate ? new Date(formData.birthDate) : undefined
  );

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

  const handleBirthDateChange = (date?: Date) => {
    setBirthDate(date);
    if (date) {
      setFormData({
        ...formData,
        birthDate: format(date, 'yyyy-MM-dd'),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    const newAgent: Agent = {
      id: agent?.id || `agent-${Date.now()}`,
      name: formData.name || '',
      email: formData.email || '',
      phone: formData.phone || '',
      role: (formData.role as Agent['role']) || 'junior',
      status: (formData.status as Agent['status']) || 'active',
      assignedLeads: formData.assignedLeads || 0,
      birthDate: formData.birthDate || '',
      createdAt: agent?.createdAt || format(new Date(), 'yyyy-MM-dd'),
    };
    
    onSubmit(newAgent);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] neuro border-none max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agent ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              className="neuro-inset focus:shadow-none"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="neuro-inset focus:shadow-none"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                className="neuro-inset focus:shadow-none"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="birthDate">Birth Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthDate ? format(birthDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={handleBirthDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {!agent && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="neuro-inset focus:shadow-none pr-10"
                    value={formData.password}
                    onChange={handleChange}
                    required={!agent}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="neuro-inset focus:shadow-none pr-10"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!agent}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>
            </>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                defaultValue={formData.role}
                onValueChange={(value) => handleSelectChange('role', value)}
              >
                <SelectTrigger className="neuro-inset focus:shadow-none">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              {agent ? 'Update Agent' : 'Add Agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

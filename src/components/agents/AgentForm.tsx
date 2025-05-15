import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Agent } from '@/lib/mockData';
import { format, getYear, getMonth, getDate, setYear, setMonth, setDate } from 'date-fns';
import { Calendar as CalendarIcon, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { get, ref, set } from 'firebase/database';
import { database, auth } from '../../firebase';
import { toast } from 'sonner';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import PlanModal from '@/pages/PlanModel';

interface AgentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (agent: Agent) => void;
  agent?: Agent;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const generateYears = (from: number, to: number) => {
  const years = [];
  for (let i = from; i <= to; i++) {
    years.push(i);
  }
  return years;
};

export const AgentForm: React.FC<AgentFormProps> = ({ isOpen, onClose, onSubmit, agent }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<Agent> & { password?: string; confirmPassword?: string }>({
    name: '',
    email: '',
    phone: '',
    designation: '',
    status: 'active',
    assignedLeads: 0,
    birthDate: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
      const [showModal, setShowModal] = useState(false);
  

  // Initialize form with agent data if editing
  useEffect(() => {
    if (agent) {
      setFormData({
        ...agent,
        password: '',
        confirmPassword: ''
      });
      if (agent.birthDate) {
        setBirthDate(new Date(agent.birthDate));
      }
    } else {
      // Reset form for new agent
      setFormData({
        name: '',
        email: '',
        phone: '',
        designation: '',
        status: 'active',
        assignedLeads: 0,
        birthDate: '',
        password: '',
        confirmPassword: ''
      });
      setBirthDate(undefined);
    }
  }, [agent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBirthDateChange = (date?: Date) => {
    setBirthDate(date);
    if (date) {
      setFormData(prev => ({
        ...prev,
        birthDate: format(date, 'yyyy-MM-dd')
      }));
    }
  };

  const adminId = localStorage.getItem('adminKey')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!user?.id) {
      toast.error('You must be logged in to manage agents');
      return;
    }
  
    if (!agent && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
  
    if (!formData.email || !formData.name) {
      toast.error('Name and email are required');
      return;
    }
  
    if (!agent && !formData.password) {
      toast.error('Password is required for new agents');
      return;
    }
  
    setIsSubmitting(true);
    setAuthError(null);
  
    try {
      // ✅ Step 1: Check agent limit
      const agentLimitRef = ref(database, `users/${adminId}/agentLimit`);
      const agentsRef = ref(database, `users/${adminId}/agents`);
  
      const [limitSnap, agentsSnap] = await Promise.all([
        get(agentLimitRef),
        get(agentsRef),
      ]);
  
      const agentLimit = limitSnap.exists() ? Number(limitSnap.val()) : 0;
      const currentAgentCount = agentsSnap.exists() ? Object.keys(agentsSnap.val()).length : 0;
  
      if (!agent && currentAgentCount >= agentLimit) {
        setIsSubmitting(false);
        // 🔥 Show PlanModal here
        setShowModal(true);
        onClose()
        return;
      }
  
      let authUid = agent?.authUid;
  
      if (!agent) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
          );
          authUid = userCredential.user.uid;
        } catch (authError) {
          let errorMessage = 'Failed to create agent account';
          if (authError instanceof Error) {
            if (authError.message.includes('email-already-in-use')) {
              errorMessage = 'Email already exists';
            } else if (authError.message.includes('weak-password')) {
              errorMessage = 'Password should be at least 6 characters';
            } else if (authError.message.includes('invalid-email')) {
              errorMessage = 'Invalid email format';
            }
          }
          setAuthError(errorMessage);
          throw new Error(errorMessage);
        }
      }
  
      const agentId = authUid;
  
      const newAgent: Agent = {
        id: agentId,
        authUid: authUid,
        name: formData.name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        designation: formData.designation || '',
        status: (formData.status as Agent['status']) || 'active',
        assignedLeads: formData.assignedLeads || 0,
        birthDate: formData.birthDate || '',
        createdAt: agent?.createdAt || format(new Date(), 'yyyy-MM-dd'),
        lastUpdated: format(new Date(), 'yyyy-MM-dd')
      };
  
      const userAgentRef = ref(database, `users/${user.id}/agents/${agentId}`);
      await set(userAgentRef, newAgent);
  
      toast.success(`Agent ${agent ? 'updated' : 'created'} successfully`);
      onSubmit(newAgent);
      onClose();
    } catch (error) {
      console.error('Error saving agent:', error);
      if (!authError) {
        toast.error(`Failed to ${agent ? 'update' : 'create'} agent`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] neuro border-none max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agent ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
        </DialogHeader>
        {authError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
            {authError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
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
              <Label htmlFor="email">Email *</Label>
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
              <Label htmlFor="phone">Phone *</Label>
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
              <PopoverContent className="w-auto p-2" align="start">
                <div className="flex flex-col gap-3">
                  {/* Year selection */}
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newYear = getYear(birthDate || new Date()) - 1;
                        handleBirthDateChange(setYear(birthDate || new Date(), newYear));
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Select
                      value={birthDate ? getYear(birthDate).toString() : getYear(new Date()).toString()}
                      onValueChange={(value) => {
                        const newYear = parseInt(value);
                        handleBirthDateChange(setYear(birthDate || new Date(), newYear));
                      }}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {generateYears(1960, new Date().getFullYear() - 18).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newYear = getYear(birthDate || new Date()) + 1;
                        if (newYear <= new Date().getFullYear() - 18) {
                          handleBirthDateChange(setYear(birthDate || new Date(), newYear));
                        }
                      }}
                      disabled={getYear(birthDate || new Date()) >= new Date().getFullYear() - 18}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Month selection */}
                  <Select
                    value={birthDate ? getMonth(birthDate).toString() : getMonth(new Date()).toString()}
                    onValueChange={(value) => {
                      const newMonth = parseInt(value);
                      handleBirthDateChange(setMonth(birthDate || new Date(), newMonth));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={month} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Day selection */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: getDaysInMonth(
                      getYear(birthDate || new Date()),
                      getMonth(birthDate || new Date())
                    ) }, (_, i) => i + 1).map((day) => (
                      <Button
                        key={day}
                        variant={
                          birthDate && getDate(birthDate) === day ? 'default' : 'ghost'
                        }
                        size="sm"
                        onClick={() => {
                          handleBirthDateChange(setDate(birthDate || new Date(), day));
                        }}
                        className="h-8 w-8 p-0"
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {!agent && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="neuro-inset focus:shadow-none pr-10"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
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
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="neuro-inset focus:shadow-none pr-10"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
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
              <Label htmlFor="designation">Designation *</Label>
              <Input
                id="designation"
                name="designation"
                className="neuro-inset focus:shadow-none"
                value={formData.designation}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger className="neuro-inset focus:shadow-none">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button"
              variant="outline"
              onClick={onClose}
              className="neuro hover:shadow-none transition-all duration-300"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="neuro hover:shadow-none transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {agent ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                agent ? 'Update Agent' : 'Add Agent'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <PlanModal isOpen={showModal} onClose={() => setShowModal(false)} />

    </Dialog>
  );
};
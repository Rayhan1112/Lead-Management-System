
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, mockAgents } from '@/lib/mockData';

interface AssignTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Task) => void;
  task?: Task;
}

export const AssignTaskForm: React.FC<AssignTaskFormProps> = ({ isOpen, onClose, onSubmit, task }) => {
  const [formData, setFormData] = useState<Partial<Task>>(
    task || {
      title: '',
      description: '',
      agentId: '',
      agentName: '',
      startDate: '',
      endDate: '',
      status: 'pending',
      priority: 'medium',
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    if (field === 'agentId') {
      const selectedAgent = mockAgents.find(agent => agent.id === value);
      if (selectedAgent) {
        setFormData(prev => ({
          ...prev,
          agentName: selectedAgent.name,
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTask: Task = {
      id: task?.id || `task-${Date.now()}`,
      title: formData.title || '',
      description: formData.description || '',
      agentId: formData.agentId || '',
      agentName: formData.agentName || '',
      startDate: formData.startDate || '',
      endDate: formData.endDate || '',
      status: (formData.status as Task['status']) || 'pending',
      priority: (formData.priority as 'high' | 'medium' | 'low') || 'medium',
    };
    
    onSubmit(newTask);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] neuro border-none">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task Assignment' : 'Assign New Task'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              name="title"
              className="neuro-inset focus:shadow-none"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Task Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              className="neuro-inset focus:shadow-none"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agent">Assign To</Label>
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                className="neuro-inset focus:shadow-none"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                className="neuro-inset focus:shadow-none"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                defaultValue={formData.priority}
                onValueChange={(value) => handleSelectChange('priority', value)}
              >
                <SelectTrigger className="neuro-inset focus:shadow-none">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
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
              {task ? 'Update Task' : 'Assign Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

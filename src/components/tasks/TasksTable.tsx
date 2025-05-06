
import React, { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { mockTasks, Task } from '@/lib/mockData';
import { AssignTaskForm } from './AssignTaskForm';

export const TasksTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tasks, setTasks] = useState(mockTasks);
  const [isAddingTask, setIsAddingTask] = useState(false);

  const filteredTasks = tasks.filter(task => {
    return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           task.agentName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    toast.success('Task deleted successfully');
  };

  const handleAddTask = (newTask: Task) => {
    setTasks([newTask, ...tasks]);
    setIsAddingTask(false);
    toast.success('Task assigned successfully');
  };

  const handleEdit = (task: Task) => {
    toast.info(`Edit functionality for task ${task.title} coming soon`);
  };

  return (
    <div className="space-y-4">
      {/* Actions and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <Button 
          onClick={() => setIsAddingTask(true)}
          className="neuro hover:shadow-none transition-all duration-300"
        >
          Assign Task
        </Button>
        
        <Input
          placeholder="Search tasks..."
          className="neuro-inset focus:shadow-none w-full sm:w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tasks Table */}
      <div className="overflow-auto neuro">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Task</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Assigned To</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Start Date</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">End Date</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredTasks.map((task) => (
              <tr key={task.id} className="hover:bg-muted/20">
                <td className="p-3">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                      {task.description}
                    </p>
                  </div>
                </td>
                <td className="p-3">{task.agentName}</td>
                <td className="p-3">{task.startDate}</td>
                <td className="p-3">{task.endDate}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    task.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' 
                      : task.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(task)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(task.id)}
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

      {/* Task Form Dialog */}
      <AssignTaskForm isOpen={isAddingTask} onClose={() => setIsAddingTask(false)} onSubmit={handleAddTask} />
    </div>
  );
};

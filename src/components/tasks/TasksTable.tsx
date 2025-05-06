
import React, { useState } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { mockTasks, Task } from '@/lib/mockData';
import { AssignTaskForm } from './AssignTaskForm';
import { ReassignTaskForm } from './ReassignTaskForm';
import { useIsMobile } from '@/hooks/use-mobile';

export const TasksTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tasks, setTasks] = useState(mockTasks);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isReassigningTask, setIsReassigningTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const isMobile = useIsMobile();

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
    setSelectedTask(task);
    setIsAddingTask(true);
  };

  const handleReassign = (task: Task) => {
    setSelectedTask(task);
    setIsReassigningTask(true);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    setIsAddingTask(false);
    setIsReassigningTask(false);
    setSelectedTask(null);
    toast.success('Task updated successfully');
  };

  const getPriorityClassName = (priority: string) => {
    switch(priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };
  
  const getStatusClassName = (status: string) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center mb-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => {
              setSelectedTask(null);
              setIsAddingTask(true);
            }}
            className="neuro hover:shadow-none transition-all duration-300 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
          
          <Button 
            onClick={() => {
              setSelectedTask(null);
              setIsReassigningTask(true);
            }}
            variant="outline"
            className="neuro hover:shadow-none transition-all duration-300 w-full sm:w-auto"
          >
            Assign Lead Range
          </Button>
        </div>
        
        <Input
          placeholder="Search tasks..."
          className="neuro-inset focus:shadow-none w-full sm:w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tasks Table - Desktop */}
      <div className="overflow-auto neuro hidden sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Task</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Assigned To</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Start Date</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">End Date</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Priority</th>
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
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityClassName(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClassName(task.status)}`}>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleReassign(task)}
                    >
                      Reassign
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tasks Cards - Mobile */}
      <div className="sm:hidden space-y-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="neuro p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityClassName(task.priority)}`}>
                {task.priority}
              </span>
            </div>
            
            <div className="mt-3 flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm">Assigned to: <span className="font-medium">{task.agentName}</span></div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClassName(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <div>Start: {task.startDate}</div>
                <div>End: {task.endDate}</div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t flex justify-end gap-2">
              <Button 
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => handleReassign(task)}
              >
                Reassign
              </Button>
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
          </div>
        ))}
      </div>

      {/* Task Forms */}
      <AssignTaskForm 
        isOpen={isAddingTask} 
        onClose={() => {
          setIsAddingTask(false);
          setSelectedTask(null);
        }} 
        onSubmit={selectedTask ? handleUpdateTask : handleAddTask} 
        task={selectedTask || undefined} 
      />

      <ReassignTaskForm 
        isOpen={isReassigningTask}
        onClose={() => {
          setIsReassigningTask(false);
          setSelectedTask(null);
        }}
        onSubmit={handleUpdateTask}
        task={selectedTask}
      />
    </div>
  );
};

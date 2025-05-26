import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Undo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Task } from '@/lib/mockData';
import { useIsMobile } from '@/hooks/use-mobile';
import { AddTaskForm } from './AddTaskForm';
import { database } from '../../firebase';
import { ref, onValue, off, remove, set, push, update } from 'firebase/database';
import { useAuth } from '@/context/AuthContext';

interface Agent {
  id: string;
  name: string;
  email: string;
  status: string;
}

export const TasksTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [backupTasks, setBackupTasks] = useState<Task[]>([]);
  const [showBackup, setShowBackup] = useState(false);
  const isMobile = useIsMobile();
  const adminId = localStorage.getItem('adminkey');
  const agentId = localStorage.getItem('agentkey');
  const { user, isAdmin } = useAuth();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentBackupPage, setCurrentBackupPage] = useState(1);
  const tasksPerPage = 10;

  // Fetch tasks from Firebase based on user role
  useEffect(() => {
    let tasksRef;
    
    if (isAdmin && adminId) {
      tasksRef = ref(database, `users/${adminId}/tasks`);
    } else if (agentId && adminId) {
      tasksRef = ref(database, `users/${adminId}/agents/${agentId}/tasks`);
    } else {
      return;
    }

    const fetchTasks = () => {
      onValue(tasksRef, (snapshot) => {
        const tasksData: Task[] = [];
        snapshot.forEach((childSnapshot) => {
          tasksData.push({
            id: childSnapshot.key || '',
            ...childSnapshot.val()
          });
        });
        setTasks(tasksData);
        // Reset to first page when tasks change
        setCurrentPage(1);
      });
    };

    fetchTasks();

    return () => {
      if (tasksRef) {
        off(tasksRef);
      }
    };
  }, [isAdmin, adminId, agentId]);

  // Fetch backup tasks
  useEffect(() => {
    if (!adminId) return;

    const backupRef = ref(database, `users/${adminId}/backups/tasks`);
    
    const fetchBackupTasks = () => {
      onValue(backupRef, (snapshot) => {
        const backupData: Task[] = [];
        snapshot.forEach((childSnapshot) => {
          backupData.push({
            id: childSnapshot.key || '',
            ...childSnapshot.val()
          });
        });
        setBackupTasks(backupData);
      });
    };

    fetchBackupTasks();

    return () => {
      off(backupRef);
    };
  }, [adminId]);

  // Fetch agents data (for task assignment)
  useEffect(() => {
    if (!adminId) return;

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
  }, [adminId]);

  const filteredTasks = tasks.filter(task => {
    return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           task.agentName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredBackupTasks = backupTasks.filter(task => {
    return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           task.agentName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination logic for main tasks
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  // Pagination logic for backup tasks
  const indexOfLastBackupTask = currentBackupPage * tasksPerPage;
  const indexOfFirstBackupTask = indexOfLastBackupTask - tasksPerPage;
  const currentBackupTasks = filteredBackupTasks.slice(indexOfFirstBackupTask, indexOfLastBackupTask);
  const totalBackupPages = Math.ceil(filteredBackupTasks.length / tasksPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleBackupPageChange = (page: number) => {
    setCurrentBackupPage(page);
  };

  const handleDelete = async (id: string) => {
    try {
      // First find the task to be deleted
      const taskToDelete = tasks.find(task => task.id === id);
      if (!taskToDelete) return;

      // Add to backup before deleting
      if (adminId) {
        const backupRef = ref(database, `users/${adminId}/backups/tasks/${id}`);
        await set(backupRef, {
          ...taskToDelete,
          deletedAt: new Date().toISOString(),
          deletedBy: user?.email || 'unknown'
        });
      }

      // Then delete from main tasks
      let taskRef;
      
      if (isAdmin && adminId) {
        taskRef = ref(database, `users/${adminId}/tasks/${id}`);
      } else if (agentId && adminId) {
        taskRef = ref(database, `users/${adminId}/agents/${agentId}/tasks/${id}`);
      } else {
        throw new Error('Unable to determine storage path');
      }

      await remove(taskRef);
      toast.success('Task moved to backup successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleRestoreTask = async (task: Task) => {
    try {
      // First add the task back to main tasks
      let taskRef;
      if (isAdmin && adminId) {
        taskRef = ref(database, `users/${adminId}/tasks/${task.id}`);
      } else if (agentId && adminId) {
        taskRef = ref(database, `users/${adminId}/agents/${agentId}/tasks/${task.id}`);
      } else {
        throw new Error('Unable to determine storage path');
      }

      // Remove the deletedAt field before restoring
      const { deletedAt, deletedBy, ...taskToRestore } = task;
      await set(taskRef, taskToRestore);
      
      // Then remove from backup
      if (adminId) {
        const backupRef = ref(database, `users/${adminId}/backups/tasks/${task.id}`);
        await remove(backupRef);
      }

      toast.success('Task restored successfully');
    } catch (error) {
      console.error('Error restoring task:', error);
      toast.error('Failed to restore task');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      if (adminId) {
        const backupRef = ref(database, `users/${adminId}/backups/tasks/${id}`);
        await remove(backupRef);
        toast.success('Task permanently deleted from backup');
      }
    } catch (error) {
      console.error('Error permanently deleting task:', error);
      toast.error('Failed to permanently delete task');
    }
  };

  const handleAddTask = async (newTask: Task) => {
    try {
      let taskRef;
      if (isAdmin && adminId) {
        taskRef = ref(database, `users/${adminId}/tasks/${newTask.id}`);
      } else if (agentId && adminId) {
        taskRef = ref(database, `users/${adminId}/agents/${agentId}/tasks/${newTask.id}`);
      } else {
        throw new Error('Unable to determine storage path');
      }
  
      await set(taskRef, newTask);
      
      setTasks(prev => [newTask, ...prev]);
      setIsAddingTask(false);
      toast.success('Task added successfully');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };
  
  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      let taskRef;
      if (isAdmin && adminId) {
        taskRef = ref(database, `users/${adminId}/tasks/${updatedTask.id}`);
      } else if (agentId && adminId) {
        taskRef = ref(database, `users/${adminId}/agents/${agentId}/tasks/${updatedTask.id}`);
      } else {
        throw new Error('Unable to determine storage path');
      }
  
      await set(taskRef, updatedTask);
      
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
      setIsAddingTask(false);
      setSelectedTask(null);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsAddingTask(true);
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

  // Pagination controls component
  const PaginationControls = ({ currentPage, totalPages, onPageChange }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {showBackup 
            ? (Math.min((currentBackupPage - 1) * tasksPerPage + 1, filteredBackupTasks.length)) 
            : (Math.min((currentPage - 1) * tasksPerPage + 1, filteredTasks.length))}-{
            showBackup 
              ? Math.min(currentBackupPage * tasksPerPage, filteredBackupTasks.length) 
              : Math.min(currentPage * tasksPerPage, filteredTasks.length)
          } of {showBackup ? filteredBackupTasks.length : filteredTasks.length} tasks
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="hidden sm:flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {startPage > 1 && (
            <>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(1)}
              >
                1
              </Button>
              {startPage > 2 && <span className="px-2">...</span>}
            </>
          )}
          
          {pageNumbers.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2">...</span>}
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="hidden sm:flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center mb-4">
        <h2 className="text-xl font-semibold">{showBackup ? 'Deleted Tasks Backup' : 'Tasks'}</h2>
        <Input
          placeholder="Search tasks..."
          className="neuro-inset focus:shadow-none w-full sm:w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex justify-between mb-4">
        <Button 
          variant={showBackup ? "outline" : "default"}
          onClick={() => setShowBackup(!showBackup)}
          className="neuro hover:shadow-none transition-all duration-300"
        >
          {showBackup ? (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </>
          ) : (
            <>
              <Undo className="h-4 w-4 mr-2" />
              View Deleted Tasks
            </>
          )}
        </Button>
        
        {!showBackup && (
          <Button 
            onClick={() => {
              setSelectedTask(null);
              setIsAddingTask(true);
            }}
            className="neuro hover:shadow-none transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {showBackup ? (
        <>
          {/* Backup Tasks Table - Desktop */}
          <div className="overflow-auto neuro hidden sm:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Task</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Assigned To</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Deleted At</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Deleted By</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentBackupTasks.map((task) => (
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
                    <td className="p-3">{new Date(task.deletedAt || '').toLocaleString()}</td>
                    <td className="p-3">{task.deletedBy || 'Unknown'}</td>
                    <td className="p-3">
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-green-500 hover:text-green-600"
                          onClick={() => handleRestoreTask(task)}
                        >
                          <Undo className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handlePermanentDelete(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls 
              currentPage={currentBackupPage} 
              totalPages={totalBackupPages} 
              onPageChange={handleBackupPageChange} 
            />
          </div>

          {/* Backup Tasks Cards - Mobile */}
          <div className="sm:hidden space-y-4">
            {currentBackupTasks.map((task) => (
              <div key={task.id} className="neuro p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                </div>
                
                <div className="mt-3 flex flex-col space-y-2">
                  <div className="text-sm">Assigned to: <span className="font-medium">{task.agentName}</span></div>
                  <div className="text-sm">Deleted at: <span className="font-medium">{new Date(task.deletedAt || '').toLocaleString()}</span></div>
                  <div className="text-sm">Deleted by: <span className="font-medium">{task.deletedBy || 'Unknown'}</span></div>
                </div>
                
                <div className="mt-3 pt-3 border-t flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-green-500 hover:text-green-600"
                    onClick={() => handleRestoreTask(task)}
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => handlePermanentDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <PaginationControls 
              currentPage={currentBackupPage} 
              totalPages={totalBackupPages} 
              onPageChange={handleBackupPageChange} 
            />
          </div>
        </>
      ) : (
        <>
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
                {currentTasks.map((task) => (
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          </div>

          {/* Tasks Cards - Mobile */}
          <div className="sm:hidden space-y-4">
            {currentTasks.map((task) => (
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
            <PaginationControls 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          </div>
        </>
      )}

      {/* Task Form */}
      <AddTaskForm
        isOpen={isAddingTask}
        onClose={() => {
          setIsAddingTask(false);
          setSelectedTask(null);
        }}
        onSubmit={selectedTask ? handleUpdateTask : handleAddTask}
        task={selectedTask}
        agents={agents}
      />
    </div>
  );
};
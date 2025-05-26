import React, { useState, useEffect } from 'react';
import { Edit, Trash2, CreditCard, Calendar, Check, X, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Deal } from '@/lib/mockData';
import { DealForm } from './DealForm';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { ref, onValue, off, remove, set } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '@/context/AuthContext';

export const DealsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [backupDeals, setBackupDeals] = useState<Deal[]>([]);
  const [isAddingDeal, setIsAddingDeal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDealId, setDeletingDealId] = useState<string | null>(null);
  const [restoringDealId, setRestoringDealId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const adminId = localStorage.getItem('adminkey');
  const agentId = localStorage.getItem('agentkey');

  // Helper function to get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // Fetch deals and backup from Firebase based on user role
  useEffect(() => {
    let dealsRef;
    let backupRef;
    
    if (isAdmin && adminId) {
      dealsRef = ref(database, `users/${adminId}/deals`);
      backupRef = ref(database, `users/${adminId}/backups/${getCurrentDate()}`);
    } else if (agentId && adminId) {
      dealsRef = ref(database, `users/${adminId}/agents/${agentId}/deals`);
      backupRef = ref(database, `users/${adminId}/agents/${agentId}/backups/${getCurrentDate()}`);
    } else {
      return;
    }

    const fetchDeals = () => {
      onValue(dealsRef, (snapshot) => {
        const dealsData: Deal[] = [];
        snapshot.forEach((childSnapshot) => {
          dealsData.push({
            id: childSnapshot.key || '',
            ...childSnapshot.val()
          });
        });
        setDeals(dealsData);
      });

      onValue(backupRef, (snapshot) => {
        const backupData: Deal[] = [];
        snapshot.forEach((childSnapshot) => {
          backupData.push({
            id: childSnapshot.key || '',
            ...childSnapshot.val()
          });
        });
        setBackupDeals(backupData);
      });
    };

    fetchDeals();

    return () => {
      if (dealsRef) off(dealsRef);
      if (backupRef) off(backupRef);
    };
  }, [isAdmin, adminId, agentId, showBackup]);

  const filteredDeals = (showBackup ? backupDeals : deals).filter(deal => {
    return deal?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           deal?.company?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (id: string) => {
    try {
      let dealRef;
      let backupRef;
      
      if (isAdmin && adminId) {
        dealRef = ref(database, `users/${adminId}/deals/${id}`);
        backupRef = ref(database, `users/${adminId}/backups/${getCurrentDate()}/${id}`);
      } else if (agentId && adminId) {
        dealRef = ref(database, `users/${adminId}/agents/${agentId}/deals/${id}`);
        backupRef = ref(database, `users/${adminId}/agents/${agentId}/backups/${getCurrentDate()}/${id}`);
      } else {
        throw new Error('Unable to determine storage path');
      }

      // First backup the deal before deleting
      const dealToDelete = deals.find(deal => deal.id === id);
      if (dealToDelete) {
        await set(backupRef, dealToDelete);
      }

      // Then delete from main collection
      await remove(dealRef);
      
      setDeletingDealId(null);
      toast.success('Deal moved to backup');
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      let dealRef;
      let backupRef;
      
      if (isAdmin && adminId) {
        dealRef = ref(database, `users/${adminId}/deals/${id}`);
        backupRef = ref(database, `users/${adminId}/backups/${getCurrentDate()}/${id}`);
      } else if (agentId && adminId) {
        dealRef = ref(database, `users/${adminId}/agents/${agentId}/deals/${id}`);
        backupRef = ref(database, `users/${adminId}/agents/${agentId}/backups/${getCurrentDate()}/${id}`);
      } else {
        throw new Error('Unable to determine storage path');
      }

      // First restore the deal to main collection
      const dealToRestore = backupDeals.find(deal => deal.id === id);
      if (dealToRestore) {
        await set(dealRef, dealToRestore);
      }

      // Then remove from backup
      await remove(backupRef);
      
      setRestoringDealId(null);
      toast.success('Deal restored successfully');
    } catch (error) {
      console.error('Error restoring deal:', error);
      toast.error('Failed to restore deal');
    }
  };

  const handleAddOrUpdateDeal = async (newDeal: Deal) => {
    setIsLoading(true);
    try {
      let dealRef;
      let backupRef;
      
      if (isAdmin && adminId) {
        dealRef = ref(database, `users/${adminId}/deals/${newDeal.id}`);
        backupRef = ref(database, `users/${adminId}/backups/${getCurrentDate()}/${newDeal.id}`);
      } else if (agentId && adminId) {
        dealRef = ref(database, `users/${adminId}/agents/${agentId}/deals/${newDeal.id}`);
        backupRef = ref(database, `users/${adminId}/agents/${agentId}/backups/${getCurrentDate()}/${newDeal.id}`);
      } else {
        throw new Error('Unable to determine storage path');
      }

      // Save to main collection
      await set(dealRef, newDeal);

      // Also save to daily backup
      await set(backupRef, newDeal);

      if (editingDeal) {
        setDeals(deals.map(deal => deal.id === newDeal.id ? newDeal : deal));
        setEditingDeal(null);
        toast.success('Deal updated successfully');
      } else {
        setDeals([newDeal, ...deals]);
        setIsAddingDeal(false);
        toast.success('Deal added successfully');
      }
    } catch (error) {
      console.error('Error saving deal:', error);
      toast.error(`Failed to ${editingDeal ? 'update' : 'create'} deal`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'closed_won':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'closed_lost':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'proposal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'negotiation':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'closed_won':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'closed_lost':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getDealToDelete = () => {
    return deals.find(deal => deal.id === deletingDealId);
  };

  const getDealToRestore = () => {
    return backupDeals.find(deal => deal.id === restoringDealId);
  };

  return (
    <div className="space-y-4">
      {/* Actions and Search */}
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} justify-between gap-4 items-start sm:items-center`}>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setIsAddingDeal(true)}
            className="neuro hover:shadow-none transition-all duration-300 flex-1 sm:flex-none"
          >
            Add Deal
          </Button>
          <Button 
            variant={showBackup ? "default" : "outline"}
            onClick={() => setShowBackup(!showBackup)}
            className="flex-1 sm:flex-none"
          >
            {showBackup ? 'Show Active' : 'Show Backup'}
          </Button>
        </div>
        
        <Input
          placeholder={`Search ${showBackup ? 'backup' : 'active'} deals...`}
          className="neuro-inset focus:shadow-none w-full sm:w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Info Banner when viewing backup */}
      {showBackup && (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>Viewing backup deals. These are deleted or previous versions of active deals.</span>
        </div>
      )}

      {/* Deals in Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDeals.map((deal) => (
          <div 
            key={deal.id} 
            className="rounded-xl p-4 bg-white dark:bg-gray-800 
                      shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.8)]
                      dark:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.3),inset_-5px_-5px_10px_rgba(75,85,99,0.3)]
                      hover:shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.8)]
                              dark:hover:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(75,85,99,0.3)]
                      transition-all duration-200 hover:scale-[1]"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="w-4/5">
                  <h3 className="font-semibold text-lg truncate">{deal.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{deal.company}</p>
                </div>
                <Badge className={`${getStatusColor(deal.status)} whitespace-nowrap`}>
                  <div className="flex items-center">
                    {getStatusIcon(deal.status)}
                    <span className="ml-1 capitalize">{deal.status.replace('_', ' ')}</span>
                  </div>
                </Badge>
              </div>
              
              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Amount</span>
                  <span className="text-lg font-bold">${deal.amount.toLocaleString()}</span>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="text-sm">
                      <span className="text-muted-foreground">Created: </span>
                      <span>{deal.createdAt}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="text-sm">
                      <span className="text-muted-foreground">Closing: </span>
                      <span>{deal.closingDate}</span>
                    </div>
                  </div>
                </div>
                
                {deal.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2 italic">
                    "{deal.description}"
                  </p>
                )}
              </div>
              
              {/* Footer */}
              <div className="mt-4 pt-3 border-t dark:border-gray-700 flex justify-end">
                <div className="flex space-x-2">
                  {showBackup ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 hover:shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.8)]
                                dark:hover:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(75,85,99,0.3)]"
                      onClick={() => setRestoringDealId(deal.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" /> Restore
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 hover:shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.8)]
                                  dark:hover:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(75,85,99,0.3)]"
                        onClick={() => handleEdit(deal)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 text-red-500 hover:text-red-600 hover:shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.8)]
                                  dark:hover:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(75,85,99,0.3)]"
                        onClick={() => setDeletingDealId(deal.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deal Form Dialog */}
      <DealForm 
        isOpen={isAddingDeal || editingDeal !== null} 
        onClose={() => {
          setIsAddingDeal(false);
          setEditingDeal(null);
        }} 
        onSubmit={handleAddOrUpdateDeal}
        deal={editingDeal}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingDealId} onOpenChange={() => setDeletingDealId(null)}>
        <AlertDialogContent className="rounded-xl bg-white dark:bg-gray-800 
          shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.8)]
          dark:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.3),inset_-5px_-5px_10px_rgba(75,85,99,0.3)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the deal "{getDealToDelete()?.name}"? 
              This will move it to the backup system where you can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.8)]
              dark:hover:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(75,85,99,0.3)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingDealId && handleDelete(deletingDealId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Move to Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoringDealId} onOpenChange={() => setRestoringDealId(null)}>
        <AlertDialogContent className="rounded-xl bg-white dark:bg-gray-800 
          shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.8)]
          dark:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.3),inset_-5px_-5px_10px_rgba(75,85,99,0.3)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <RotateCcw className="h-5 w-5 text-green-500 mr-2" />
              Confirm Restoration
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore the deal "{getDealToRestore()?.name}"? 
              This will move it back to your active deals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.8)]
              dark:hover:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(75,85,99,0.3)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => restoringDealId && handleRestore(restoringDealId)}
              className="bg-green-500 hover:bg-green-600"
            >
              Restore Deal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

import React, { useState } from 'react';
import { Edit, Trash2, CreditCard, Calendar, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { mockDeals, Deal } from '@/lib/mockData';
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

export const DealsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deals, setDeals] = useState(mockDeals);
  const [isAddingDeal, setIsAddingDeal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDealId, setDeletingDealId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const filteredDeals = deals.filter(deal => {
    return deal.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = (id: string) => {
    setDeals(deals.filter(deal => deal.id !== id));
    setDeletingDealId(null);
    toast.success('Deal deleted successfully');
  };

  const handleAddOrUpdateDeal = (newDeal: Deal) => {
    if (editingDeal) {
      setDeals(deals.map(deal => deal.id === newDeal.id ? newDeal : deal));
      setEditingDeal(null);
      toast.success('Deal updated successfully');
    } else {
      setDeals([newDeal, ...deals]);
      setIsAddingDeal(false);
      toast.success('Deal added successfully');
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

  return (
    <div className="space-y-4">
      {/* Actions and Search */}
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} justify-between gap-4 items-start sm:items-center`}>
        <Button 
          onClick={() => setIsAddingDeal(true)}
          className="neuro hover:shadow-none transition-all duration-300 w-full sm:w-auto"
        >
          Add Deal
        </Button>
        
        <Input
          placeholder="Search deals..."
          className="neuro-inset focus:shadow-none w-full sm:w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Deals in Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDeals.map((deal) => (
          <Card key={deal.id} className="neuro border-none overflow-hidden transition-all duration-200 hover:scale-[1.01]">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
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
            </CardHeader>
            
            <CardContent className="p-4 space-y-3">
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
            </CardContent>
            
            <CardFooter className="p-3 border-t flex justify-end">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="neuro hover:shadow-none"
                  onClick={() => handleEdit(deal)}
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="neuro hover:shadow-none text-red-500 hover:text-red-600 border border-red-200"
                  onClick={() => setDeletingDealId(deal.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </CardFooter>
          </Card>
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
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingDealId} onOpenChange={() => setDeletingDealId(null)}>
        <AlertDialogContent className="neuro border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the deal "{getDealToDelete()?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="neuro hover:shadow-none">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingDealId && handleDelete(deletingDealId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

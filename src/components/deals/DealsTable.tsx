
import React, { useState } from 'react';
import { Edit, Trash2, CreditCard, Calendar, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { mockDeals, Deal } from '@/lib/mockData';
import { DealForm } from './DealForm';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const DealsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deals, setDeals] = useState(mockDeals);
  const [isAddingDeal, setIsAddingDeal] = useState(false);

  const filteredDeals = deals.filter(deal => {
    return deal.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = (id: string) => {
    setDeals(deals.filter(deal => deal.id !== id));
    toast.success('Deal deleted successfully');
  };

  const handleAddDeal = (newDeal: Deal) => {
    setDeals([newDeal, ...deals]);
    setIsAddingDeal(false);
    toast.success('Deal added successfully');
  };

  const handleEdit = (deal: Deal) => {
    toast.info(`Edit functionality for deal ${deal.name} coming soon`);
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

  return (
    <div className="space-y-4">
      {/* Actions and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <Button 
          onClick={() => setIsAddingDeal(true)}
          className="neuro hover:shadow-none transition-all duration-300"
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
          <Card key={deal.id} className="neuro border-none overflow-hidden">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{deal.name}</h3>
                <p className="text-sm text-muted-foreground">{deal.company}</p>
              </div>
              <Badge className={getStatusColor(deal.status)}>
                <div className="flex items-center">
                  {getStatusIcon(deal.status)}
                  <span className="ml-1">{deal.status.replace('_', ' ')}</span>
                </div>
              </Badge>
            </CardHeader>
            
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Amount</span>
                <span className="text-lg font-bold">${deal.amount.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Created: </span>
                  <span>{deal.createdAt}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Closing: </span>
                  <span>{deal.closingDate}</span>
                </div>
              </div>
              
              {deal.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {deal.description}
                </p>
              )}
            </CardContent>
            
            <CardFooter className="p-3 border-t flex justify-end">
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => handleEdit(deal)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(deal.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Deal Form Dialog */}
      <DealForm isOpen={isAddingDeal} onClose={() => setIsAddingDeal(false)} onSubmit={handleAddDeal} />
    </div>
  );
};

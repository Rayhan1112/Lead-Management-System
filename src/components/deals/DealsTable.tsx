
import React, { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { mockDeals, Deal } from '@/lib/mockData';
import { DealForm } from './DealForm';

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

      {/* Deals Table */}
      <div className="overflow-auto neuro">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Deal Name</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Amount</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Created</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Closing Date</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredDeals.map((deal) => (
              <tr key={deal.id} className="hover:bg-muted/20">
                <td className="p-3">
                  <p className="font-medium">{deal.name}</p>
                </td>
                <td className="p-3">${deal.amount.toLocaleString()}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    deal.status === 'proposal' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' 
                      : deal.status === 'negotiation'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                      : deal.status === 'closed_won'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {deal.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3">{deal.createdAt}</td>
                <td className="p-3">{deal.closingDate}</td>
                <td className="p-3">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deal Form Dialog */}
      <DealForm isOpen={isAddingDeal} onClose={() => setIsAddingDeal(false)} onSubmit={handleAddDeal} />
    </div>
  );
};

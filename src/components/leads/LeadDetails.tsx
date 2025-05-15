import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageSquare, Edit, Trash2, X,CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import {toast} from 'sonner';

interface LeadDetailsProps {
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
    propertyType: string;
    budget: string;
    location: string;
    bedrooms?: string;
    bathrooms?: string;
    squareFootage?: string;
    timeline: string;
    source: string;
    status: string;
    notes: string;
    preferredContactMethod: string;
    createdAt: string;
    updatedAt: string;
    scheduledCall?: string;
  };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSchedule?: () => void;
  isMobile?: boolean;
}

export const LeadDetails: React.FC<LeadDetailsProps> = ({ 
  lead, 
  onClose, 
  onEdit, 
  onDelete,
  onSchedule,
  isMobile = false 
}) => {
  const handleAction = (type: string) => {
    switch (type) {
      case 'call':
        if (lead.phone) {
          window.open(`tel:${lead.phone}`, '_blank');
        } else {
          toast.warning('No phone number available');
        }
        break;
      case 'email':
        if (lead.email) {
          window.open(`mailto:${lead.email}`, '_blank');
        } else {
          toast.warning('No email address available');
        }
        break;
      case 'whatsapp':
        if (lead.phone) {
          window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
        } else {
          toast.warning('No phone number available for WhatsApp');
        }
        break;
      default:
        break;
    }
  };

  return (
    <Dialog open={!!lead} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl neuro border-none ${isMobile ? 'max-h-[90vh] w-[95vw]' : ''}`}>
        <DialogHeader className="relative">
          <DialogTitle className="text-lg md:text-xl">
            Lead Details
          </DialogTitle>
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-2"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </DialogHeader>
        
        <div className={`space-y-4 ${isMobile ? 'overflow-y-auto max-h-[calc(90vh-150px)]' : ''}`}>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-bold">{lead.firstName} {lead.lastName}</h3>
                {lead.company && <p className="text-muted-foreground">{lead.company}</p>}
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="break-all">{lead.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p>{lead.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preferred Contact</p>
                  <p className="capitalize">{lead.preferredContactMethod || '-'}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('call')}
                  disabled={!lead.phone}
                >
                  <Phone className="h-4 w-4 mr-2" /> Call
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('email')}
                  disabled={!lead.email}
                >
                  <Mail className="h-4 w-4 mr-2" /> Email
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('whatsapp')}
                  disabled={!lead.phone}
                >
                  <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                    lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                    lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                    lead.status === 'proposal' ? 'bg-indigo-100 text-indigo-800' :
                    lead.status === 'negotiation' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {lead.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="capitalize">{lead.source || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Property Type</p>
                  <p className="capitalize">{lead.propertyType || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p>{lead.budget || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p>{lead.location || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timeline</p>
                  <p className="capitalize">{lead.timeline || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Bedrooms</p>
                  <p>{lead.bedrooms || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bathrooms</p>
                  <p>{lead.bathrooms || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sq. Ft.</p>
                  <p>{lead.squareFootage || '-'}</p>
                </div>
              </div>
              
              {lead.scheduledCall && (
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Call</p>
                  <p>{format(new Date(lead.scheduledCall), 'MMM d, yyyy h:mm a')}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p>{format(new Date(lead.createdAt), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Updated</p>
                  <p>{format(new Date(lead.updatedAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Notes</p>
            <div className="mt-1 p-3 bg-muted/50 rounded-md">
              {lead.notes || 'No notes available'}
            </div>
          </div>
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-end space-x-2'}`}>
          {onSchedule && (
            <Button 
              variant="outline" 
              onClick={() => {
                onClose();
                onSchedule();
              }}
              className={isMobile ? 'w-full' : ''}
            >
              <CalendarIcon className="h-4 w-4 mr-2" /> Schedule
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => {
              onClose();
              onEdit();
            }}
            className={isMobile ? 'w-full' : ''}
          >
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              onDelete();
              onClose();
            }}
            className={isMobile ? 'w-full' : ''}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
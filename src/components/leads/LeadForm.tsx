import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { database } from '../../firebase';
import { ref, push, set, update } from 'firebase/database';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface RealEstateLead {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  propertyType: 'residential' | 'commercial' | 'land' | 'rental';
  budget: string;
  location: string;
  bedrooms?: string;
  bathrooms?: string;
  squareFootage?: string;
  timeline: 'immediately' | '1-3 months' | '3-6 months' | '6+ months';
  source: 'website' | 'referral' | 'social' | 'ad' | 'open house' | 'other';
  status: 'new' | 'contacted' | 'viewing scheduled' | 'offer made' | 'negotiation' | 'closed';
  notes: string;
  preferredContactMethod: 'phone' | 'email' | 'text';
  createdAt: string;
  updatedAt: string;
}

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lead: RealEstateLead) => void;
  lead?: RealEstateLead;
}

export const LeadForm: React.FC<LeadFormProps> = ({ isOpen, onClose, onSubmit, lead }) => {
  const currentUser = localStorage.getItem('adminkey');
  const [formData, setFormData] = useState<RealEstateLead>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    propertyType: 'residential',
    budget: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    squareFootage: '',
    timeline: '1-3 months',
    source: 'website',
    status: 'new',
    notes: '',
    preferredContactMethod: 'phone',
    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with lead data when editing
  useEffect(() => {
    if (lead) {
      setFormData({
        ...lead,
        updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      });
    } else {
      // Reset form when adding new lead
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        propertyType: 'residential',
        budget: '',
        location: '',
        bedrooms: '',
        bathrooms: '',
        squareFootage: '',
        timeline: '1-3 months',
        source: 'website',
        status: 'new',
        notes: '',
        preferredContactMethod: 'phone',
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      });
    }
  }, [lead]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (field: keyof RealEstateLead, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Call the onSubmit prop with the form data
      onSubmit(formData);
      onClose();
    } catch (err) {
      console.error('Error saving lead:', err);
      setError('Failed to save lead. Please try again.');
      } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl h-[90vh] flex flex-col neuro border-none">
        <DialogHeader className="px-6 pt-6 pb-0 flex-none">
          <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name*</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  className="neuro-inset focus:shadow-none"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name*</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  className="neuro-inset focus:shadow-none"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email*</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  className="neuro-inset focus:shadow-none"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone*</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="neuro-inset focus:shadow-none"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                className="neuro-inset focus:shadow-none"
                value={formData.company}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type*</Label>
                <Select 
                  value={formData.propertyType}
                  onValueChange={(value) => handleSelectChange('propertyType', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="neuro-inset focus:shadow-none">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="rental">Rental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget">Budget*</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="text"
                  className="neuro-inset focus:shadow-none"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Preferred Location*</Label>
                <Input
                  id="location"
                  name="location"
                  className="neuro-inset focus:shadow-none"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeline">Purchase Timeline*</Label>
                <Select 
                  value={formData.timeline}
                  onValueChange={(value) => handleSelectChange('timeline', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="neuro-inset focus:shadow-none">
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediately">Immediately</SelectItem>
                    <SelectItem value="1-3 months">1-3 months</SelectItem>
                    <SelectItem value="3-6 months">3-6 months</SelectItem>
                    <SelectItem value="6+ months">6+ months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  className="neuro-inset focus:shadow-none"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min="0"
                  className="neuro-inset focus:shadow-none"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="squareFootage">Square Footage</Label>
                <Input
                  id="squareFootage"
                  name="squareFootage"
                  type="number"
                  min="0"
                  className="neuro-inset focus:shadow-none"
                  value={formData.squareFootage}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Lead Source*</Label>
                <Select 
                  value={formData.source}
                  onValueChange={(value) => handleSelectChange('source', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="neuro-inset focus:shadow-none">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="ad">Advertisement</SelectItem>
                    <SelectItem value="open house">Open House</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferredContactMethod">Contact Preference*</Label>
                <Select 
                  value={formData.preferredContactMethod}
                  onValueChange={(value) => handleSelectChange('preferredContactMethod', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="neuro-inset focus:shadow-none">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="text">Text Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Lead Status</Label>
              <Select 
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="neuro-inset focus:shadow-none">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Lead</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="viewing scheduled">Viewing Scheduled</SelectItem>
                  <SelectItem value="offer made">Offer Made</SelectItem>
                  <SelectItem value="negotiation">In Negotiation</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes & Preferences</Label>
              <Textarea
                id="notes"
                name="notes"
                className="neuro-inset focus:shadow-none"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </form>
        </div>
        
        <DialogFooter className="px-6 pb-6 pt-4 flex-none border-t">
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
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {lead ? 'Updating...' : 'Creating...'}
              </span>
            ) : lead ? 'Update Lead' : 'Add Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, Edit, Trash2, Filter, Download, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { mockLeads, statusCounts, Lead } from '@/lib/mockData';
import { LeadForm } from './LeadForm';
import { FileManager } from '@/components/common/FileManager';

export const LeadsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [leads, setLeads] = useState(mockLeads);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [fileManagerMode, setFileManagerMode] = useState<'import' | 'export'>('import');

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus ? lead.status === selectedStatus : true;
    const matchesSource = selectedSource ? lead.source === selectedSource : true;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleDelete = (id: string) => {
    setLeads(leads.filter(lead => lead.id !== id));
    toast.success('Lead deleted successfully');
  };

  const handleAddLead = (newLead: Lead) => {
    setLeads([newLead, ...leads]);
    setIsAddingLead(false);
    toast.success('Lead added successfully');
  };

  const handleAction = (type: string, lead: Lead) => {
    switch (type) {
      case 'call':
        toast.success(`Calling ${lead.name} at ${lead.phone}`);
        break;
      case 'email':
        toast.success(`Composing email to ${lead.name} at ${lead.email}`);
        break;
      case 'whatsapp':
        toast.success(`Opening WhatsApp for ${lead.name}`);
        break;
      case 'edit':
        toast.info(`Edit functionality for ${lead.name} coming soon`);
        break;
      default:
        break;
    }
  };

  const handleExport = () => {
    setFileManagerMode('export');
    setShowFileManager(true);
  };

  const handleImport = () => {
    setFileManagerMode('import');
    setShowFileManager(true);
  };

  const handleFileManagerClose = (files?: string[]) => {
    setShowFileManager(false);
    
    if (files && files.length > 0) {
      if (fileManagerMode === 'import') {
        toast.success(`Imported leads from ${files[0]}`);
      } else {
        toast.success(`Exported leads to ${files[0]}`);
      }
    }
  };

  const resetFilters = () => {
    setSelectedStatus(null);
    setSelectedSource(null);
  };

  const applyFilters = () => {
    toast.success('Filters applied successfully');
  };

  return (
    <div className="space-y-4">
      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {Object.entries(statusCounts.leads).map(([status, count]) => (
          <div 
            key={status}
            className={`neuro p-4 cursor-pointer ${selectedStatus === status ? 'ring-2 ring-pulse' : ''}`}
            onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
          >
            <p className="text-xs text-muted-foreground capitalize">{status}</p>
            <p className="text-xl font-bold">{count}</p>
          </div>
        ))}
      </div>

      {/* Actions and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setIsAddingLead(true)}
            className="neuro hover:shadow-none transition-all duration-300"
          >
            Add Lead
          </Button>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="neuro hover:shadow-none transition-all duration-300">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-4">
                  <h4 className="font-medium">Filter Leads</h4>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed'].map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`status-${status}`} 
                            checked={selectedStatus === status}
                            onCheckedChange={() => setSelectedStatus(selectedStatus === status ? null : status)}
                          />
                          <label htmlFor={`status-${status}`} className="text-sm capitalize">
                            {status}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Source</p>
                    <Select 
                      value={selectedSource || ''} 
                      onValueChange={(value) => setSelectedSource(value || null)}
                    >
                      <SelectTrigger className="w-full neuro-inset focus:shadow-none">
                        <SelectValue placeholder="All sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All sources</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="email">Email Campaign</SelectItem>
                        <SelectItem value="call">Cold Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={resetFilters}>Reset</Button>
                    <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="neuro hover:shadow-none transition-all duration-300"
                onClick={handleExport}
                title="Export leads"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="neuro hover:shadow-none transition-all duration-300"
                onClick={handleImport}
                title="Import leads"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search leads..."
            className="neuro-inset focus:shadow-none w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-auto neuro">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Company</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Source</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Created</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-muted/20">
                <td className="p-3">
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.email}</p>
                  </div>
                </td>
                <td className="p-3">{lead.company}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    lead.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                    lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                    lead.status === 'qualified' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                    lead.status === 'proposal' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300' :
                    lead.status === 'negotiation' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td className="p-3">{lead.source}</td>
                <td className="p-3">{lead.createdAt}</td>
                <td className="p-3">
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleAction('call', lead)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleAction('email', lead)}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleAction('whatsapp', lead)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleAction('edit', lead)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(lead.id)}
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

      {/* Lead Form Dialog */}
      <LeadForm isOpen={isAddingLead} onClose={() => setIsAddingLead(false)} onSubmit={handleAddLead} />

      {/* File Manager Dialog */}
      <FileManager 
        isOpen={showFileManager} 
        onClose={handleFileManagerClose}
        mode={fileManagerMode}
        fileType="excel"
      />
    </div>
  );
};

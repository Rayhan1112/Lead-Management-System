
import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, MessageSquare, Edit, Trash2, Filter, Download, Upload, 
  ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Calendar as CalendarIcon, 
  Check, CheckCircle, Circle, Clock, X, CheckSquare, Square 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { database } from '../../firebase';
import { onValue, remove, update, query, orderByChild, startAt, endAt } from 'firebase/database';
import { useAuth } from '@/context/AuthContext';
import { LeadForm } from './LeadForm';
import { FileManager } from '@/components/common/FileManager';
import { useIsMobile } from '@/hooks/use-mobile';
import { LeadDetails } from './LeadDetails';
import * as XLSX from 'xlsx';
import { ref, push, set } from 'firebase/database';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import PlanModal from '@/pages/PlanModel';

interface Lead {
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
  leadNumber?: number;
  scheduledCall?: string;
}

export const LeadsTable: React.FC = () => {
  const adminId = localStorage.getItem('adminkey');
  const agentId = localStorage.getItem('agentkey');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showFileManager, setShowFileManager] = useState(false);
  const [fileManagerMode, setFileManagerMode] = useState<'import' | 'export'>('import');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const [currentAgentRange, setCurrentAgentRange] = useState<{from: number, to: number} | null>(null);
  const [showModal, setShowModal] = useState(false);
  const isAgent = true;
  const [userRole, setUserRole] = useState<string | null>(null);
const [showAddLeadButton, setShowAddLeadButton] = useState(true);

  
  // Bulk selection state
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Call scheduling state
  const [showScheduleCall, setShowScheduleCall] = useState(false);
  const [callScheduleDate, setCallScheduleDate] = useState<Date | undefined>(new Date());
  const [callScheduleTime, setCallScheduleTime] = useState('09:00');
  const [isBulkScheduling, setIsBulkScheduling] = useState(false);
  const [mobileSelectMode, setMobileSelectMode] = useState(false);
  const [leadLimit, setLeadLimit] = useState<number | null>(null);
  const roleRef = ref(database, `users/${adminId}/agetns/${agentId}/role`);

  // Fetch leads and limit from Firebase
  
  useEffect(() => {
    if (!adminId) return;
  
    const leadsRef = ref(database, `users/${adminId}/leads`);
    const leadLimitRef = ref(database, `users/${adminId}/leadLimit`);
    const roleRef = ref(database, `users/${adminId}/agetns/${agentId}/role`);
  
    // Get role first
    const unsubscribeRole = onValue(roleRef, (snapshot) => {
      const role = snapshot.val();
      setUserRole(role);
      setShowAddLeadButton(role !== "agent"); // Hide if agent
    });
  
    // Get leads
    const unsubscribeLeads = onValue(leadsRef, (snapshot) => {
      const leadsData = snapshot.val();
      const allLeads: Lead[] = [];
  
      if (leadsData) {
        Object.keys(leadsData).forEach((pushKey) => {
          const leadData = leadsData[pushKey];
          if (leadData) {
            allLeads.push({
              id: pushKey,
              ...leadData,
            });
          }
        });
      }
  
      setLeads(allLeads);
    });
  
    // Get lead limit
    const unsubscribeLimit = onValue(leadLimitRef, (snapshot) => {
      const limit = snapshot.val();
      setLeadLimit(limit);
    });
  
    return () => {
      unsubscribeLeads();
      unsubscribeLimit();
      unsubscribeRole();
    };
  }, [adminId]);

  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(10);

  // Fetch leads from Firebase with lead range filtering
  useEffect(() => {
    if (!adminId) return;

    const leadsRef = ref(database, `users/${adminId}/leads`);

    const unsubscribe = onValue(leadsRef, (snapshot) => {
      const leadsData = snapshot.val();
      const allLeads: Lead[] = [];
      
      if (leadsData) {
        Object.keys(leadsData).forEach((pushKey) => {
          const leadData = leadsData[pushKey];
          if (leadData) {
            allLeads.push({
              id: pushKey,
              ...leadData,
              position: allLeads.length + 1
            });
          }
        });
      }

      allLeads.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      if (isAdmin) {
        setLeads(allLeads);
      } else {
        if (!agentId) return;

        const agentRef = ref(database, `users/${adminId}/agents/${agentId}`);
        onValue(agentRef, (agentSnapshot) => {
          const agentData = agentSnapshot.val();
          const fromPosition = parseInt(agentData?.from || '1');
          const toPosition = parseInt(agentData?.to || '30');
          const safeFrom = Math.max(1, fromPosition);
          const safeTo = Math.min(allLeads.length, toPosition);
          
          setCurrentAgentRange({ from: safeFrom, to: safeTo });
          const slicedLeads = allLeads.slice(safeFrom - 1, safeTo);
          setLeads(slicedLeads);
          setCurrentPage(1);
        });
      }
    });

    return () => unsubscribe();
  }, [adminId, agentId, isAdmin]);

  // Reset bulk selection when leads change
  useEffect(() => {
    setSelectedLeads([]);
    setIsSelectAll(false);
  }, [leads, currentPage]);

  // Toggle show bulk actions based on selection
  useEffect(() => {
    setShowBulkActions(selectedLeads.length > 0);
  }, [selectedLeads]);

  const filteredLeads = leads.filter(lead => {
    const searchFields = [
      lead.firstName?.toLowerCase(),
      lead.lastName?.toLowerCase(),
      lead.email?.toLowerCase(),
      lead.company?.toLowerCase(),
      lead.phone?.toLowerCase()
    ].join(' ');

    const matchesSearch = searchFields.includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus ? lead.status === selectedStatus : true;
    const matchesSource = selectedSource && selectedSource !== 'all' 
    ? lead.source === selectedSource 
    : true;    
    return matchesSearch && matchesStatus && matchesSource;
  });

  // Pagination logic
  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const firstPage = () => setCurrentPage(1);
  const lastPage = () => setCurrentPage(totalPages);

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (isSelectAll) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(currentLeads.map(lead => lead.id));
    }
    setIsSelectAll(!isSelectAll);
  };

  const toggleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId) 
        : [...prev, leadId]
    );
  };

  // Bulk actions
  const handleBulkStatusChange = async (newStatus: string) => {
    if (!adminId || selectedLeads.length === 0) return;

    try {
      const updatePromises = selectedLeads.map(leadId => 
        update(ref(database, `users/${adminId}/leads/${leadId}`), { 
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
      );

      await Promise.all(updatePromises);
      toast.success(`${selectedLeads.length} leads updated to ${newStatus}`);
      setSelectedLeads([]);
      setIsSelectAll(false);
    } catch (error) {
      toast.error('Failed to update leads');
      console.error('Error updating leads:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!adminId || selectedLeads.length === 0 || !window.confirm(`Are you sure you want to delete ${selectedLeads.length} leads?`)) return;

    try {
      const deletePromises = selectedLeads.map(leadId => 
        remove(ref(database, `users/${adminId}/leads/${leadId}`))
      );

      await Promise.all(deletePromises);
      toast.success(`${selectedLeads.length} leads deleted successfully`);
      setSelectedLeads([]);
      setIsSelectAll(false);
      
      // Reset to first page if current page would be empty
      if (currentLeads.length === selectedLeads.length && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      toast.error('Failed to delete leads');
      console.error('Error deleting leads:', error);
    }
  };

  // Call scheduling
  const handleScheduleCall = async () => {
    if (!adminId || !callScheduleDate) return;

    const leadIds = isBulkScheduling ? selectedLeads : [selectedLead?.id].filter(Boolean) as string[];
    if (leadIds.length === 0) return;

    try {
      const scheduleDateTime = `${format(callScheduleDate, 'yyyy-MM-dd')}T${callScheduleTime}`;
      const updatePromises = leadIds.map(leadId => 
        update(ref(database, `users/${adminId}/leads/${leadId}`), { 
          scheduledCall: scheduleDateTime,
          updatedAt: new Date().toISOString()
        })
      );

      await Promise.all(updatePromises);
      const message = leadIds.length === 1 
        ? 'Call scheduled successfully' 
        : `${leadIds.length} calls scheduled successfully`;
      toast.success(message);
      setShowScheduleCall(false);
      setCallScheduleDate(new Date());
      setCallScheduleTime('09:00');
      setSelectedLead(null);
    } catch (error) {
      toast.error('Failed to schedule call');
      console.error('Error scheduling call:', error);
    }
  };

  const handleSingleScheduleCall = (lead: Lead) => {
    setSelectedLead(lead);
    if (lead.scheduledCall) {
      const [date, time] = lead.scheduledCall.split('T');
      setCallScheduleDate(new Date(date));
      setCallScheduleTime(time || '09:00');
    }
    setIsBulkScheduling(false);
    setShowScheduleCall(true);
  };

  const handleBulkScheduleCall = () => {
    if (selectedLeads.length === 0) return;
    setIsBulkScheduling(true);
    setShowScheduleCall(true);
  };
   // Toggle mobile selection mode
   const toggleMobileSelectMode = () => {
    setMobileSelectMode(!mobileSelectMode);
    if (mobileSelectMode) {
      setSelectedLeads([]);
      setIsSelectAll(false);
    }
  };

  // Toggle lead selection for mobile
  const toggleMobileSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId) 
        : [...prev, leadId]
    );
  };

  const handleDelete = async (id: string) => {
    if (!adminId || !window.confirm('Are you sure you want to delete this lead?')) return;

    try {
      await remove(ref(database, `users/${adminId}/leads/${id}`));
      toast.success('Lead deleted successfully');
      
      if (selectedLead?.id === id) {
        setSelectedLead(null);
      }
      
      // Reset to first page if the current page would be empty after deletion
      if (currentLeads.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      toast.error('Failed to delete lead');
      console.error('Error deleting lead:', error);
    }
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    if (!adminId) return;

    try {
      await update(ref(database, `users/${adminId}/leads/${updatedLead.id}`), updatedLead);
      setEditingLead(null);
      toast.success('Lead updated successfully');
    } catch (error) {
      toast.error('Failed to update lead');
      console.error('Error updating lead:', error);
    }
  };

  const handleAction = (type: string, lead: Lead) => {
    switch (type) {
      case 'call':
        if (lead.phone) {
          window.open(`tel:${lead.phone}`, '_blank');
        } else {
          toast.warning('No phone number available for this lead');
        }
        break;
        
      case 'email':
        if (lead.email) {
          window.open(`mailto:${lead.email}?subject=Regarding your property inquiry`, '_blank');
        } else {
          toast.warning('No email address available for this lead');
        }
        break;
        
      case 'whatsapp':
        if (lead.phone) {
          const cleanedPhone = lead.phone.replace(/\D/g, '');
          const message = `Hi ${lead.firstName}, I'm following up on your property inquiry.`;
          window.open(`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`, '_blank');
        } else {
          toast.warning('No phone number available for WhatsApp');
        }
        break;
        
      case 'edit':
        setEditingLead(lead);
        break;
        
      case 'view':
        setSelectedLead(lead);
        break;
        
      case 'schedule':
        handleSingleScheduleCall(lead);
        break;
        
      default:
        break;
    }
  };

  const handleExport = () => {
    try {
      // Prepare the data for export
      const exportData = filteredLeads.map(lead => ({
        'First Name': lead.firstName,
        'Last Name': lead.lastName,
        'Email': lead.email,
        'Phone': lead.phone,
        'Company': lead.company || '',
        'Property Type': lead.propertyType,
        'Budget': lead.budget,
        'Location': lead.location,
        'Bedrooms': lead.bedrooms || '',
        'Bathrooms': lead.bathrooms || '',
        'Square Footage': lead.squareFootage || '',
        'Timeline': lead.timeline,
        'Source': lead.source,
        'Status': lead.status,
        'Notes': lead.notes,
        'Preferred Contact Method': lead.preferredContactMethod,
        'Created At': new Date(lead.createdAt).toLocaleString(),
        'Scheduled Call': lead.scheduledCall 
          ? new Date(lead.scheduledCall).toLocaleString() 
          : ''
      }));
  
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
      
      // Generate file name with current date
      const fileName = `leads_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      
      // Export the file
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Exported ${filteredLeads.length} leads to ${fileName}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export leads');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      alert('Please upload an Excel file');
      return;
    }
  
    try {
      const data = await readExcelFile(file);
      const validationResult = validateExcelData(data);
  
      if (validationResult.isValid) {
        // Fetch the current leads from Firebase
        const currentLeads = await fetchLeadsCount();
        const leadLimit = await fetchLeadLimit();
  
        const remainingLimit = leadLimit - currentLeads;
        if (remainingLimit <= 0) {
          setShowModal(true)
          
          return;
        }
  
        // Determine how many leads can be imported
        const leadsToImport = validationResult.validData.slice(0, remainingLimit);
  
        // Import only the allowed number of leads
        await importLeadsToDatabase(leadsToImport);
        alert(`Imported ${leadsToImport.length} leads successfully!`);
  
        // Optional: Notify if some leads were skipped due to limit
        if (leadsToImport.length < validationResult.validData.length) {
          alert(`Only ${leadsToImport.length} leads could be imported due to lead limit.`);
        }
  
        setCurrentPage(1); // Reset to the first page after import
      } else {
        alert(`Please use the required fields in the Excel. Missing fields: ${validationResult.missingFields.join(', ')}`);
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error importing file. Please check the format and try again.');
    }
  };
  
  // Function to fetch the current lead count from the database
  const fetchLeadsCount = async () => {
    // Assuming `adminId` is available in your context
    const adminId = localStorage.getItem('adminkey');
    const leadsRef = ref(database, `users/${adminId}/leads`);
  
    return new Promise((resolve, reject) => {
      onValue(leadsRef, (snapshot) => {
        const leadsData = snapshot.val();
        const leadCount = leadsData ? Object.keys(leadsData).length : 0;
        resolve(leadCount);
      }, {
        onlyOnce: true
      });
    });
  };
  
  // Function to fetch the lead limit from the database
  const fetchLeadLimit = async () => {
    const adminId = localStorage.getItem('adminkey');
    const limitRef = ref(database, `users/${adminId}/leadLimit`);
  
    return new Promise((resolve, reject) => {
      onValue(limitRef, (snapshot) => {
        const limit = snapshot.val() || 0;
        resolve(limit);
      }, {
        onlyOnce: true
      });
    });
  };
  
  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        resolve(jsonData);
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
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
    setCurrentPage(1); // Reset to first page when filters are reset
  };

  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters are applied
    toast.success('Filters applied successfully');
  };

  const importLeadsToDatabase = async (leads: Omit<Lead, 'id'>[]) => {
    const currentUser = localStorage.getItem('adminkey');
    if (!currentUser) throw new Error('User not authenticated');
    
    const leadsRef = ref(database, `users/${currentUser}/leads`);
    
    const importPromises = leads.map(lead => {
      const newLeadRef = push(leadsRef);
      const firebaseId = newLeadRef.key;
      return set(newLeadRef, {
        ...lead,
        id: firebaseId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        leadNumber: lead.leadNumber || 0
      });
    });
    
    await Promise.all(importPromises);
  };

  const validateExcelData = (data: any[]): {
    isValid: boolean;
    missingFields: string[];
    validData: Omit<Lead, 'id'>[];
  } => {
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'propertyType',
      'budget',
      'location',
      'timeline',
      'source',
      'status',
      'notes',
      'preferredContactMethod'
    ];

    if (data.length === 0) {
      return {
        isValid: false,
        missingFields: ['No data found in the Excel file'],
        validData: []
      };
    }

    const firstRow = data[0];
    const missingFields = requiredFields.filter(field => !(field in firstRow));

    if (missingFields.length > 0) {
      return {
        isValid: false,
        missingFields,
        validData: []
      };
    }

    const validData = data.map(row => ({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      company: row.company || '',
      propertyType: row.propertyType,
      budget: row.budget,
      location: row.location,
      bedrooms: row.bedrooms || '',
      bathrooms: row.bathrooms || '',
      squareFootage: row.squareFootage || '',
      timeline: row.timeline,
      source: row.source,
      status: row.status,
      notes: row.notes,
      preferredContactMethod: row.preferredContactMethod,
      leadNumber: row.leadNumber || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    return {
      isValid: true,
      missingFields: [],
      validData
    };
  };

  const allStatuses = Array.from(new Set(leads.map(lead => lead.status)));
  const allSources = Array.from(new Set(leads.map(lead => lead.source)));

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium">
              {selectedLeads.length} selected
            </span>
            
            <Select onValueChange={handleBulkStatusChange}>
              <SelectTrigger className="w-[180px] neuro-inset">
                <SelectValue placeholder="Change status..." />
              </SelectTrigger>
              <SelectContent>
                {allStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBulkScheduleCall}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Schedule Call
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSelectedLeads([]);
              setIsSelectAll(false);
            }}
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Range information for agents */}
      {!isAdmin && currentAgentRange && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Showing leads {currentAgentRange.from} to {currentAgentRange.to} • {filteredLeads.length} leads found
            {filteredLeads.length === 0 && ' (No leads in your assigned range)'}
          </p>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {allStatuses.map((status) => (
          <div 
            key={status}
            className={`neuro p-4 cursor-pointer ${selectedStatus === status ? 'ring-2 ring-pulse' : ''}`}
            onClick={() => {
              setSelectedStatus(selectedStatus === status ? null : status);
              setCurrentPage(1);
            }}
          >
            <p className="text-xs text-muted-foreground capitalize">{status}</p>
            <p className="text-xl font-bold">
              {leads.filter(lead => lead.status === status).length}
            </p>
          </div>
        ))}
      </div>

      {/* Actions and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center mb-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button
  onClick={() => setIsAddingLead(true)}
  className="neuro hover:shadow-none transition-all duration-300 w-full sm:w-auto"
  disabled={userRole === "agent"}
  title={userRole === "agent" ? "You cannot create leads" : ""}
>
  Add Lead
</Button>
  
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="neuro hover:shadow-none transition-all duration-300 w-full sm:w-auto">
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
                      {allStatuses.map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`status-${status}`} 
                            checked={selectedStatus === status}
                            onCheckedChange={() => {
                              setSelectedStatus(selectedStatus === status ? null : status);
                              setCurrentPage(1);
                            }}
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
  value={selectedSource || 'all'} 
  onValueChange={(value) => {
    setSelectedSource(value === 'all' ? null : value);
    setCurrentPage(1);
  }}
>
  <SelectTrigger className="w-full neuro-inset focus:shadow-none">
    <SelectValue placeholder="All sources" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All sources</SelectItem>
    {allSources.map(source => (
      <SelectItem key={source} value={source}>{source}</SelectItem>
    ))}
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
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={handleImport} 
                style={{ display: 'none' }} 
                id="file-upload"
              />
              <Button
                variant="outline"
                className="neuro hover:shadow-none transition-all duration-300"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Leads
              </Button>
            </div>
          </div>
        </div>
        
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search leads..."
            className="neuro-inset focus:shadow-none w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Leads Table - Desktop */}
      <div className="overflow-auto neuro hidden sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground w-10">
                <Checkbox 
                  checked={isSelectAll}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Phone</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Source</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Created</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {currentLeads.map((lead) => (
              <tr 
                key={lead.id} 
                className="hover:bg-muted/20 cursor-pointer"
                onClick={() => handleAction('view', lead)}
              >
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={() => toggleSelectLead(lead.id)}
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center">
                    <div>
                      <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                      <p className="text-sm text-muted-foreground">{lead.email}</p>
                      {lead.scheduledCall && (
                        <div className="flex items-center mt-1 text-xs text-blue-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {"Call Scheduled "+format(new Date(lead.scheduledCall), 'MMM dd, h:mm a')}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground" />
                  </div>
                </td>
                <td className="p-3">{lead.phone}</td>
                <td className="p-3">
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
                </td>
                <td className="p-3 capitalize">{lead.source}</td>
                <td className="p-3">{new Date(lead.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction('call', lead);
                      }}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction('email', lead);
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction('whatsapp', lead);
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction('schedule', lead);
                      }}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction('edit', lead);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(lead.id);
                      }}
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

      <div className="sm:hidden space-y-4" style={mobileSelectMode ? { marginBottom: '80px', marginTop: '64px' } : {}}>
        {currentLeads.map((lead) => (
          <div 
            key={lead.id} 
            className={`neuro p-4 rounded-lg cursor-pointer relative ${selectedLeads.includes(lead.id) ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => {
              if (mobileSelectMode) {
                toggleMobileSelectLead(lead.id);
              } else {
                handleAction('view', lead);
              }
            }}
          >
            {mobileSelectMode && (
              <div className="absolute top-3 right-3">
                {selectedLeads.includes(lead.id) ? (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            )}
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{lead.firstName} {lead.lastName}</h3>
                <p className="text-sm text-muted-foreground">{lead.email}</p>
                <p className="text-sm mt-1">{lead.company}</p>
                {lead.scheduledCall && (
                  <div className="flex items-center mt-1 text-xs text-blue-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(lead.scheduledCall), 'MMM dd, h:mm a')}
                  </div>
                )}
              </div>
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
            
            <div className="flex flex-wrap items-center mt-2 gap-2 text-sm text-muted-foreground">
              <div className="mr-4">Source: {lead.source}</div>
              <div>Added: {new Date(lead.createdAt).toLocaleDateString()}</div>
            </div>
            
            {!mobileSelectMode && (
              <div className="mt-3 pt-3 border-t flex justify-between">
                <div className="flex space-x-3">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction('call', lead);
                    }}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction('email', lead);
                    }}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction('whatsapp', lead);
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction('schedule', lead);
                    }}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction('edit', lead);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(lead.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

         {/* Mobile Selection Mode Toggle Button */}
         {isMobile && !mobileSelectMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-lg"
            onClick={toggleMobileSelectMode}
          >
            <CheckSquare className="h-5 w-5" />
          </Button>
        </div>
      )}

{selectedLead && (
        <>
          {isMobile ? (
            <Drawer open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
              <DrawerContent className="max-h-[90vh]">
                <div className="relative">
                  <DrawerHeader className="text-left pb-2">
                    <DrawerTitle className="flex justify-between items-center">
                      <span>Lead Details</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-4 right-4"
                        onClick={() => setSelectedLead(null)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </DrawerTitle>
                  </DrawerHeader>
                  
                  <div className="p-4 pt-0 overflow-y-auto">
                    <LeadDetails 
                      lead={selectedLead}
                      onClose={() => setSelectedLead(null)}
                      onEdit={() => {
                        setSelectedLead(null);
                        setEditingLead(selectedLead);
                      }}
                      onDelete={() => {
                        handleDelete(selectedLead.id);
                        setSelectedLead(null);
                      }}
                      onSchedule={() => handleSingleScheduleCall(selectedLead)}
                      isMobile={true}
                    />
                  </div>
                  
                  <DrawerFooter className="pt-0">
                    <div className="flex justify-between gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedLead(null);
                          setEditingLead(selectedLead);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleSingleScheduleCall(selectedLead)}
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={() => {
                          handleDelete(selectedLead.id);
                          setSelectedLead(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Lead Details</DialogTitle>
                </DialogHeader>
                <LeadDetails 
                  lead={selectedLead}
                  onClose={() => setSelectedLead(null)}
                  onEdit={() => {
                    setSelectedLead(null);
                    setEditingLead(selectedLead);
                  }}
                  onDelete={() => {
                    handleDelete(selectedLead.id);
                    setSelectedLead(null);
                  }}
                  onSchedule={() => handleSingleScheduleCall(selectedLead)}
                />
              </DialogContent>
            </Dialog>
          )}
        </>
      )}

    {/* Mobile Selection Mode Header */}
    {isMobile && mobileSelectMode && (
        <div className="fixed top-16 left-0 right-0 bg-background z-50 p-3 border-b flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileSelectMode}
            >
              <X className="h-5 w-5" />
            </Button>
            <span className="font-medium">
              {selectedLeads.length} selected
            </span>
          </div>
          <Button 
            variant="ghost"
            onClick={() => {
              setIsSelectAll(!isSelectAll);
              setSelectedLeads(isSelectAll ? [] : currentLeads.map(lead => lead.id));
            }}
          >
            {isSelectAll ? 'Deselect all' : 'Select all'}
          </Button>
        </div>
      )}

{/* Mobile Bulk Actions Bar - Fixed at bottom when in selection mode */}
{isMobile && mobileSelectMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-background z-50 p-3 border-t shadow-lg">
          <div className="flex justify-between gap-2">
            <Select onValueChange={handleBulkStatusChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {allStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBulkScheduleCall}
              className="h-10 px-3"
            >
              <Clock className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleBulkDelete}
              className="h-10 px-3"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}


      <div className="sm:hidden space-y-4">
        {currentLeads.map((lead) => (
          <div 
            key={lead.id} 
            className="neuro p-4 rounded-lg cursor-pointer"
            onClick={() => handleAction('view', lead)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{lead.firstName} {lead.lastName}</h3>
                <p className="text-sm text-muted-foreground">{lead.email}</p>
                <p className="text-sm mt-1">{lead.company}</p>
                {lead.scheduledCall && (
                  <div className="flex items-center mt-1 text-xs text-blue-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(lead.scheduledCall), 'MMM dd, h:mm a')}
                  </div>
                )}
              </div>
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
            
            <div className="flex flex-wrap items-center mt-2 gap-2 text-sm text-muted-foreground">
              <div className="mr-4">Source: {lead.source}</div>
              <div>Added: {new Date(lead.createdAt).toLocaleDateString()}</div>
            </div>
            
            <div className="mt-3 pt-3 border-t flex justify-between">
              <div className="flex space-x-3">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction('call', lead);
                  }}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction('email', lead);
                  }}
                >
                  <Mail className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction('whatsapp', lead);
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction('schedule', lead);
                  }}
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction('edit', lead);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(lead.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {filteredLeads.length > leadsPerPage && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {indexOfFirstLead + 1} to {Math.min(indexOfLastLead, filteredLeads.length)} of {filteredLeads.length} leads
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={firstPage}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page numbers - show up to 5 pages around current page */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
      key={`page-${pageNum}`}  // Add key here
      variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => paginate(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={lastPage}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Call Scheduling Dialog */}
      <Dialog open={showScheduleCall} onOpenChange={setShowScheduleCall}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isBulkScheduling ? 'Schedule Calls for Selected Leads' : 'Schedule Call'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <Label htmlFor="call-date">Date</Label>
              <Calendar
                mode="single"
                selected={callScheduleDate}
                onSelect={setCallScheduleDate}
                className="rounded-md border"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <Label htmlFor="call-time">Time</Label>
              <Input
                type="time"
                id="call-time"
                value={callScheduleTime}
                onChange={(e) => setCallScheduleTime(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleCall(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleCall}>
              {isBulkScheduling ? 'Schedule Calls' : 'Schedule Call'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Form Dialogs */}
      <LeadForm 
        isOpen={isAddingLead} 
        onClose={() => setIsAddingLead(false)} 
        onSubmit={(newLead) => {
          setIsAddingLead(false);
          toast.success('Lead added successfully');
          setCurrentPage(1);
        }} 
      />
      
      <LeadForm 
        isOpen={!!editingLead} 
        onClose={() => setEditingLead(null)} 
        onSubmit={handleUpdateLead}
        lead={editingLead}
      />

      {/* Lead Details Dialog */}
      {selectedLead && (
        <LeadDetails 
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onEdit={() => {
            setSelectedLead(null);
            setEditingLead(selectedLead);
          }}
          onDelete={() => {
            handleDelete(selectedLead.id);
            setSelectedLead(null);
          }}
          onSchedule={() => handleSingleScheduleCall(selectedLead)}
        />
      )}

      {/* File Manager Dialog */}
      <FileManager 
        isOpen={showFileManager} 
        onClose={handleFileManagerClose}
        mode={fileManagerMode}
        fileType="excel"
      />
             <PlanModal isOpen={showModal} onClose={() => setShowModal(false)} />

      
    </div>
  );
};
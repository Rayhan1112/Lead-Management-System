
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { File, FileText, FileImage, Upload, Download, X, Check } from 'lucide-react'; // Added Check import
import { toast } from 'sonner';

interface FileManagerProps {
  isOpen: boolean;
  onClose: (selectedFiles?: string[]) => void;
  mode: 'import' | 'export';
  fileType?: 'all' | 'image' | 'document' | 'excel';
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  selected?: boolean;
}

const mockFiles: FileItem[] = [
  { id: '1', name: 'leads-data.xlsx', type: 'excel', size: '24KB', date: '2025-05-01' },
  { id: '2', name: 'agents-list.xlsx', type: 'excel', size: '18KB', date: '2025-05-03' },
  { id: '3', name: 'deals-report.xlsx', type: 'excel', size: '32KB', date: '2025-05-04' },
  { id: '4', name: 'profile-pic.png', type: 'image', size: '156KB', date: '2025-05-01' },
  { id: '5', name: 'contract.pdf', type: 'document', size: '284KB', date: '2025-04-29' },
  { id: '6', name: 'meeting-notes.docx', type: 'document', size: '38KB', date: '2025-05-02' },
];

export const FileManager: React.FC<FileManagerProps> = ({ isOpen, onClose, mode, fileType = 'all' }) => {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const filteredFiles = fileType === 'all' 
    ? files 
    : files.filter(file => file.type === fileType);

  const handleFileSelect = (id: string) => {
    setFiles(prevFiles => 
      prevFiles.map(file => {
        if (file.id === id) {
          return { ...file, selected: !file.selected };
        } else if (mode === 'export') {
          // In export mode, only one file can be selected at a time
          return { ...file, selected: false };
        }
        return file;
      })
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        
        // Add the new file to the list
        const newFile: FileItem = {
          id: `new-${Date.now()}`,
          name: fileList[0].name,
          type: fileList[0].type.includes('image') ? 'image' : 
                fileList[0].type.includes('excel') || fileList[0].name.endsWith('.xlsx') ? 'excel' : 'document',
          size: `${Math.round(fileList[0].size / 1024)}KB`,
          date: new Date().toISOString().split('T')[0],
          selected: true
        };
        
        setFiles(prevFiles => [newFile, ...prevFiles]);
        toast.success(`File ${newFile.name} uploaded successfully`);
      }
    }, 200);
  };

  const handleConfirm = () => {
    const selectedFiles = files.filter(file => file.selected).map(file => file.name);
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    onClose(selectedFiles);
  };

  const getFileIcon = (fileType: string) => {
    switch(fileType) {
      case 'image':
        return <FileImage className="h-8 w-8 text-blue-500" />;
      case 'excel':
        return <FileText className="h-8 w-8 text-green-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] neuro border-none">
        <DialogHeader>
          <DialogTitle>
            {mode === 'import' ? 'Import Files' : 'Export Data'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {mode === 'import' && (
            <div className="neuro-inset p-6 flex flex-col items-center justify-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
                accept={fileType === 'image' ? 'image/*' : 
                        fileType === 'excel' ? '.xlsx,.xls,.csv' : 
                        fileType === 'document' ? '.pdf,.doc,.docx' : undefined}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">
                    {fileType === 'image' ? 'PNG, JPG up to 10MB' : 
                     fileType === 'excel' ? 'Excel or CSV files' : 
                     fileType === 'document' ? 'PDF, DOC up to 10MB' : 'Support for various file types'}
                  </p>
                </div>
              </label>
              
              {isUploading && (
                <div className="w-full mt-4">
                  <div className="h-2 bg-muted rounded overflow-hidden">
                    <div 
                      className="h-full bg-pulse" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-center mt-1">{uploadProgress}%</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {mode === 'import' ? 'Recent Files' : 'Select File to Export'}
              </h3>
            </div>
            
            <div className="neuro-inset p-2 max-h-[300px] overflow-y-auto">
              {filteredFiles.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No files available</p>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div 
                      key={file.id}
                      onClick={() => handleFileSelect(file.id)}
                      className={`p-2 rounded flex items-center justify-between cursor-pointer transition-all duration-200 ${file.selected ? 'bg-muted/50 ring-1 ring-pulse' : 'hover:bg-muted/20'}`}
                    >
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size} • {file.date}</p>
                        </div>
                      </div>
                      {file.selected && (
                        <div className="h-5 w-5 bg-pulse rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onClose()}
            className="neuro hover:shadow-none transition-all duration-300"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="neuro hover:shadow-none transition-all duration-300"
          >
            {mode === 'import' ? (
              <Upload className="h-4 w-4 mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {mode === 'import' ? 'Import Selected' : 'Export Selected'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

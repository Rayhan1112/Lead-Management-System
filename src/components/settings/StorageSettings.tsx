
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, HardDrive, Upload } from 'lucide-react';
import { FileManager } from '@/components/common/FileManager';
import { toast } from 'sonner';

export const StorageSettings: React.FC = () => {
  const [showFileManager, setShowFileManager] = useState(false);
  
  const storageData = {
    used: 234, // in MB
    total: 1024, // in MB (1GB)
    percentage: 22.85, // percentage used
  };

  const formatStorage = (sizeInMB: number): string => {
    if (sizeInMB < 1024) {
      return `${sizeInMB.toFixed(2)} MB`;
    } else {
      return `${(sizeInMB / 1024).toFixed(2)} GB`;
    }
  };

  const handleUpload = () => {
    setShowFileManager(true);
  };

  const handleFileManagerClose = (files?: string[]) => {
    setShowFileManager(false);
    
    if (files && files.length > 0) {
      toast.success(`File ${files[0]} uploaded successfully`);
    }
  };

  return (
    <>
      <Card className="neuro border-none">
        <CardHeader>
          <CardTitle>Storage</CardTitle>
          <CardDescription>
            Manage your storage capacity and uploaded files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <HardDrive className="h-8 w-8 mr-3 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Storage Usage</h3>
                <p className="text-sm text-muted-foreground">
                  {formatStorage(storageData.used)} of {formatStorage(storageData.total)} used
                </p>
              </div>
            </div>
            <span className="text-lg font-bold">{storageData.percentage.toFixed(1)}%</span>
          </div>
          
          <Progress value={storageData.percentage} className="h-2" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="neuro-inset p-4 flex items-center space-x-3">
              <Database className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-muted-foreground">76.4 MB</p>
              </div>
            </div>
            
            <div className="neuro-inset p-4 flex items-center space-x-3">
              <Upload className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium">Uploads</p>
                <p className="text-xs text-muted-foreground">157.6 MB</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpload} className="neuro hover:shadow-none transition-all duration-300">
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </CardFooter>
      </Card>
      
      <FileManager
        isOpen={showFileManager}
        onClose={handleFileManagerClose}
        mode="import"
        fileType="all"
      />
    </>
  );
};

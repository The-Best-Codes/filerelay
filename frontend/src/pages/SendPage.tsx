import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  File,
  Users,
  Wifi,
  QrCode,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import SocketService, { type FileTransferProgress, type ConnectionStatus } from '@/services/SocketService';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'waiting' | 'transferring' | 'completed' | 'error';
  transferRate?: number;
  eta?: number;
}

export default function SendPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ isConnected: false });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketServiceRef = useRef<SocketService | null>(null);

  useEffect(() => {
    const socketService = new SocketService();
    socketServiceRef.current = socketService;

    socketService.onClientId((id) => {
      setClientId(id);
      generateQRCode(id);
      setIsLoading(false);
    });

    socketService.onConnectionStatus((status) => {
      setConnectionStatus(status);
    });

    socketService.onTransferProgress((progress) => {
      updateFileProgress(progress);
    });

    socketService.onError((error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const generateQRCode = async (id: string) => {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL || 
        `${window.location.protocol}//${window.location.host}`;
      const receiveUrl = `${baseUrl}/receive?client-id=${id}`;
      const qrUrl = await QRCode.toDataURL(receiveUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const updateFileProgress = (progress: FileTransferProgress) => {
    setFiles(prev => prev.map((fileItem, index) => {
      if (index === progress.fileIndex) {
        return {
          ...fileItem,
          progress: progress.progress,
          status: progress.status,
          transferRate: progress.transferRate,
          eta: progress.eta
        };
      }
      return fileItem;
    }));

    // Update overall progress
    const totalProgress = files.reduce((sum, file) => sum + file.progress, 0);
    setOverallProgress(files.length > 0 ? totalProgress / files.length : 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const filesWithProgress: FileWithProgress[] = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'waiting' as const
    }));
    setFiles(prev => [...prev, ...filesWithProgress]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5" />;
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return <Archive className="h-5 w-5" />;
    if (type.includes('text') || type.includes('document')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatFileSize(bytesPerSecond) + '/s';
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleSendFiles = async () => {
    if (!socketServiceRef.current || files.length === 0) return;
    
    setIsSending(true);
    try {
      const filesToSend = files.map(f => f.file);
      await socketServiceRef.current.sendFiles(filesToSend);
    } catch (error) {
      console.error('Error sending files:', error);
    }
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-muted-foreground">Setting up connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Send Files</h1>
            <p className="text-sm text-muted-foreground">
              Client ID: <span className="font-mono">{clientId}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* QR Code and Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {qrCodeUrl && (
                <div className="flex flex-col items-center space-y-3">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                  />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Or enter this code manually:
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md font-mono text-sm">
                      {clientId}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {connectionStatus.isConnected ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                    <Wifi className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-600">Waiting for receiver...</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Files to Send
                {files.length > 0 && (
                  <Badge variant="secondary">{files.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-950' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Drop files here or{' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse
                    </Button>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add multiple files to send them all at once
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>File Queue</CardTitle>
                <div className="flex items-center gap-4">
                  {overallProgress > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Overall Progress: {Math.round(overallProgress)}%</span>
                    </div>
                  )}
                  <Button
                    onClick={handleSendFiles}
                    disabled={!connectionStatus.isConnected || isSending || files.length === 0}
                    className="min-w-[100px]"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Send Files
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {overallProgress > 0 && (
                <Progress value={overallProgress} className="w-full" />
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {files.map((fileItem, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(fileItem.file)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{fileItem.file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(fileItem.file.size)}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            fileItem.status === 'completed' ? 'default' :
                            fileItem.status === 'transferring' ? 'secondary' :
                            fileItem.status === 'error' ? 'destructive' : 'outline'
                          }
                        >
                          {fileItem.status === 'waiting' ? 'Queued' :
                           fileItem.status === 'transferring' ? 'Sending' :
                           fileItem.status === 'completed' ? 'Sent' : 'Error'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={fileItem.status === 'transferring'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {fileItem.progress > 0 && (
                      <div className="space-y-2">
                        <Progress value={fileItem.progress} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{Math.round(fileItem.progress)}%</span>
                          <div className="flex gap-4">
                            {fileItem.transferRate && (
                              <span>Speed: {formatSpeed(fileItem.transferRate)}</span>
                            )}
                            {fileItem.eta !== undefined && fileItem.eta > 0 && (
                              <span>ETA: {formatTime(fileItem.eta)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!connectionStatus.isConnected && (
          <Alert>
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              Share the QR code or client ID with the receiving device. Both devices must be on the same WiFi network.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
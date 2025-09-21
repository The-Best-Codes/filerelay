import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  QrCode, 
  ArrowLeft, 
  Loader2, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  File,
  Users,
  Wifi,
  CheckCircle
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SocketService, { type FileMetadata, type ConnectionStatus } from '@/services/SocketService';

interface ReceivedFile {
  blob: Blob;
  metadata: FileMetadata;
  progress: number;
  status: 'receiving' | 'completed';
  transferRate?: number;
  eta?: number;
  downloadUrl?: string;
}

export default function ReceivePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdFromUrl = searchParams.get('client-id');
  
  const [isLoading, setIsLoading] = useState(!!clientIdFromUrl);
  const [clientIdInput, setClientIdInput] = useState(clientIdFromUrl || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ isConnected: false });
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [, setCurrentReceiving] = useState<FileMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const socketServiceRef = useRef<SocketService | null>(null);

  useEffect(() => {
    if (clientIdFromUrl) {
      // Auto-connect if client-id is in URL
      connectToSender(clientIdFromUrl);
    }
  }, [clientIdFromUrl]);

  const connectToSender = async (targetClientId: string) => {
    if (!targetClientId.trim()) {
      setError('Please enter a valid client ID');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const socketService = new SocketService();
      socketServiceRef.current = socketService;

      socketService.onConnectionStatus((status) => {
        setConnectionStatus(status);
        if (status.isConnected) {
          setIsLoading(false);
          setIsConnecting(false);
        }
      });

      socketService.onFileReceive((blob, metadata) => {
        const downloadUrl = URL.createObjectURL(blob);
        setReceivedFiles(prev => {
          const updated = [...prev];
          const existingIndex = updated.findIndex(f => f.metadata.name === metadata.name);
          if (existingIndex >= 0) {
            updated[existingIndex] = {
              ...updated[existingIndex],
              blob,
              downloadUrl,
              progress: 100,
              status: 'completed'
            };
          }
          return updated;
        });
        setCurrentReceiving(null);
      });

      socketService.onTransferProgress((progress) => {
        if (progress.status === 'transferring') {
          setReceivedFiles(prev => {
            const updated = [...prev];
            const existingIndex = updated.findIndex(f => f.metadata.name === progress.fileName);
            if (existingIndex >= 0) {
              updated[existingIndex] = {
                ...updated[existingIndex],
                progress: progress.progress,
                transferRate: progress.transferRate,
                eta: progress.eta
              };
            } else {
              // New file started receiving
              updated.push({
                blob: new Blob(),
                metadata: { name: progress.fileName, size: 0 },
                progress: progress.progress,
                status: 'receiving',
                transferRate: progress.transferRate,
                eta: progress.eta
              });
              setCurrentReceiving({ name: progress.fileName, size: 0 });
            }
            return updated;
          });
        }
      });

      socketService.onError((errorMsg) => {
        setError(errorMsg);
        setIsConnecting(false);
        setIsLoading(false);
      });

      // Wait a moment for socket to initialize, then connect
      setTimeout(() => {
        socketService.connectToClient(targetClientId);
      }, 1000);

    } catch (err) {
      setError('Failed to establish connection');
      setIsConnecting(false);
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    connectToSender(clientIdInput);
  };

  const handleDownload = (file: ReceivedFile) => {
    if (file.downloadUrl) {
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = file.metadata.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <Image className="h-5 w-5" />;
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return <Video className="h-5 w-5" />;
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return <Music className="h-5 w-5" />;
    if (['zip', 'rar', 'tar', '7z', 'gz'].includes(ext)) return <Archive className="h-5 w-5" />;
    if (['txt', 'doc', 'docx', 'pdf', 'rtf'].includes(ext)) return <FileText className="h-5 w-5" />;
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-muted-foreground">Connecting to sender...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Receive Files</h1>
            <p className="text-sm text-muted-foreground">
              Connect to a sending device
            </p>
          </div>
        </div>

        {/* Connection Card */}
        {!connectionStatus.isConnected && !clientIdFromUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Connect to Sender
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Scan the QR code on the sending device or enter the code manually:
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter sender's code"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                    className="font-mono"
                  />
                  <Button 
                    onClick={handleConnect}
                    disabled={isConnecting || !clientIdInput.trim()}
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Connect'
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Connection Status */}
        {(connectionStatus.isConnected || isConnecting) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {connectionStatus.isConnected ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      Connected and ready to receive files!
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                    <Wifi className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-600">
                      Connecting to sender...
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Received Files */}
        {receivedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Received Files
                <Badge variant="secondary">{receivedFiles.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {receivedFiles.map((file, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(file.metadata.name)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.metadata.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.metadata.size > 0 ? formatFileSize(file.metadata.size) : 'Unknown size'}
                          </p>
                        </div>
                        <Badge 
                          variant={file.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {file.status === 'receiving' ? 'Receiving' : 'Complete'}
                        </Badge>
                      </div>
                      {file.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                    
                    {file.status === 'receiving' && file.progress > 0 && (
                      <div className="space-y-2">
                        <Progress value={file.progress} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{Math.round(file.progress)}%</span>
                          <div className="flex gap-4">
                            {file.transferRate && (
                              <span>Speed: {formatSpeed(file.transferRate)}</span>
                            )}
                            {file.eta !== undefined && file.eta > 0 && (
                              <span>ETA: {formatTime(file.eta)}</span>
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

        {connectionStatus.isConnected && receivedFiles.length === 0 && (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              Connected! The sender can now start transferring files to you.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
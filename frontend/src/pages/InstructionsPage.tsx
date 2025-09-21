import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function InstructionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('go');

  const isSending = action === 'send';
  const title = isSending ? 'Send Files' : 'Receive Files';
  const nextRoute = isSending ? '/send' : '/receive';

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-blue-600">{title}</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wifi className="h-6 w-6 text-blue-500" />
              WiFi Connection Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                  Important:
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Make sure both devices are connected to the same WiFi network before continuing.
                </p>
              </div>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-xs flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>Both devices must be on the same WiFi network</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-xs flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>Files are shared directly between devices (no uploads to cloud)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-xs flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>Keep both devices active during the transfer</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => navigate(nextRoute)}
                className="flex-1"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
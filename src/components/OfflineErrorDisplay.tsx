import { Card } from '@/components/ui/card';
import { AlertCircle, WifiOff, TrendingDown } from 'lucide-react';
import { isOnline } from '@/utils/api';

interface OfflineErrorProps {
  error: string | null;
  isLoading?: boolean;
}

export const OfflineErrorDisplay = ({ error, isLoading }: OfflineErrorProps) => {
  if (!error || isLoading) return null;

  const offline = !isOnline();

  return (
    <Card className={`shadow-lg ${
      offline
        ? "border-orange-200 bg-orange-50"
        : "border-red-200 bg-red-50"
    }`}>
      <div className="py-6 px-4">
        <div className={`flex items-start gap-4 ${
          offline ? "text-orange-700" : "text-red-700"
        }`}>
          {offline ? (
            <>
              <WifiOff className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">📵 You're Offline</p>
                <p className="text-sm mt-1">{error}</p>
                <p className="text-xs mt-2 text-orange-600">
                  ✓ Data will be available once you reconnect to internet
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">Error Loading Data</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

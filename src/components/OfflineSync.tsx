import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { offlineStorage } from "@/lib/offlineStorage";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi, Upload } from "lucide-react";

const OfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Connection restored. Syncing offline data...",
      });
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "Activities will be saved locally and synced when online",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check for unsynced data on mount
    checkUnsyncedData();

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Service Worker registered');
      }).catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkUnsyncedData = async () => {
    try {
      const activities = await offlineStorage.getUnsyncedActivities();
      const trackpoints = await offlineStorage.getUnsyncedTrackpoints();
      setUnsyncedCount(activities.length + trackpoints.length);
    } catch (error) {
      console.error("Error checking unsynced data:", error);
    }
  };

  const syncOfflineData = async () => {
    if (!user || isSyncing) return;

    setIsSyncing(true);
    try {
      // Sync activities
      const unsyncedActivities = await offlineStorage.getUnsyncedActivities();
      for (const activity of unsyncedActivities) {
        const { error } = await supabase.from("activities").insert([{
          user_id: activity.user_id,
          sport_type: activity.sport_type as any,
          start_time: activity.start_time,
          end_time: activity.end_time,
          total_distance_m: activity.total_distance_m,
          total_time_s: activity.total_time_s,
          moving_time_s: activity.moving_time_s,
          average_speed_mps: activity.average_speed_mps,
          max_speed_mps: activity.max_speed_mps,
          elevation_gain_m: activity.elevation_gain_m,
          elevation_loss_m: activity.elevation_loss_m,
          vertical_drop_m: activity.vertical_drop_m,
          min_altitude_m: activity.min_altitude_m,
          max_altitude_m: activity.max_altitude_m,
        }]);

        if (!error) {
          await offlineStorage.markActivitySynced(activity.id);
        }
      }

      // Sync trackpoints
      const unsyncedTrackpoints = await offlineStorage.getUnsyncedTrackpoints();
      for (const trackpoint of unsyncedTrackpoints) {
        const { error } = await supabase.from("trackpoints").insert([{
          activity_id: trackpoint.activity_id,
          latitude: trackpoint.latitude,
          longitude: trackpoint.longitude,
          altitude_m: trackpoint.altitude_m,
          speed_mps: trackpoint.speed_mps,
          recorded_at: trackpoint.recorded_at,
        }]);

        if (!error) {
          await offlineStorage.markTrackpointSynced(trackpoint.id);
        }
      }

      await checkUnsyncedData();
      
      if (unsyncedActivities.length > 0 || unsyncedTrackpoints.length > 0) {
        toast({
          title: "Sync Complete",
          description: `Synced ${unsyncedActivities.length} activities and ${unsyncedTrackpoints.length} trackpoints`,
        });
      }
    } catch (error) {
      console.error("Error syncing offline data:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync offline data. Will retry later.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOnline || unsyncedCount > 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge
          variant={isOnline ? "default" : "secondary"}
          className="flex items-center gap-2 px-4 py-2"
        >
          {isOnline ? (
            <>
              {isSyncing ? (
                <>
                  <Upload className="w-4 h-4 animate-pulse" />
                  Syncing...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  {unsyncedCount} pending
                </>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              Offline Mode
            </>
          )}
        </Badge>
      </div>
    );
  }

  return null;
};

export default OfflineSync;

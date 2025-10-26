import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ActivityMap from "@/components/ActivityMap";
import StatCard from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Share2,
  Copy,
  CheckCircle,
  Gauge,
  Route,
  Mountain,
  MapPin,
} from "lucide-react";

interface LiveTrackpoint {
  latitude: number;
  longitude: number;
  recorded_at: string;
  speed_mps: number | null;
  altitude_m: number | null;
}

const LiveTracking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shareCode = searchParams.get("code");
  const { user } = useAuth();
  const { toast } = useToast();

  const [session, setSession] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [trackpoints, setTrackpoints] = useState<LiveTrackpoint[]>([]);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (shareCode) {
      loadLiveSession();
    }
  }, [shareCode]);

  useEffect(() => {
    if (!session) return;

    // Subscribe to real-time trackpoint updates
    const channel = supabase
      .channel('live-tracking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trackpoints',
          filter: `activity_id=eq.${session.activity_id}`,
        },
        (payload) => {
          const newPoint = payload.new as LiveTrackpoint;
          setTrackpoints((prev) => [...prev, newPoint]);
          setCurrentPosition([newPoint.longitude, newPoint.latitude]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const loadLiveSession = async () => {
    if (!shareCode) return;

    // Load session using secure RPC function
    const { data: sessionData, error: sessionError } = await supabase
      .rpc("get_live_session_by_code", { p_share_code: shareCode });

    if (sessionError || !sessionData || sessionData.length === 0) {
      toast({
        title: "Session Not Found",
        description: "This live tracking session is not available",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const session = sessionData[0];
    setSession(session);

    // Load activity details
    const { data: activityData } = await supabase
      .from("activities")
      .select("*")
      .eq("id", session.activity_id)
      .single();

    if (activityData) {
      setActivity(activityData);
    }

    // Load existing trackpoints using secure RPC function
    const { data: pointsData } = await supabase
      .rpc("get_live_trackpoints", { p_share_code: shareCode });

    if (pointsData && pointsData.length > 0) {
      setTrackpoints(pointsData);
      const lastPoint = pointsData[pointsData.length - 1];
      setCurrentPosition([lastPoint.longitude, lastPoint.latitude]);
    }

    setLoading(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/live?code=${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Link Copied",
      description: "Share this link to let others follow your activity",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareLink = () => {
    return `${window.location.origin}/live?code=${shareCode}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 flex justify-center">
          <p className="text-muted-foreground">Loading live session...</p>
        </div>
      </div>
    );
  }

  const latestPoint = trackpoints[trackpoints.length - 1];
  const currentSpeed = latestPoint?.speed_mps ? latestPoint.speed_mps * 3.6 : 0;
  const currentAltitude = latestPoint?.altitude_m || 0;
  const totalDistance =
    activity?.total_distance_m ? activity.total_distance_m / 1000 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Badge variant="secondary" className="animate-pulse">
                  LIVE
                </Badge>
                {activity?.sport_type || "Activity"} Tracking
              </h1>
              <p className="text-muted-foreground">
                Real-time location updates
              </p>
            </div>
            {user?.id === session?.user_id && (
              <Button onClick={handleCopyLink} variant="outline">
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Link
                  </>
                )}
              </Button>
            )}
          </div>

          <Card className="overflow-hidden">
            <div className="h-96">
              {currentPosition && trackpoints.length > 0 ? (
                <ActivityMap
                  center={currentPosition}
                  trackPoints={trackpoints.map((p) => ({
                    latitude: p.latitude,
                    longitude: p.longitude,
                  }))}
                  className="rounded-lg"
                />
              ) : (
                <div className="h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <MapPin className="w-12 h-12 mx-auto text-primary animate-pulse" />
                    <p className="text-muted-foreground">
                      Waiting for GPS signal...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              icon={Gauge}
              label="Current Speed"
              value={currentSpeed.toFixed(1)}
              unit="km/h"
            />
            <StatCard
              icon={Route}
              label="Distance"
              value={totalDistance.toFixed(2)}
              unit="km"
            />
            <StatCard
              icon={Mountain}
              label="Altitude"
              value={currentAltitude.toFixed(0)}
              unit="m"
            />
          </div>

          {user?.id !== session?.user_id && (
            <Card className="p-4 bg-muted">
              <p className="text-sm text-center text-muted-foreground">
                You're viewing a live tracking session. Updates appear in real-time.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default LiveTracking;

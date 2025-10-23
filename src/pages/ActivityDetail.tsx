import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import ActivityMap from "@/components/ActivityMap";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Gauge,
  Route,
  Timer,
  Mountain as MountainIcon,
  TrendingUp,
  Calendar,
  MapPin,
  ArrowLeft,
} from "lucide-react";

interface Activity {
  id: string;
  sport_type: string;
  start_time: string;
  end_time: string;
  total_distance_m: number;
  total_time_s: number;
  average_speed_mps: number;
  max_speed_mps: number;
  elevation_gain_m: number;
  min_altitude_m: number | null;
  max_altitude_m: number | null;
}

const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [trackpoints, setTrackpoints] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      loadActivity();
    }
  }, [user, id]);

  const loadActivity = async () => {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setActivity(data);
      
      // Load trackpoints for map visualization
      const { data: points } = await supabase
        .from("trackpoints")
        .select("latitude, longitude")
        .eq("activity_id", id)
        .order("recorded_at", { ascending: true });
      
      if (points) {
        setTrackpoints(points);
      }
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const convertSpeed = (mps: number) => {
    return (mps * 3.6).toFixed(1); // Convert m/s to km/h
  };

  const convertDistance = (meters: number) => {
    return (meters / 1000).toFixed(2); // Convert m to km
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 flex justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <p className="text-muted-foreground mb-4">Activity not found</p>
          <Button onClick={() => navigate("/activities")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Activities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate("/activities")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Activities
          </Button>

          <div>
            <h1 className="text-3xl font-bold capitalize mb-2">{activity.sport_type} Activity</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {new Date(activity.start_time).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="h-96">
              {trackpoints.length > 0 ? (
                <ActivityMap
                  center={[trackpoints[0].longitude, trackpoints[0].latitude]}
                  trackPoints={trackpoints}
                  className="rounded-lg"
                />
              ) : (
                <div className="h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <MapPin className="w-12 h-12 mx-auto text-primary" />
                    <p className="text-muted-foreground">No GPS data available</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              icon={Route}
              label="Distance"
              value={convertDistance(activity.total_distance_m)}
              unit="km"
            />
            <StatCard
              icon={Timer}
              label="Duration"
              value={formatTime(activity.total_time_s)}
              unit=""
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Speed"
              value={convertSpeed(activity.average_speed_mps)}
              unit="km/h"
              color="text-secondary"
            />
            <StatCard
              icon={Gauge}
              label="Max Speed"
              value={convertSpeed(activity.max_speed_mps)}
              unit="km/h"
              color="text-accent"
            />
            <StatCard
              icon={MountainIcon}
              label="Elevation Gain"
              value={activity.elevation_gain_m.toFixed(0)}
              unit="m"
            />
            <StatCard
              icon={TrendingUp}
              label="Altitude Range"
              value={
                activity.min_altitude_m && activity.max_altitude_m
                  ? `${activity.min_altitude_m.toFixed(0)}-${activity.max_altitude_m.toFixed(0)}`
                  : "N/A"
              }
              unit="m"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ActivityDetail;

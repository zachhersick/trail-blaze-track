import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Play,
  Pause,
  Square,
  Gauge,
  Route,
  Timer,
  Mountain as MountainIcon,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

const TrackActivity = () => {
  const { sport } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const [stats, setStats] = useState({
    currentSpeed: 0,
    avgSpeed: 0,
    distance: 0,
    elevation: 0,
    maxSpeed: 0,
    altitude: 2340,
    minAltitude: 2340,
    maxAltitude: 2340,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && !isPaused) {
      interval = setInterval(() => {
        setDuration((d) => d + 1);
        setStats((s) => {
          const newSpeed = Math.random() * 60 + 20;
          const newAltitude = s.altitude + (Math.random() - 0.5) * 5;
          return {
            currentSpeed: newSpeed,
            avgSpeed: s.avgSpeed + Math.random() * 0.5,
            distance: s.distance + 0.01,
            elevation: s.elevation + Math.random() * 2,
            maxSpeed: Math.max(s.maxSpeed, newSpeed),
            altitude: newAltitude,
            minAltitude: Math.min(s.minAltitude, newAltitude),
            maxAltitude: Math.max(s.maxAltitude, newAltitude),
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, isPaused]);

  const handleStart = () => {
    setIsTracking(true);
    setIsPaused(false);
    setStartTime(new Date());
    toast({
      title: "Tracking Started",
      description: "Recording your activity...",
    });
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    toast({
      title: isPaused ? "Resumed" : "Paused",
      description: isPaused ? "Tracking resumed" : "Tracking paused",
    });
  };

  const handleStop = async () => {
    if (!user || !startTime || !sport) return;

    const endTime = new Date();
    
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .insert({
        user_id: user.id,
        sport_type: sport as Database["public"]["Enums"]["sport_type"],
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        total_distance_m: stats.distance * 1000,
        total_time_s: duration,
        moving_time_s: duration,
        average_speed_mps: (stats.avgSpeed / 3.6),
        max_speed_mps: (stats.maxSpeed / 3.6),
        elevation_gain_m: stats.elevation,
        elevation_loss_m: 0,
        vertical_drop_m: stats.maxAltitude - stats.minAltitude,
        min_altitude_m: stats.minAltitude,
        max_altitude_m: stats.maxAltitude,
      })
      .select()
      .single();

    if (activityError) {
      toast({
        title: "Error saving activity",
        description: activityError.message,
        variant: "destructive",
      });
      return;
    }

    setIsTracking(false);
    setIsPaused(false);
    toast({
      title: "Activity Saved",
      description: "Your session has been recorded!",
    });
    
    setTimeout(() => navigate("/activities"), 1500);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getSportName = () => {
    const sportNames: Record<string, string> = {
      ski: "Skiing",
      bike: "Dirt Biking",
      offroad: "Off-Roading",
      hike: "Hiking",
    };
    return sportNames[sport || ""] || "Activity";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">{getSportName()}</h1>
            <p className="text-muted-foreground">
              {isTracking ? "Tracking in progress..." : "Ready to start"}
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="h-64 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
              <div className="text-center space-y-2">
                <MapPin className="w-12 h-12 mx-auto text-primary" />
                <p className="text-muted-foreground">Map view will display here</p>
                <p className="text-sm text-muted-foreground">GPS tracking active</p>
              </div>
            </div>
          </Card>

          <Card className="gradient-stat border-none">
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">DURATION</p>
              <p className="text-5xl font-bold font-mono">{formatTime(duration)}</p>
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              icon={Gauge}
              label="Speed"
              value={stats.currentSpeed.toFixed(1)}
              unit="km/h"
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Speed"
              value={stats.avgSpeed.toFixed(1)}
              unit="km/h"
              color="text-secondary"
            />
            <StatCard
              icon={Route}
              label="Distance"
              value={stats.distance.toFixed(2)}
              unit="km"
            />
            <StatCard
              icon={MountainIcon}
              label="Elevation"
              value={stats.elevation.toFixed(0)}
              unit="m"
            />
            <StatCard
              icon={Gauge}
              label="Max Speed"
              value={stats.maxSpeed.toFixed(1)}
              unit="km/h"
              color="text-accent"
            />
            <StatCard
              icon={TrendingUp}
              label="Altitude"
              value={stats.altitude.toFixed(0)}
              unit="m"
            />
          </div>

          <div className="flex gap-4 justify-center">
            {!isTracking ? (
              <Button variant="hero" size="xl" onClick={handleStart}>
                <Play className="w-5 h-5" />
                Start Tracking
              </Button>
            ) : (
              <>
                <Button
                  variant={isPaused ? "default" : "secondary"}
                  size="xl"
                  onClick={handlePause}
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button variant="destructive" size="xl" onClick={handleStop}>
                  <Square className="w-5 h-5" />
                  Stop & Save
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrackActivity;

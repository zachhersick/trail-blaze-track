import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import ActivityMap from "@/components/ActivityMap";
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
    altitude: 0,
    minAltitude: 0,
    maxAltitude: 0,
  });

  const [lastPosition, setLastPosition] = useState<GeolocationPosition | null>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [trackPoints, setTrackPoints] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [activityId, setActivityId] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [totalSpeeds, setTotalSpeeds] = useState<number[]>([]);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Timer for duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && !isPaused) {
      interval = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, isPaused]);

  // Calculate distance between two GPS points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // GPS tracking
  useEffect(() => {
    if (isTracking && !isPaused) {
      if (!navigator.geolocation) {
        toast({
          title: "GPS not available",
          description: "Your device doesn't support GPS tracking",
          variant: "destructive",
        });
        return;
      }

      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, altitude, accuracy } = position.coords;
          
          // Do not hard-drop low-accuracy fixes; use movement thresholds to filter metrics

          const currentAltitude = altitude || 0;

          if (lastPosition) {
            // Calculate distance from last position
            const distanceMeters = calculateDistance(
              lastPosition.coords.latitude,
              lastPosition.coords.longitude,
              latitude,
              longitude
            );

            // Calculate time difference
            const timeDiffSeconds = (position.timestamp - lastPosition.timestamp) / 1000;

            // Conservative movement detection:
            // - require at least 3s between readings
            // - require distance to exceed combined accuracy radii or at least 15m
            const prevAcc = lastPosition.coords.accuracy ?? Infinity;
            const currAcc = accuracy ?? Infinity;
            const movementThreshold = Math.max(15, (prevAcc || 0) + (currAcc || 0));

            if (timeDiffSeconds < 3 || distanceMeters < movementThreshold) {
              // Always update map center so preview shows even if we ignore metrics
              setCurrentPosition([longitude, latitude]);
              // Treat as stationary: only update altitude/extremes and set speed to 0
              setStats((s) => ({
                ...s,
                altitude: currentAltitude,
                minAltitude: Math.min(s.minAltitude || currentAltitude, currentAltitude),
                maxAltitude: Math.max(s.maxAltitude, currentAltitude),
                currentSpeed: 0,
              }));
              return;
            }

            const distanceKm = distanceMeters / 1000;

            // Calculate speed from position change and time elapsed
            const calculatedSpeedMps = distanceMeters / timeDiffSeconds;
            const gpsSpeedMps = typeof position.coords.speed === 'number' && !Number.isNaN(position.coords.speed)
              ? position.coords.speed
              : undefined;

            // Fuse speeds conservatively: take the lower of GPS-reported and calculated when both present
            const fusedSpeedMps = gpsSpeedMps !== undefined ? Math.min(calculatedSpeedMps, gpsSpeedMps) : calculatedSpeedMps;
            const fusedSpeedKmh = fusedSpeedMps * 3.6;

            // Filter out unrealistic or too-small speeds (likely GPS jitter)
            if (fusedSpeedKmh < 1.5 || fusedSpeedKmh > 150) {
              console.log(`Ignoring noisy speed: ${fusedSpeedKmh.toFixed(1)} km/h`);
              setStats((s) => ({
                ...s,
                currentSpeed: 0,
                altitude: currentAltitude,
                minAltitude: Math.min(s.minAltitude || currentAltitude, currentAltitude),
                maxAltitude: Math.max(s.maxAltitude, currentAltitude),
              }));
              return;
            }

            // Calculate elevation change
            const lastAltitude = lastPosition.coords.altitude || 0;
            const elevationChange = currentAltitude - lastAltitude;

            setStats((s) => {
              const newSpeeds = [...totalSpeeds, fusedSpeedKmh];
              setTotalSpeeds(newSpeeds);
              const avgSpeed = newSpeeds.reduce((a, b) => a + b, 0) / newSpeeds.length;

              return {
                currentSpeed: fusedSpeedKmh,
                avgSpeed,
                distance: s.distance + distanceKm,
                elevation: elevationChange > 0 ? s.elevation + elevationChange : s.elevation,
                maxSpeed: Math.max(s.maxSpeed, fusedSpeedKmh),
                altitude: currentAltitude,
                minAltitude: s.minAltitude === 0 ? currentAltitude : Math.min(s.minAltitude, currentAltitude),
                maxAltitude: Math.max(s.maxAltitude, currentAltitude),
              };
            });

            // Save trackpoint to database only for real movement
            if (activityId && distanceMeters >= movementThreshold) {
              await supabase.from("trackpoints").insert({
                activity_id: activityId,
                recorded_at: new Date().toISOString(),
                latitude,
                longitude,
                altitude_m: currentAltitude,
                speed_mps: fusedSpeedMps,
              });
              
              // Add to track points for map visualization
              setTrackPoints(prev => [...prev, { latitude, longitude }]);
            }
            
            // Update current position for map center
            setCurrentPosition([longitude, latitude]);
            
            // Update last position only after significant movement
            setLastPosition(position);

          } else {
            // First position - initialize altitude values and set as reference
            setStats((s) => ({
              ...s,
              altitude: currentAltitude,
              minAltitude: currentAltitude,
              maxAltitude: currentAltitude,
            }));
            setCurrentPosition([longitude, latitude]);
            setTrackPoints([{ latitude, longitude }]);
            setLastPosition(position);
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermission('denied');
            toast({
              title: "Location Permission Denied",
              description: "Please enable location access in your device settings to track activities.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "GPS Error",
              description: error.message,
              variant: "destructive",
            });
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 60000,
        }
      );

      setWatchId(id);

      return () => {
        if (id) navigator.geolocation.clearWatch(id);
      };
    }
  }, [isTracking, isPaused, lastPosition, activityId, totalSpeeds]);

  const handleStart = async () => {
    if (!user || !sport) return;

    // Request location permission
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setLocationPermission(result.state as 'prompt' | 'granted' | 'denied');
      
      if (result.state === 'denied') {
        toast({
          title: "Location Permission Required",
          description: "Please enable location access in your device settings.",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      // Fallback for browsers that don't support permissions query
      console.log('Permissions API not supported, will request on geolocation call');
    }

    // Create activity in database first
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .insert({
        user_id: user.id,
        sport_type: sport as Database["public"]["Enums"]["sport_type"],
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(), // Will be updated on stop
        total_distance_m: 0,
        total_time_s: 0,
        moving_time_s: 0,
        average_speed_mps: 0,
        max_speed_mps: 0,
        elevation_gain_m: 0,
        elevation_loss_m: 0,
        vertical_drop_m: 0,
        min_altitude_m: 0,
        max_altitude_m: 0,
      })
      .select()
      .single();

    if (activityError || !activity) {
      toast({
        title: "Error starting activity",
        description: activityError?.message || "Failed to create activity",
        variant: "destructive",
      });
      return;
    }

    setActivityId(activity.id);
    setIsTracking(true);
    setIsPaused(false);
    setStartTime(new Date());

    // Bootstrap map preview with a quick last-known location fetch
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCurrentPosition([longitude, latitude]);
        },
        () => {
          // ignore bootstrap errors; watchPosition will handle errors
        },
        { enableHighAccuracy: false, maximumAge: 600000, timeout: 10000 }
      );
    }

    toast({
      title: "Tracking Started",
      description: "Using GPS to track your activity...",
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
    if (!activityId || !startTime) return;

    // Stop GPS tracking
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    const endTime = new Date();
    
    // Update activity with final stats
    const { error: updateError } = await supabase
      .from("activities")
      .update({
        end_time: endTime.toISOString(),
        total_distance_m: stats.distance * 1000,
        total_time_s: duration,
        moving_time_s: duration,
        average_speed_mps: stats.avgSpeed / 3.6,
        max_speed_mps: stats.maxSpeed / 3.6,
        elevation_gain_m: stats.elevation,
        elevation_loss_m: 0,
        vertical_drop_m: stats.maxAltitude - stats.minAltitude,
        min_altitude_m: stats.minAltitude,
        max_altitude_m: stats.maxAltitude,
      })
      .eq('id', activityId);

    if (updateError) {
      toast({
        title: "Error saving activity",
        description: updateError.message,
        variant: "destructive",
      });
      return;
    }

    setIsTracking(false);
    setIsPaused(false);
    toast({
      title: "Activity Saved",
      description: "Your GPS-tracked session has been recorded!",
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
            <div className="h-96">
              {currentPosition ? (
                <ActivityMap 
                  center={currentPosition}
                  trackPoints={trackPoints}
                  className="rounded-lg"
                />
              ) : (
                <div className="h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <MapPin className="w-12 h-12 mx-auto text-primary" />
                    <p className="text-muted-foreground">Waiting for GPS signal...</p>
                    <p className="text-sm text-muted-foreground">Start tracking to see your route</p>
                  </div>
                </div>
              )}
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

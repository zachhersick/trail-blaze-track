import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mountain, Bike, Truck, Footprints, Calendar, Route, Timer, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

interface Activity {
  id: string;
  sport_type: string;
  start_time: string;
  total_distance_m: number;
  total_time_s: number;
  average_speed_mps: number;
  max_speed_mps: number;
  elevation_gain_m: number;
}

const Activities = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [sortBy, setSortBy] = useState("recent");
  const [filterSport, setFilterSport] = useState("all");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user, sortBy, filterSport]);

  const loadActivities = async () => {
    let query = supabase
      .from("activities")
      .select("*")
      .eq("user_id", user?.id);

    if (filterSport !== "all") {
      query = query.eq("sport_type", filterSport as Database["public"]["Enums"]["sport_type"]);
    }

    switch (sortBy) {
      case "distance":
        query = query.order("total_distance_m", { ascending: false });
        break;
      case "duration":
        query = query.order("total_time_s", { ascending: false });
        break;
      case "speed":
        query = query.order("max_speed_mps", { ascending: false });
        break;
      default:
        query = query.order("start_time", { ascending: false });
    }

    const { data, error } = await query;

    if (data) {
      setActivities(data);
    }
    setLoading(false);
  };

  const getSportIcon = (sport: string) => {
    const icons = {
      ski: Mountain,
      bike: Bike,
      offroad: Truck,
      hike: Footprints,
    };
    return icons[sport as keyof typeof icons] || Mountain;
  };

  const getSportColor = (sport: string) => {
    const colors = {
      ski: "bg-sport-ski",
      bike: "bg-sport-bike",
      offroad: "bg-sport-offroad",
      hike: "bg-sport-hike",
    };
    return colors[sport as keyof typeof colors] || "bg-primary";
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const convertDistance = (meters: number) => (meters / 1000).toFixed(1);
  const convertSpeed = (mps: number) => (mps * 3.6).toFixed(1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Activity History</h1>
              <p className="text-muted-foreground">Track your progress and achievements</p>
            </div>
            <Button variant="hero" onClick={() => navigate("/track")}>
              New Activity
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="distance">Longest Distance</SelectItem>
                <SelectItem value="duration">Longest Duration</SelectItem>
                <SelectItem value="speed">Fastest</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSport} onValueChange={setFilterSport}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                <SelectItem value="ski">Skiing</SelectItem>
                <SelectItem value="bike">Dirt Biking</SelectItem>
                <SelectItem value="offroad">Off-Roading</SelectItem>
                <SelectItem value="hike">Hiking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No activities yet. Start tracking to see your data here!</p>
              <Button variant="hero" onClick={() => navigate("/track")}>
                Start Your First Activity
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const SportIcon = getSportIcon(activity.sport_type);
                return (
                  <Card
                    key={activity.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-smooth"
                    onClick={() => navigate(`/activity/${activity.id}`)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg ${getSportColor(activity.sport_type)} flex items-center justify-center`}>
                            <SportIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold capitalize">{activity.sport_type}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {new Date(activity.start_time).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {activity.sport_type}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Route className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Distance</p>
                            <p className="font-bold">{convertDistance(activity.total_distance_m)} km</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-secondary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="font-bold">{formatDuration(activity.total_time_s)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-accent" />
                          <div>
                            <p className="text-sm text-muted-foreground">Avg Speed</p>
                            <p className="font-bold">{convertSpeed(activity.average_speed_mps)} km/h</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mountain className="w-4 h-4 text-sport-ski" />
                          <div>
                            <p className="text-sm text-muted-foreground">Elevation</p>
                            <p className="font-bold">{activity.elevation_gain_m.toFixed(0)} m</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Activities;

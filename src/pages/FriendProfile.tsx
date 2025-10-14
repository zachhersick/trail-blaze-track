import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, TrendingUp, Calendar, Activity } from "lucide-react";
import StatCard from "@/components/StatCard";

interface Profile {
  id: string;
  display_name: string | null;
  default_sport: string | null;
}

interface ActivityStats {
  total_activities: number;
  total_distance: number;
  total_time: number;
  favorite_sport: string;
}

interface RecentActivity {
  id: string;
  sport_type: string;
  total_distance_m: number;
  total_time_s: number;
  start_time: string;
  average_speed_mps: number;
}

const FriendProfile = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && id) {
      loadFriendData();
    }
  }, [user, id]);

  const loadFriendData = async () => {
    setLoadingData(true);
    try {
      // Load friend profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load activity stats
      const { data: activities, error: activitiesError } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", id);

      if (activitiesError) throw activitiesError;

      if (activities && activities.length > 0) {
        const totalDistance = activities.reduce((sum, a) => sum + Number(a.total_distance_m), 0);
        const totalTime = activities.reduce((sum, a) => sum + a.total_time_s, 0);
        
        // Find favorite sport
        const sportCounts = activities.reduce((acc: any, a) => {
          acc[a.sport_type] = (acc[a.sport_type] || 0) + 1;
          return acc;
        }, {});
        const favoriteSport = Object.entries(sportCounts).sort((a: any, b: any) => b[1] - a[1])[0][0];

        setStats({
          total_activities: activities.length,
          total_distance: totalDistance,
          total_time: totalTime,
          favorite_sport: favoriteSport as string,
        });

        // Load recent activities
        const { data: recent, error: recentError } = await supabase
          .from("activities")
          .select("*")
          .eq("user_id", id)
          .order("start_time", { ascending: false })
          .limit(5);

        if (recentError) throw recentError;
        setRecentActivities(recent || []);
      }
    } catch (error: any) {
      console.error("Error loading friend data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const convertDistance = (meters: number) => {
    return (meters / 1000).toFixed(2);
  };

  const convertSpeed = (mps: number) => {
    return (mps * 3.6).toFixed(1);
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case "ski":
        return "⛷️";
      case "bike":
        return "🚴";
      case "offroad":
        return "🚙";
      case "hike":
        return "🥾";
      default:
        return "🏃";
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 flex justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <p>Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Button variant="ghost" onClick={() => navigate("/friends")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Friends
        </Button>

        <Card className="p-8 mb-8">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="text-3xl">
                {(profile.display_name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl font-bold mb-2">{profile.display_name || "Unknown"}</h1>
              {profile.default_sport && (
                <p className="text-muted-foreground">
                  Favorite Sport: {getSportIcon(profile.default_sport)} {profile.default_sport}
                </p>
              )}
            </div>
          </div>
        </Card>

        {stats && (
          <>
            <h2 className="text-2xl font-bold mb-4">Stats Overview</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                icon={Activity}
                label="Total Activities"
                value={stats.total_activities.toString()}
                unit="activities"
              />
              <StatCard
                icon={TrendingUp}
                label="Total Distance"
                value={convertDistance(stats.total_distance)}
                unit="km"
              />
              <StatCard
                icon={Calendar}
                label="Total Time"
                value={formatDuration(stats.total_time)}
                unit=""
              />
              <StatCard
                icon={Trophy}
                label="Favorite Sport"
                value={getSportIcon(stats.favorite_sport)}
                unit={stats.favorite_sport}
              />
            </div>

            <h2 className="text-2xl font-bold mb-4">Recent Activities</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {recentActivities.map((activity) => (
                <Card key={activity.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getSportIcon(activity.sport_type)}</span>
                      <div>
                        <h3 className="font-semibold capitalize">{activity.sport_type}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.start_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{convertDistance(activity.total_distance_m)}</p>
                      <p className="text-xs text-muted-foreground">km</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatDuration(activity.total_time_s)}</p>
                      <p className="text-xs text-muted-foreground">duration</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{convertSpeed(activity.average_speed_mps)}</p>
                      <p className="text-xs text-muted-foreground">km/h</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {recentActivities.length === 0 && (
              <Card className="p-8 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No activities yet</p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FriendProfile;

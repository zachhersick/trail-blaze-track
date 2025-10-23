import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Medal, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_distance: number;
  total_activities: number;
  max_speed: number;
  total_elevation: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("distance");
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadLeaderboard();
    }
  }, [user, sortBy, timeRange]);

  const loadLeaderboard = async () => {
    setLoading(true);

    // Get all friends
    const { data: friendships } = await supabase
      .from("friendships")
      .select("user_id, friend_id")
      .eq("status", "accepted")
      .or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`);

    const friendIds = new Set<string>();
    friendIds.add(user?.id!);
    
    friendships?.forEach((f) => {
      if (f.user_id === user?.id) friendIds.add(f.friend_id);
      else friendIds.add(f.user_id);
    });

    // Build time filter
    let timeFilter = null;
    if (timeRange !== "all") {
      const now = new Date();
      if (timeRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        timeFilter = weekAgo.toISOString();
      } else if (timeRange === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        timeFilter = monthAgo.toISOString();
      }
    }

    // Get activities for all friends
    let query = supabase
      .from("activities")
      .select("user_id, total_distance_m, max_speed_mps, elevation_gain_m")
      .in("user_id", Array.from(friendIds));

    if (timeFilter) {
      query = query.gte("start_time", timeFilter);
    }

    const { data: activities } = await query;

    // Get profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", Array.from(friendIds));

    // Aggregate stats by user
    const userStats = new Map<string, LeaderboardEntry>();
    
    activities?.forEach((activity) => {
      const existing = userStats.get(activity.user_id) || {
        user_id: activity.user_id,
        display_name: profiles?.find((p) => p.id === activity.user_id)
          ?.display_name || "Unknown",
        total_distance: 0,
        total_activities: 0,
        max_speed: 0,
        total_elevation: 0,
      };

      existing.total_distance += activity.total_distance_m / 1000;
      existing.total_activities += 1;
      existing.max_speed = Math.max(
        existing.max_speed,
        activity.max_speed_mps * 3.6
      );
      existing.total_elevation += activity.elevation_gain_m;

      userStats.set(activity.user_id, existing);
    });

    // Sort by selected metric
    const sorted = Array.from(userStats.values()).sort((a, b) => {
      switch (sortBy) {
        case "distance":
          return b.total_distance - a.total_distance;
        case "activities":
          return b.total_activities - a.total_activities;
        case "speed":
          return b.max_speed - a.max_speed;
        case "elevation":
          return b.total_elevation - a.total_elevation;
        default:
          return 0;
      }
    });

    setLeaderboard(sorted);
    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-orange-600" />;
    return <span className="font-bold text-lg">#{index + 1}</span>;
  };

  const getMetricValue = (entry: LeaderboardEntry) => {
    switch (sortBy) {
      case "distance":
        return `${entry.total_distance.toFixed(1)} km`;
      case "activities":
        return `${entry.total_activities} activities`;
      case "speed":
        return `${entry.max_speed.toFixed(1)} km/h`;
      case "elevation":
        return `${entry.total_elevation.toFixed(0)} m`;
      default:
        return "";
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 flex justify-center">
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Leaderboard</h1>
            <p className="text-muted-foreground">
              Compete with your friends and track your rankings
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Total Distance</SelectItem>
                <SelectItem value="activities">Total Activities</SelectItem>
                <SelectItem value="speed">Max Speed</SelectItem>
                <SelectItem value="elevation">Total Elevation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No data available. Start tracking activities or add friends!
                </p>
              </Card>
            ) : (
              leaderboard.map((entry, index) => (
                <Card
                  key={entry.user_id}
                  className={`p-4 ${
                    entry.user_id === user?.id
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 flex justify-center">
                      {getRankIcon(index)}
                    </div>
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        {entry.display_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{entry.display_name}</h3>
                        {entry.user_id === user?.id && (
                          <Badge variant="secondary">You</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entry.total_activities} activities
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {getMetricValue(entry)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;

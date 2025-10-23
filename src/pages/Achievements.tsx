import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Lock,
  Gauge,
  Route,
  Mountain,
  TrendingUp,
  Footprints,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  unlocked_at?: string;
}

const Achievements = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    // Get all achievements
    const { data: allAchievements } = await supabase
      .from("achievements")
      .select("*")
      .order("points", { ascending: false });

    // Get user's unlocked achievements
    const { data: userAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", user?.id);

    if (allAchievements) {
      const enriched = allAchievements.map((ach) => {
        const unlocked = userAchievements?.find(
          (ua) => ua.achievement_id === ach.id
        );
        return {
          ...ach,
          unlocked_at: unlocked?.unlocked_at,
        };
      });
      setAchievements(enriched);
    }
    setLoading(false);
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Gauge,
      Route,
      Mountain,
      TrendingUp,
      Footprints,
    };
    return icons[iconName] || Trophy;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      distance: "text-primary",
      speed: "text-accent",
      elevation: "text-secondary",
      consistency: "text-sport-ski",
    };
    return colors[category] || "text-muted-foreground";
  };

  const filteredAchievements = achievements.filter((ach) => {
    if (filter === "unlocked") return ach.unlocked_at;
    if (filter === "locked") return !ach.unlocked_at;
    return true;
  });

  const totalPoints = achievements
    .filter((a) => a.unlocked_at)
    .reduce((sum, a) => sum + a.points, 0);

  const maxPoints = achievements.reduce((sum, a) => sum + a.points, 0);
  const progressPercent = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 flex justify-center">
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Achievements</h1>
            <p className="text-muted-foreground">
              Unlock achievements by completing challenges
            </p>

            <Card className="p-6 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  <span className="font-bold">Total Points</span>
                </div>
                <span className="text-2xl font-bold">
                  {totalPoints} / {maxPoints}
                </span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {achievements.filter((a) => a.unlocked_at).length} of{" "}
                {achievements.length} achievements unlocked
              </p>
            </Card>
          </div>

          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
              <TabsTrigger value="locked">Locked</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAchievements.map((achievement) => {
                  const Icon = getIcon(achievement.icon);
                  const isUnlocked = !!achievement.unlocked_at;

                  return (
                    <Card
                      key={achievement.id}
                      className={`p-6 ${
                        isUnlocked
                          ? "border-primary shadow-lg"
                          : "opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-16 h-16 rounded-lg ${
                            isUnlocked
                              ? "bg-primary"
                              : "bg-muted"
                          } flex items-center justify-center flex-shrink-0`}
                        >
                          {isUnlocked ? (
                            <Icon className="w-8 h-8 text-white" />
                          ) : (
                            <Lock className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-lg">
                              {achievement.name}
                            </h3>
                            <Badge variant="secondary" className="ml-2">
                              {achievement.points}pts
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {achievement.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className={getCategoryColor(achievement.category)}
                            >
                              {achievement.category}
                            </Badge>
                            {isUnlocked && (
                              <p className="text-xs text-muted-foreground">
                                Unlocked{" "}
                                {new Date(
                                  achievement.unlocked_at!
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Achievements;

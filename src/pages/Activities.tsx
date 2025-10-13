import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface Activity {
  id: string;
  sport: "ski" | "bike" | "offroad" | "hike";
  date: string;
  distance: number;
  duration: number;
  avgSpeed: number;
  maxSpeed: number;
  elevation: number;
}

const Activities = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("recent");
  const [filterSport, setFilterSport] = useState("all");

  // Mock data
  const activities: Activity[] = [
    {
      id: "1",
      sport: "ski",
      date: "2025-01-12",
      distance: 15.2,
      duration: 7200,
      avgSpeed: 25.5,
      maxSpeed: 68.3,
      elevation: 1250,
    },
    {
      id: "2",
      sport: "bike",
      date: "2025-01-10",
      distance: 32.5,
      duration: 5400,
      avgSpeed: 21.7,
      maxSpeed: 52.1,
      elevation: 580,
    },
    {
      id: "3",
      sport: "hike",
      date: "2025-01-08",
      distance: 8.7,
      duration: 9600,
      avgSpeed: 3.3,
      maxSpeed: 6.2,
      elevation: 420,
    },
  ];

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Activity History</h1>
              <p className="text-muted-foreground">Track your progress and achievements</p>
            </div>
            <Button variant="hero" onClick={() => navigate("/track")}>
              New Activity
            </Button>
          </div>

          {/* Filters */}
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

          {/* Activities List */}
          <div className="space-y-4">
            {activities.map((activity) => {
              const SportIcon = getSportIcon(activity.sport);
              return (
                <Card
                  key={activity.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-smooth"
                  onClick={() => navigate(`/activity/${activity.id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg ${getSportColor(activity.sport)} flex items-center justify-center`}>
                          <SportIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold capitalize">{activity.sport}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(activity.date).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {activity.sport}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Distance</p>
                          <p className="font-bold">{activity.distance} km</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-secondary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="font-bold">{formatDuration(activity.duration)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-accent" />
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Speed</p>
                          <p className="font-bold">{activity.avgSpeed} km/h</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mountain className="w-4 h-4 text-sport-ski" />
                        <div>
                          <p className="text-sm text-muted-foreground">Elevation</p>
                          <p className="font-bold">{activity.elevation} m</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Activities;

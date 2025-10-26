import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import SportCard from "@/components/SportCard";
import AIRouteRecommender from "@/components/AIRouteRecommender";
import { Bike, Mountain, Truck, Footprints } from "lucide-react";

const SelectSport = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const sports = [
    {
      icon: Mountain,
      name: "Skiing / Snowboarding",
      description: "Track vertical descent, speed, and runs on the mountain",
      color: "bg-sport-ski",
      route: "/track/ski",
    },
    {
      icon: Bike,
      name: "Dirt Biking",
      description: "Monitor speed, distance, jumps, and trail performance",
      color: "bg-sport-bike",
      route: "/track/bike",
    },
    {
      icon: Truck,
      name: "Off-Roading",
      description: "Track trails, elevation changes, and vehicle performance",
      color: "bg-sport-offroad",
      route: "/track/offroad",
    },
    {
      icon: Footprints,
      name: "Hiking / Trail Running",
      description: "Record distance, pace, elevation gain, and routes",
      color: "bg-sport-hike",
      route: "/track/hike",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Choose Your Sport</h1>
            <p className="text-xl text-muted-foreground">
              Select the activity you want to track
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {sports.map((sport, index) => (
              <SportCard
                key={index}
                icon={sport.icon}
                name={sport.name}
                description={sport.description}
                color={sport.color}
                onClick={() => {
                  setSelectedSport(sport.route.split('/').pop() || null);
                  navigate(sport.route);
                }}
              />
            ))}
          </div>

          {selectedSport && (
            <AIRouteRecommender sportType={selectedSport} />
          )}
        </div>
      </main>
    </div>
  );
};

export default SelectSport;

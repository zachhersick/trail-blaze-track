import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Activity, TrendingUp, Users, Award } from "lucide-react";
import heroImage from "@/assets/hero-mountain.jpg";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Activity,
      title: "Multi-Sport Tracking",
      description: "Track skiing, dirt-biking, off-roading, hiking, and more with precision GPS data.",
    },
    {
      icon: TrendingUp,
      title: "Detailed Analytics",
      description: "Get comprehensive stats on speed, distance, elevation, and performance metrics.",
    },
    {
      icon: Users,
      title: "Social Features",
      description: "Compare your rides, compete on leaderboards, and share your adventures.",
    },
    {
      icon: Award,
      title: "Achievements",
      description: "Earn badges and track your progress as you conquer new challenges.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Mountain sports action"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            Track Every
            <span className="block text-gradient">Adventure</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto mb-8">
            Your all-in-one multi-sport activity tracker for skiing, biking, off-roading, and beyond
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" onClick={() => navigate("/select-sport")}>
              Start Tracking
            </Button>
            <Button variant="outline" size="xl" onClick={() => navigate("/activities")}>
              View Activities
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for outdoor enthusiasts and adrenaline seekers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="gradient-card rounded-xl p-6 space-y-4 hover:shadow-lg transition-smooth"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="gradient-hero rounded-2xl p-12 text-center text-primary-foreground space-y-6 shadow-glow">
            <h2 className="text-4xl font-bold">Ready to Track Your Adventures?</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of athletes tracking their performance and pushing their limits
            </p>
            <Button
              variant="outline"
              size="xl"
              className="bg-card text-card-foreground hover:bg-card/90 border-2"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 TrackSport. Built for adventurers.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

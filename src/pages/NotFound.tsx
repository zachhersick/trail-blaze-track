import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Home, Mountain } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="text-center space-y-6 max-w-md">
          <Mountain className="w-24 h-24 mx-auto text-muted-foreground opacity-50" />
          <h1 className="text-6xl font-bold text-gradient">404</h1>
          <p className="text-2xl font-semibold">Page Not Found</p>
          <p className="text-muted-foreground">
            Looks like you've wandered off the trail. Let's get you back on track.
          </p>
          <Button variant="default" size="lg" onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

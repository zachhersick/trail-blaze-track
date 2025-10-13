import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain, User } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Mountain className="w-8 h-8 text-primary transition-smooth group-hover:scale-110" />
          <span className="text-xl font-bold text-gradient">TrackSport</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/activities" className="text-sm font-medium hover:text-primary transition-smooth">
            Activities
          </Link>
          <Link to="/track" className="text-sm font-medium hover:text-primary transition-smooth">
            Track
          </Link>
          <Link to="/about" className="text-sm font-medium hover:text-primary transition-smooth">
            About
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
            <User className="w-5 h-5" />
          </Button>
          <Button variant="default" size="sm" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

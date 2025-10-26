import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import OfflineSync from "@/components/OfflineSync";
import Index from "./pages/Index";
import SelectSport from "./pages/SelectSport";
import TrackActivity from "./pages/TrackActivity";
import Activities from "./pages/Activities";
import ActivityDetail from "./pages/ActivityDetail";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import FriendProfile from "./pages/FriendProfile";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import LiveTracking from "./pages/LiveTracking";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineSync />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/track" element={<SelectSport />} />
              <Route path="/track/:sport" element={<TrackActivity />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/activity/:id" element={<ActivityDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/friend/:id" element={<FriendProfile />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/live" element={<LiveTracking />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/about" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

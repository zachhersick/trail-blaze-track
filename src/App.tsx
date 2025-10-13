import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SelectSport from "./pages/SelectSport";
import TrackActivity from "./pages/TrackActivity";
import Activities from "./pages/Activities";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/track" element={<SelectSport />} />
          <Route path="/track/:sport" element={<TrackActivity />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Auth />} />
          <Route path="/about" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

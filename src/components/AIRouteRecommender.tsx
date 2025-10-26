import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Validation schema matching edge function
const validSportTypes = ['ski', 'bike', 'offroad', 'hike'] as const;
const sportTypeSchema = z.enum(validSportTypes);

interface AIRouteRecommenderProps {
  sportType: string;
}

const AIRouteRecommender = ({ sportType }: AIRouteRecommenderProps) => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateRecommendation = async () => {
    setLoading(true);
    try {
      // Validate sport type before sending
      const validatedSportType = sportTypeSchema.parse(sportType);
      
      const { data, error } = await supabase.functions.invoke(
        "ai-route-recommender",
        {
          body: { 
            sportType: validatedSportType,
            location: "your area", // Default location
            skillLevel: "intermediate" // Default skill level
          },
        }
      );

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast({
            title: "Rate Limited",
            description: "Too many requests. Please try again in a moment.",
            variant: "destructive",
          });
        } else if (data.error.includes('credits')) {
          toast({
            title: "AI Credits Depleted",
            description: "Please add credits to continue using AI features.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setRecommendation(data.recommendation);
    } catch (error) {
      console.error("Error generating recommendation:", error);
      
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid Sport Type",
          description: "The selected sport type is not supported.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate route recommendation. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">AI Route Suggestions</h3>
          </div>
          {!recommendation && (
            <Button
              onClick={generateRecommendation}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Get Suggestions
                </>
              )}
            </Button>
          )}
        </div>

        {recommendation ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{recommendation}</p>
            <Button
              onClick={generateRecommendation}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="mt-2"
            >
              Get New Suggestions
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Get AI-powered route recommendations based on your sport and location
          </p>
        )}
      </div>
    </Card>
  );
};

export default AIRouteRecommender;

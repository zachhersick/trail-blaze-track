import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIInsightsProps {
  activityId: string;
}

const AIInsights = ({ activityId }: AIInsightsProps) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "ai-performance-insights",
        {
          body: { activityId },
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

      setInsights(data.insights);
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">AI Performance Insights</h3>
          </div>
          {!insights && (
            <Button
              onClick={generateInsights}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          )}
        </div>

        {insights ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{insights}</p>
            <Button
              onClick={generateInsights}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="mt-2"
            >
              Regenerate
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Get personalized coaching tips and performance analysis powered by AI
          </p>
        )}
      </div>
    </Card>
  );
};

export default AIInsights;

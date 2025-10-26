import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const requestSchema = z.object({
  activityId: z.string().uuid("Invalid activity ID format"),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate and sanitize input
    const validated = requestSchema.parse(body);
    const { activityId } = validated;
    
    console.log('Performance insights request for activity:', activityId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get current activity
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .eq('user_id', user.id)
      .single();

    if (activityError || !activity) {
      throw new Error('Activity not found');
    }

    // Get user's recent activities for comparison
    const { data: recentActivities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('sport_type', activity.sport_type)
      .order('start_time', { ascending: false })
      .limit(10);

    const activityStats = {
      distance: (activity.total_distance_m / 1000).toFixed(2),
      duration: Math.floor(activity.total_time_s / 60),
      avgSpeed: (activity.average_speed_mps * 3.6).toFixed(1),
      maxSpeed: (activity.max_speed_mps * 3.6).toFixed(1),
      elevation: activity.elevation_gain_m.toFixed(0),
    };

    let comparisonContext = '';
    if (recentActivities && recentActivities.length > 1) {
      const prevActivities = recentActivities.filter(a => a.id !== activityId);
      if (prevActivities.length > 0) {
        const avgPrevSpeed = prevActivities.reduce((sum, a) => sum + a.average_speed_mps, 0) / prevActivities.length * 3.6;
        const avgPrevDistance = prevActivities.reduce((sum, a) => sum + a.total_distance_m, 0) / prevActivities.length / 1000;
        comparisonContext = `Previous averages: Speed ${avgPrevSpeed.toFixed(1)}km/h, Distance ${avgPrevDistance.toFixed(1)}km.`;
      }
    }

    const systemPrompt = `You are a professional sports coach analyzing performance data. 
Provide specific, actionable insights and tips to improve performance.
Focus on: strengths, areas for improvement, training recommendations, and goal suggestions.
Be encouraging but honest. Keep advice practical and sport-specific.`;

    const userPrompt = `Analyze this ${activity.sport_type} activity:
Distance: ${activityStats.distance}km
Duration: ${activityStats.duration} minutes
Avg Speed: ${activityStats.avgSpeed}km/h
Max Speed: ${activityStats.maxSpeed}km/h
Elevation Gain: ${activityStats.elevation}m

${comparisonContext}

Provide insights on performance, strengths, and specific improvement tips.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI gateway error:', response.status, error);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ insights }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: `Validation error: ${error.errors[0].message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

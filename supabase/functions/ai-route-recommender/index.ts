import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sportType, location, skillLevel } = await req.json();
    console.log('Route recommendation request:', { sportType, location, skillLevel });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get user's activity history for context
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    let userContext = '';
    if (user) {
      const { data: activities } = await supabase
        .from('activities')
        .select('sport_type, total_distance_m, max_speed_mps, elevation_gain_m')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(10);

      if (activities && activities.length > 0) {
        const stats = {
          avgDistance: activities.reduce((sum, a) => sum + a.total_distance_m, 0) / activities.length / 1000,
          maxSpeed: Math.max(...activities.map(a => a.max_speed_mps * 3.6)),
          avgElevation: activities.reduce((sum, a) => sum + a.elevation_gain_m, 0) / activities.length,
        };
        userContext = `User stats: Avg distance ${stats.avgDistance.toFixed(1)}km, Max speed ${stats.maxSpeed.toFixed(1)}km/h, Avg elevation ${stats.avgElevation.toFixed(0)}m.`;
      }
    }

    const systemPrompt = `You are an expert outdoor sports guide specializing in ${sportType}. 
Recommend 3-5 specific routes or trails based on the user's skill level and location. 
For each route, provide: name, difficulty, distance, elevation gain, key features, and safety tips.
Keep recommendations practical and location-specific. ${userContext}`;

    const userPrompt = `Recommend routes for ${sportType} near ${location}. Skill level: ${skillLevel}.`;

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
    const recommendation = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ recommendation }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

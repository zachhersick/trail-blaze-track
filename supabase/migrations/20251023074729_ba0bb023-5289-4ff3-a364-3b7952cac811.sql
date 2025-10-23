-- Create achievements system
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- 'distance', 'speed', 'elevation', 'consistency'
  criteria JSONB NOT NULL, -- {type: 'distance', value: 100, unit: 'km'}
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user achievements junction table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  UNIQUE(user_id, achievement_id)
);

-- Create live tracking sessions
CREATE TABLE public.live_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  share_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Achievements policies (publicly viewable)
CREATE POLICY "Achievements are viewable by everyone"
ON public.achievements FOR SELECT
USING (true);

-- User achievements policies
CREATE POLICY "Users can view own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends achievements"
ON public.user_achievements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (user_id = auth.uid() AND friend_id = user_achievements.user_id)
      OR (friend_id = auth.uid() AND user_id = user_achievements.user_id)
    )
  )
);

CREATE POLICY "System can insert achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Live sessions policies
CREATE POLICY "Users can create own live sessions"
ON public.live_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own live sessions"
ON public.live_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active live sessions by share code"
ON public.live_sessions FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can update own live sessions"
ON public.live_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, criteria, points) VALUES
('First Steps', 'Complete your first activity', 'Footprints', 'consistency', '{"type": "activities", "value": 1}', 10),
('Century Club', 'Reach 100km total distance', 'Route', 'distance', '{"type": "total_distance", "value": 100, "unit": "km"}', 50),
('Speed Demon', 'Reach 50 km/h max speed', 'Gauge', 'speed', '{"type": "max_speed", "value": 50, "unit": "kmh"}', 30),
('Mountain Climber', 'Gain 1000m elevation in one activity', 'Mountain', 'elevation', '{"type": "elevation_gain", "value": 1000, "unit": "m"}', 40),
('Consistent Performer', 'Complete 7 activities in 7 days', 'TrendingUp', 'consistency', '{"type": "streak", "value": 7}', 60),
('Distance King', 'Complete 500km total distance', 'Route', 'distance', '{"type": "total_distance", "value": 500, "unit": "km"}', 100),
('Marathon', 'Complete 50km in one activity', 'Route', 'distance', '{"type": "single_distance", "value": 50, "unit": "km"}', 70);

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id UUID, p_activity_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement RECORD;
  v_user_stats RECORD;
  v_activity RECORD;
BEGIN
  -- Get user stats
  SELECT 
    COUNT(*) as total_activities,
    COALESCE(SUM(total_distance_m), 0) / 1000.0 as total_distance_km,
    COALESCE(MAX(max_speed_mps), 0) * 3.6 as max_speed_kmh
  INTO v_user_stats
  FROM activities
  WHERE user_id = p_user_id;
  
  -- Get current activity stats
  SELECT 
    total_distance_m / 1000.0 as distance_km,
    max_speed_mps * 3.6 as max_speed_kmh,
    elevation_gain_m
  INTO v_activity
  FROM activities
  WHERE id = p_activity_id;
  
  -- Check each achievement
  FOR v_achievement IN 
    SELECT * FROM achievements
  LOOP
    -- Check if already unlocked
    IF EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = p_user_id AND achievement_id = v_achievement.id
    ) THEN
      CONTINUE;
    END IF;
    
    -- Check criteria
    CASE v_achievement.criteria->>'type'
      WHEN 'activities' THEN
        IF v_user_stats.total_activities >= (v_achievement.criteria->>'value')::INTEGER THEN
          INSERT INTO user_achievements (user_id, achievement_id, activity_id)
          VALUES (p_user_id, v_achievement.id, p_activity_id);
        END IF;
      WHEN 'total_distance' THEN
        IF v_user_stats.total_distance_km >= (v_achievement.criteria->>'value')::NUMERIC THEN
          INSERT INTO user_achievements (user_id, achievement_id, activity_id)
          VALUES (p_user_id, v_achievement.id, p_activity_id);
        END IF;
      WHEN 'max_speed' THEN
        IF v_user_stats.max_speed_kmh >= (v_achievement.criteria->>'value')::NUMERIC THEN
          INSERT INTO user_achievements (user_id, achievement_id, activity_id)
          VALUES (p_user_id, v_achievement.id, p_activity_id);
        END IF;
      WHEN 'single_distance' THEN
        IF v_activity.distance_km >= (v_achievement.criteria->>'value')::NUMERIC THEN
          INSERT INTO user_achievements (user_id, achievement_id, activity_id)
          VALUES (p_user_id, v_achievement.id, p_activity_id);
        END IF;
      WHEN 'elevation_gain' THEN
        IF v_activity.elevation_gain_m >= (v_achievement.criteria->>'value')::NUMERIC THEN
          INSERT INTO user_achievements (user_id, achievement_id, activity_id)
          VALUES (p_user_id, v_achievement.id, p_activity_id);
        END IF;
    END CASE;
  END LOOP;
END;
$$;

-- Enable realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.trackpoints;
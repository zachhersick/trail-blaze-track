-- Add explicit auth.uid() check to check_achievements function for defense-in-depth
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id uuid, p_activity_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_achievement RECORD;
  v_user_stats RECORD;
  v_activity RECORD;
BEGIN
  -- Explicit authorization check: users can only check their own achievements
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot check achievements for other users';
  END IF;

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
$function$;
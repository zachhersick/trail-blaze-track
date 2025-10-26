-- Fix live tracking security issue by removing overly permissive policy
-- and creating a secure RPC function

-- 1. Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view active live sessions by share code" ON public.live_sessions;

-- 2. Create a secure RPC function to get live session by share code
CREATE OR REPLACE FUNCTION public.get_live_session_by_code(p_share_code text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  activity_id uuid,
  is_active boolean,
  created_at timestamptz,
  ended_at timestamptz,
  share_code text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    id,
    user_id,
    activity_id,
    is_active,
    created_at,
    ended_at,
    share_code
  FROM public.live_sessions
  WHERE share_code = p_share_code
    AND is_active = true
  LIMIT 1;
$$;

-- 3. Create RPC function to get trackpoints for a valid live session
CREATE OR REPLACE FUNCTION public.get_live_trackpoints(p_share_code text)
RETURNS TABLE (
  latitude numeric,
  longitude numeric,
  recorded_at timestamptz,
  speed_mps numeric,
  altitude_m numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    t.latitude,
    t.longitude,
    t.recorded_at,
    t.speed_mps,
    t.altitude_m
  FROM public.trackpoints t
  INNER JOIN public.live_sessions ls ON ls.activity_id = t.activity_id
  WHERE ls.share_code = p_share_code
    AND ls.is_active = true
  ORDER BY t.recorded_at ASC;
$$;

-- 4. Grant execute permissions to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_live_session_by_code(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_live_trackpoints(text) TO authenticated, anon;
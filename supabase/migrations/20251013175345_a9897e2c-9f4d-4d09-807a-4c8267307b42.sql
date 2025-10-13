-- Create enum for sport types
CREATE TYPE public.sport_type AS ENUM ('ski', 'bike', 'offroad', 'hike');

-- Create enum for unit preferences
CREATE TYPE public.unit_preference AS ENUM ('metric', 'imperial');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  default_sport sport_type DEFAULT 'ski',
  unit_preference unit_preference DEFAULT 'metric',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport_type sport_type NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_distance_m NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  total_time_s INTEGER DEFAULT 0 NOT NULL,
  moving_time_s INTEGER DEFAULT 0 NOT NULL,
  average_speed_mps NUMERIC(6, 2) DEFAULT 0 NOT NULL,
  max_speed_mps NUMERIC(6, 2) DEFAULT 0 NOT NULL,
  elevation_gain_m NUMERIC(8, 2) DEFAULT 0 NOT NULL,
  elevation_loss_m NUMERIC(8, 2) DEFAULT 0 NOT NULL,
  vertical_drop_m NUMERIC(8, 2) DEFAULT 0 NOT NULL,
  min_altitude_m NUMERIC(8, 2),
  max_altitude_m NUMERIC(8, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Activities policies
CREATE POLICY "Users can view own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
  ON public.activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = user_id);

-- Create trackpoints table for GPS data
CREATE TABLE public.trackpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  altitude_m NUMERIC(8, 2),
  speed_mps NUMERIC(6, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on trackpoints
ALTER TABLE public.trackpoints ENABLE ROW LEVEL SECURITY;

-- Trackpoints policies (via activity ownership)
CREATE POLICY "Users can view trackpoints of own activities"
  ON public.trackpoints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities
      WHERE activities.id = trackpoints.activity_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert trackpoints for own activities"
  ON public.trackpoints FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activities
      WHERE activities.id = trackpoints.activity_id
      AND activities.user_id = auth.uid()
    )
  );

-- Create index on trackpoints for better query performance
CREATE INDEX idx_trackpoints_activity_id ON public.trackpoints(activity_id);
CREATE INDEX idx_trackpoints_recorded_at ON public.trackpoints(recorded_at);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_start_time ON public.activities(start_time DESC);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
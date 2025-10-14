-- Create friendships table to manage friend relationships
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships they are part of
CREATE POLICY "Users can view own friendships"
ON public.friendships
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can create friend requests
CREATE POLICY "Users can create friend requests"
ON public.friendships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update friendships where they are the recipient
CREATE POLICY "Users can update received friend requests"
ON public.friendships
FOR UPDATE
USING (auth.uid() = friend_id);

-- Users can delete friendships they are part of
CREATE POLICY "Users can delete own friendships"
ON public.friendships
FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_friendships_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Make profiles viewable by friends
CREATE POLICY "Profiles viewable by friends"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
    AND ((user_id = auth.uid() AND friend_id = profiles.id)
         OR (friend_id = auth.uid() AND user_id = profiles.id))
  )
);

-- Make activities viewable by friends
CREATE POLICY "Activities viewable by friends"
ON public.activities
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
    AND ((user_id = auth.uid() AND friend_id = activities.user_id)
         OR (friend_id = auth.uid() AND user_id = activities.user_id))
  )
);
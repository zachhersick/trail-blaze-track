import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Clock, Check, X, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Profile {
  id: string;
  display_name: string | null;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profiles?: Profile;
}

const Friends = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadFriendships();
    }
  }, [user]);

  const loadFriendships = async () => {
    setLoadingData(true);
    try {
      // Load accepted friends
      const { data: acceptedFriends, error: friendsError } = await supabase
        .from("friendships")
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          profiles!friendships_friend_id_fkey(id, display_name)
        `)
        .eq("status", "accepted")
        .eq("user_id", user?.id);

      if (friendsError) throw friendsError;

      // Also get friendships where current user is the friend
      const { data: friendsOfUser, error: friendsOfUserError } = await supabase
        .from("friendships")
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          profiles!friendships_user_id_fkey(id, display_name)
        `)
        .eq("status", "accepted")
        .eq("friend_id", user?.id);

      if (friendsOfUserError) throw friendsOfUserError;

      setFriends([...(acceptedFriends || []), ...(friendsOfUser || [])]);

      // Load pending requests (received)
      const { data: pending, error: pendingError } = await supabase
        .from("friendships")
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          profiles!friendships_user_id_fkey(id, display_name)
        `)
        .eq("status", "pending")
        .eq("friend_id", user?.id);

      if (pendingError) throw pendingError;
      setPendingRequests(pending || []);

      // Load sent requests
      const { data: sent, error: sentError } = await supabase
        .from("friendships")
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          profiles!friendships_friend_id_fkey(id, display_name)
        `)
        .eq("status", "pending")
        .eq("user_id", user?.id);

      if (sentError) throw sentError;
      setSentRequests(sent || []);
    } catch (error: any) {
      toast({
        title: "Error loading friends",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .ilike("display_name", `%${searchEmail}%`)
        .neq("id", user?.id)
        .limit(5);

      if (profileError) throw profileError;
      
      if (profiles && profiles.length > 0) {
        setSearchResults(profiles);
      } else {
        setSearchResults([]);
        toast({
          title: "Not found",
          description: "No users found with that name",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error searching",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .insert({
          user_id: user?.id,
          friend_id: friendId,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent",
      });

      setSearchResults([]);
      setSearchEmail("");
      loadFriendships();
    } catch (error: any) {
      toast({
        title: "Error sending request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const respondToRequest = async (friendshipId: string, status: "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status })
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: status === "accepted" ? "Friend request accepted" : "Friend request rejected",
        description: status === "accepted" ? "You are now friends!" : "Request has been rejected",
      });

      loadFriendships();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Friend removed",
        description: "Friend has been removed from your list",
      });

      loadFriendships();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 flex justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-4xl font-bold mb-8 text-gradient">Friends</h1>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              <Users className="w-4 h-4 mr-2" />
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              <Clock className="w-4 h-4 mr-2" />
              Requests ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="add">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4 mt-6">
            {friends.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No friends yet. Start adding friends!</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {friends.map((friendship) => {
                  const friendProfile = friendship.profiles as unknown as Profile;
                  const friendId = friendship.user_id === user?.id ? friendship.friend_id : friendship.user_id;
                  return (
                    <Card key={friendship.id} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar>
                          <AvatarFallback>
                            {(friendProfile?.display_name || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{friendProfile?.display_name || "Unknown"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/friend/${friendId}`)}
                        >
                          View Profile
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFriend(friendship.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4 mt-6">
            {pendingRequests.length === 0 && sentRequests.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No pending requests</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {pendingRequests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Received Requests</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {pendingRequests.map((request) => {
                        const senderProfile = request.profiles as unknown as Profile;
                        return (
                          <Card key={request.id} className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar>
                                <AvatarFallback>
                                  {(senderProfile?.display_name || "U").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-semibold">{senderProfile?.display_name || "Unknown"}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1"
                                onClick={() => respondToRequest(request.id, "accepted")}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => respondToRequest(request.id, "rejected")}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Decline
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sentRequests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Sent Requests</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {sentRequests.map((request) => {
                        const recipientProfile = request.profiles as unknown as Profile;
                        return (
                          <Card key={request.id} className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {(recipientProfile?.display_name || "U").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-semibold">{recipientProfile?.display_name || "Unknown"}</p>
                                <p className="text-sm text-muted-foreground">Pending</p>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4 mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Search for Friends</h3>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search by name..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchUsers()}
                />
                <Button onClick={searchUsers}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((profile) => (
                    <Card key={profile.id} className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {(profile.display_name || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{profile.display_name || "Unknown"}</p>
                        </div>
                        <Button
                          onClick={() => sendFriendRequest(profile.id)}
                          disabled={
                            friends.some(f => 
                              f.friend_id === profile.id || f.user_id === profile.id
                            ) ||
                            sentRequests.some(r => r.friend_id === profile.id)
                          }
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Friend
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Friends;

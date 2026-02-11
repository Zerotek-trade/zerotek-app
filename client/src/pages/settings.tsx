import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ImageUpload } from "@/components/image-upload";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Calendar, 
  LogOut, 
  Shield, 
  Palette, 
  Loader2, 
  Check, 
  AtSign,
  BookOpen,
  Wallet,
  TrendingUp,
  Bot,
  BarChart3,
  LineChart,
  Target,
  Zap,
  Clock,
  DollarSign,
  ArrowRight,
  ChevronRight,
  Lightbulb,
  HelpCircle,
  Sparkles,
  Activity,
  PieChart,
  Settings2,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Settings() {
  const { user, logout, isLoggingOut, refetchUser } = useAuth();
  const { toast } = useToast();

  const [initialized, setInitialized] = useState(false);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileImageData, setProfileImageData] = useState<string | null>(null);

  useEffect(() => {
    if (user && !initialized) {
      setUsername(user.username || "");
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setProfileImageData(user.profileImageData || null);
      setInitialized(true);
    }
  }, [user, initialized]);

  const updateProfile = useMutation({
    mutationFn: async (data: { username?: string; firstName?: string; lastName?: string; profileImageData?: string | null }) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      refetchUser?.();
      toast({ title: "profile updated", description: "your changes have been saved" });
    },
    onError: (err: any) => {
      toast({ title: "error", description: err.message || "failed to update profile", variant: "destructive" });
    },
  });

  const handleSaveProfile = () => {
    updateProfile.mutate({
      username: username || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      profileImageData: profileImageData,
    });
  };

  const hasChanges = 
    (username !== (user?.username || "")) ||
    (firstName !== (user?.firstName || "")) ||
    (lastName !== (user?.lastName || "")) ||
    (profileImageData !== (user?.profileImageData || null));

  const avatarFallback = user?.firstName?.[0] || user?.username?.[0] || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-medium">settings</h1>
        <p className="text-sm text-muted-foreground">
          manage your account and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* profile */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              profile
            </CardTitle>
            <CardDescription>
              customize your profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ImageUpload
              value={profileImageData}
              onChange={setProfileImageData}
              fallback={avatarFallback}
              disabled={updateProfile.isPending}
              maxSizeKB={500}
              maxDimension={400}
            />

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm flex items-center gap-1">
                  <AtSign className="h-3 w-3" />
                  username
                </Label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="off"
                  placeholder="enter username"
                  value={username || ""}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  maxLength={50}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                  data-testid="input-username"
                />
                <p className="text-xs text-muted-foreground">
                  lowercase letters, numbers and underscores only
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm">first name</Label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="off"
                    placeholder="first name"
                    value={firstName || ""}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm">last name</Label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="off"
                    placeholder="last name"
                    value={lastName || ""}
                    onChange={(e) => setLastName(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                    data-testid="input-last-name"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">email</span>
                <span className="ml-auto font-mono">{user?.email || "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">joined</span>
                <span className="ml-auto">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">account type</span>
                <Badge className="ml-auto bg-primary/10 text-primary border-primary/20">
                  early user
                </Badge>
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={!hasChanges || updateProfile.isPending}
              className="w-full"
              data-testid="button-save-profile"
            >
              {updateProfile.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              save changes
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* appearance */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                appearance
              </CardTitle>
              <CardDescription>
                customize how zerotek looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">theme</p>
                  <p className="text-xs text-muted-foreground">
                    switch between light and dark mode
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* danger zone */}
          <Card className="glass-card border-destructive/20">
            <CardHeader>
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">log out</p>
                  <p className="text-xs text-muted-foreground">
                    sign out of your account on this device
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={logout}
                  disabled={isLoggingOut}
                  data-testid="button-logout"
                >
                  {isLoggingOut && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  log out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

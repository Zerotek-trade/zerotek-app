import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  TrendingUp,
  Bot,
  History,
  Settings,
  LogOut,
  Droplets,
  Layers,
  BookOpen,
  Newspaper,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";

const mainNav = [
  { title: "dashboard", url: "/app", icon: LayoutDashboard },
  { title: "faucet", url: "/app/faucet", icon: Droplets },
  { title: "markets", url: "/app/markets", icon: TrendingUp },
  { title: "positions", url: "/app/positions", icon: Layers },
  { title: "agent", url: "/app/agent", icon: Bot },
  { title: "live news", url: "/app/news", icon: Newspaper },
  { title: "history", url: "/app/history", icon: History },
  { title: "guidebook", url: "/app/guidebook", icon: BookOpen },
  { title: "settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (url: string) => {
    if (url === "/app") return location === "/app" || location === "/";
    return location.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Brand asLink href="/app" size="md" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground">
            menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        <div className="flex items-center gap-3 rounded-md bg-sidebar-accent/50 p-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageData || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "u"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName || user?.email?.split("@")[0] || "user"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            data-testid="button-logout"
            className="shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <a
          href="https://x.com/zerotekdotfun"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          data-testid="link-twitter"
        >
          follow us on x
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useState, useEffect } from "react";
import InstallButton from "@/components/pwa/install-button";
import NotificationButton from "@/components/shared/notification-button";
import IOSInstallGuide from "@/components/shared/ios-install-guide";
import { NotificationIndicator } from "./notification-indicator";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Ensure header always has blur background regardless of scroll
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerClass = "translate-y-0 opacity-100";
  const backgroundClass = "bg-white/70 backdrop-blur-lg shadow-sm";

  const {
    isPushSupported,
    isPushEnabled,
    pushStatus,
    enablePushNotifications,
    disablePushNotifications,
  } = usePushNotifications();

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );
  };

  React.useState(() => {
    if (isIOS() && !isPushEnabled && isPushSupported) {
      setOpen(true);
    }
  });
  // Get user initials for avatar
  const userInitials = user?.name
    ? (() => {
        const names = user.name.trim().split(" ");
        const firstInitial = names[0]?.[0] || "";
        const lastInitial = names.length > 1 ? names[names.length - 1][0] : "";
        return (firstInitial + lastInitial).toUpperCase();
      })()
    : "U";

  return (
    <header
      className={`px-4 w-full fixed py-3 flex items-center justify-between transition-transform duration-300 ease-in-out ${headerClass} ${backgroundClass}`}
      style={{ zIndex: 50, paddingTop: 49 }}
    >
      <div className="flex items-center">
        <Link href="/dashboard">
          <a className="flex items-center">
            <img
              src="/logo.png"
              alt="Nós Juntos"
              className="h-10 drop-shadow-sm"
            />
          </a>
        </Link>
      </div>

      <div className="flex items-center space-x-3">
        {/* <InstallButton />
        <IOSInstallGuide open={open} /> */}
        <NotificationIndicator
          size="sm"
          showLabel={false}
          className="text-primary"
        />

        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-8 h-8 rounded-full p-0 overflow-hidden bg-gradient-primary text-white hover:opacity-90 transition-opacity"
            >
              {userInitials}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <Link href="/insights">
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <a>
                    <span className="material-icons mr-2 text-primary/80 text-sm">
                      insights
                    </span>
                    <span>Insights de Relacionamento</span>
                  </a>
                </DropdownMenuItem>
              </Link>

              {!user?.partnerId && (
                <Link href="/invite-partner">
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <a>
                      <span className="material-icons mr-2 text-primary/80 text-sm">
                        people
                      </span>
                      <span>Convidar parceiro</span>
                    </a>
                  </DropdownMenuItem>
                </Link>
              )}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <>
                  <span className="material-icons mr-2 text-red-500 text-sm animate-spin">
                    autorenew
                  </span>
                  <span>Saindo...</span>
                </>
              ) : (
                <>
                  <span className="material-icons mr-2 text-red-500 text-sm">
                    logout
                  </span>
                  <span>Sair</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

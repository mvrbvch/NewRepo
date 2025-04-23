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
import { useState } from "react";
import InstallButton from "@/components/pwa/install-button";
import NotificationButton from "@/components/shared/notification-button";
import IOSInstallGuide from "@/components/shared/ios-install-guide";
import { NotificationIndicator } from "./notification-indicator";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get user initials for avatar
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header
      style={{ paddingTop: 50 }}
      className="px-4 py-3 flex items-center justify-between border-b bg-primary-dark shadow-md text-white"
    >
      <div className="flex items-center">
        <Link href="/">
          <a className="flex items-center">
            <img
              src="/logo-white.png"
              alt="Por Nós"
              className="h-10 drop-shadow-sm"
            />
          </a>
        </Link>
      </div>

      <div className="flex items-center space-x-3">
        <InstallButton />
        <IOSInstallGuide />
        <NotificationIndicator
          size="sm"
          showLabel={false}
          className="text-white"
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
              <DropdownMenuItem className="cursor-pointer">
                <span className="material-icons mr-2 text-primary/80 text-sm">
                  person
                </span>
                <span>Perfil</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer">
                <span className="material-icons mr-2 text-primary/80 text-sm">
                  settings
                </span>
                <span>Configurações</span>
              </DropdownMenuItem>

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

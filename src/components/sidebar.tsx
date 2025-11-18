
"use client";

import { Logo } from "@/components/logo";
import { SidebarNav } from "./sidebar-nav";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { LogOut, User as UserIcon, Settings } from "lucide-react";
import Link from "next/link";
import { doc } from "firebase/firestore";

export function Sidebar() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card shadow-lg">
      <div className="p-4 border-b">
        <Logo />
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <SidebarNav />
      </div>
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={userData?.photoURL || null}
                  alt="Avatar de usuario"
                />
                <AvatarFallback>
                  <UserIcon />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                 <p className="text-sm font-medium leading-none">
                    {user?.displayName || "Usuario"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate max-w-[150px]">
                    {user?.email}
                  </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.displayName || "Usuario"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/perfil">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

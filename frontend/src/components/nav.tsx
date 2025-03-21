"use client";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { FaTicket } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Search } from "lucide-react";
import { subscribeToMessages } from "@/api/getMessagesLive";

export default function NavigationMenuBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in when component mounts
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // Reset unread messages if user is on the messages page
  useEffect(() => {
    if (pathname === "/messages") {
      setUnreadCount(0);
    }
  }, [pathname]);

  // Subscribe to live messages when not on the messages page
  useEffect(() => {
    if (pathname !== "/messages") {
      const eventSource = subscribeToMessages(
        (newMessageData) => {
          console.log("New message received (nav):", newMessageData);
          setUnreadCount((prev) => prev + 1);
        },
        (error) => {
          console.error("SSE connection error in nav:", error);
        }
      );
      return () => eventSource.close();
    }
  }, [pathname]);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Clear the cookie
    document.cookie = "token=; path=/; max-age=0";
    
    // Redirect to login page
    router.push("/login");
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to search page with query parameter
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <NavigationMenu className="w-screen">
      <NavigationMenuList className="flex space-x-4">
        <NavigationMenuItem>
          <NavigationMenuLink href="/">Home</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="relative">
          <NavigationMenuLink href="/messages">Messages</NavigationMenuLink>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500" />
          )}
        </NavigationMenuItem>
      </NavigationMenuList>
      <div className="flex items-center space-x-4">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="transition-all duration-300 ease-in-out transform focus:scale-105 p-1 pl-2 pr-8 rounded-md border border-gray-300 dark:border-neutral-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none"
            placeholder="Search..."
          />
          <button 
            type="submit" 
            className="absolute right-2 text-gray-500 hover:text-gray-700"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
        <NavigationMenuLink href="/ticket">
          <FaTicket className="text-gray-500 dark:text-neutral-500" />
        </NavigationMenuLink>
        
        {isLoggedIn ? (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        ) : (
          <NavigationMenuItem>
            <NavigationMenuLink href="/login">Login</NavigationMenuLink>
          </NavigationMenuItem>
        )}
      </div>
    </NavigationMenu>
  );
}

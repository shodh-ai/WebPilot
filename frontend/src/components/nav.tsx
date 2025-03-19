import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { FaTicket } from "react-icons/fa6";
import { useState } from "react";

export default function NavigationMenuBar() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Search query submitted:", searchQuery);
    // Add your search logic here
  };

  return (
    <NavigationMenu className="w-screen">
      <NavigationMenuList className="flex space-x-4">
        <NavigationMenuItem>
          <NavigationMenuLink href="/">Home</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/messages">Messages</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
      <div className="flex items-center space-x-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="transition-all duration-300 ease-in-out transform focus:scale-105 p-1 rounded-md border border-gray-300 dark:border-neutral-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none"
            placeholder="Search..."
          />
        </form>
        <NavigationMenuLink href="/ticket">
          <FaTicket className="text-gray-500 dark:text-neutral-500" />
        </NavigationMenuLink>
      </div>
    </NavigationMenu>
  );
}

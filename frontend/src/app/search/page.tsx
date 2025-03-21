"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import NavigationMenuBar from "@/components/nav";
import { Card } from "@/components/ui/card";
import { searchPosts } from "@/api/searchPosts";
import { Post } from "@/types/posts";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchSearchResults() {
      if (!query) {
        setPosts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const searchResults = await searchPosts(query);
        setPosts(searchResults);
      } catch (error) {
        console.error("Error searching posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSearchResults();
  }, [query]);

  return (
    <>
      <NavigationMenuBar />
      <div className="flex flex-col overflow-x-hidden overflow-y-auto h-min-screen w-screen p-4">
        <h2 className="text-2xl font-bold mb-6">
          {query ? `Search results for: "${query}"` : "Search Results"}
        </h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-transparent border-solid rounded-full animate-spin"></div>
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((item, index) => (
              <Card key={index} className="p-6 border border-gray-200 rounded-xl dark:border-neutral-700">
                <p className="mb-2 text-sm text-gray-500 dark:text-neutral-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
                <h5 className="font-medium text-sm text-gray-800 dark:text-neutral-200">
                  {item.Title}
                </h5>
                <p className="mt-1 text-sm text-gray-500 dark:text-neutral-500">
                  {item.Content}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8">
            {query ? "No posts found matching your search query." : "Enter a search term to find posts."}
          </div>
        )}
      </div>
    </>
  );
}
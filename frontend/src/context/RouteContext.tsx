"use client";
import React, { createContext, useState, useEffect, useContext } from 'react';
import { usePathname } from 'next/navigation';

interface RouteContextType {
  currentRoute: string;
  routeElements: any[];
  routeMetadata: {
    pageDescription: string;
    context: { [key: string]: any };
  };
  isLoading: boolean;
  error: string | null;
}

const RouteContext = createContext<RouteContextType>({
  currentRoute: '',
  routeElements: [],
  routeMetadata: {
    pageDescription: '',
    context: {}
  },
  isLoading: false,
  error: null
});

export const RouteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [currentRoute, setCurrentRoute] = useState('');
  const [routeElements, setRouteElements] = useState<any[]>([]);
  const [routeMetadata, setRouteMetadata] = useState({
    pageDescription: '',
    context: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract the current route from pathname
    const extractedRoute = pathname.split('/').filter(Boolean)[0] || '/';
    setCurrentRoute(extractedRoute);

    const fetchRouteDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/analyze-route?route=${extractedRoute}`);
        if (!response.ok) {
          throw new Error('Failed to fetch route details');
        }
        const data = await response.json();

        setRouteElements(data.elements || []);
        
        // Set metadata from API response
        setRouteMetadata({
          pageDescription: data.metadata?.pageDescription || '',
          context: data.metadata?.context || {}
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRouteDetails();
  }, [pathname]);

  return (
    <RouteContext.Provider value={{
      currentRoute,
      routeElements,
      routeMetadata,
      isLoading,
      error
    }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRouteContext = () => useContext(RouteContext);
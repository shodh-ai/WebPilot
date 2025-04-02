"use client";
import React, { createContext, useState, useEffect, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface ElementDetails {
  elementName: string;
  elementType: string;
  eventType: string;
  boundFunction: string;
  referencedFunctions: string[];
  elementId?: string;
  elementClass?: string;
  elementText?: string;
}

interface RouteContextType {
  currentRoute: string;
  routeElements: ElementDetails[];
  routeMetadata: {
    pageDescription: string;
    context: { [key: string]: any };
  };
  isLoading: boolean;
  error: string | null;
  refreshRouteInfo: () => Promise<void>; 
}

const RouteContext = createContext<RouteContextType>({
  currentRoute: '',
  routeElements: [],
  routeMetadata: {
    pageDescription: '',
    context: {}
  },
  isLoading: false,
  error: null,
  refreshRouteInfo: async () => {} 
});

export const RouteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [currentRoute, setCurrentRoute] = useState('');
  const [routeElements, setRouteElements] = useState<ElementDetails[]>([]);
  const [routeMetadata, setRouteMetadata] = useState({
    pageDescription: '',
    context: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRouteDetails = async (route?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const extractedRoute = route || pathname.split('/').filter(Boolean)[0] || '/';
      console.log('Fetching details for route:', extractedRoute);
      
      const response = await fetch(`/api/analyze-route?route=${extractedRoute}`);
      if (!response.ok) {
        throw new Error('Failed to fetch route details');
      }
      const data = await response.json();

      const enhancedElements = (data.elements || []).map((element: any) => {
        const enhancedElement: ElementDetails = {
          ...element,
          elementId: element.elementId || '',
          elementClass: element.elementClass || '',
          elementText: element.elementText || ''
        };
        return enhancedElement;
      });

      setRouteElements(enhancedElements);
      console.log('Route elements updated:', enhancedElements);

      // Set metadata from API response
      setRouteMetadata({
        pageDescription: data.metadata?.pageDescription || '',
        context: data.metadata?.context || {}
      });
      console.log('Route metadata updated:', data.metadata);
      
      // Update current route
      setCurrentRoute(extractedRoute);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching route details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const extractedRoute = pathname.split('/').filter(Boolean)[0] || '/';
    
    // Only fetch if the route has changed
    if (extractedRoute !== currentRoute) {
      fetchRouteDetails(extractedRoute);
    }
  }, [pathname, currentRoute]);

  const refreshRouteInfo = async () => {
    await fetchRouteDetails();
  };

  useEffect(() => {
    const handleNavigation = () => {
      console.log('Navigation detected, refreshing route info');
      fetchRouteDetails();
    };

    window.addEventListener('popstate', handleNavigation);
    
    window.addEventListener('routeChanged', handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('routeChanged', handleNavigation);
    };
  }, []);

  return (
    <RouteContext.Provider value={{
      currentRoute,
      routeElements,
      routeMetadata,
      isLoading,
      error,
      refreshRouteInfo
    }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRouteContext = () => useContext(RouteContext);
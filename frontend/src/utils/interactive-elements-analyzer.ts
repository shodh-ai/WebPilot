import { useState } from 'react';

interface InteractiveElement {
  elementName: string;
  elementType?: string;
  eventType?: string;
  boundFunction?: string;
  componentPath?: string;
  referencedFunctions?: string[];
  functionDetails?: {
    complexity?: number;
    dependencies?: string[];
  };
}

export function useInteractiveElementsAnalyzer() {
  const [analysisResult, setAnalysisResult] = useState<{[route: string]: InteractiveElement[]} | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeRoute = async (routeName: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = `/api/analyze-route?route=${encodeURIComponent(routeName)}`;
  
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Get response text first
      const responseText = await response.text();
      
      if (response.status !== 200) {
        throw new Error(`HTTP Error ${response.status}: ${responseText}`);
      }
      
      // Parse JSON
      const data = JSON.parse(responseText);
      setAnalysisResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Route analysis error:', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    analyzeRoute, 
    analysisResult, 
    isLoading, 
    error 
  };
}

export function formatInteractiveElementsForGPT(elements: {[route: string]: InteractiveElement[]} | null) {
  if (!elements) return null;
  
  const formattedElements: {[route: string]: Partial<InteractiveElement>[]} = {};
  
  Object.entries(elements).forEach(([route, routeElements]) => {
    formattedElements[route] = routeElements.map(element => ({
      elementName: element.elementName,
      elementType: element.elementType,
      eventType: element.eventType,
      componentPath: element.componentPath
    }));
  });
  
  return formattedElements;
}
"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { streamOpenAI } from "@/api/openai";
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useRouteContext } from '../context/RouteContext';

export const Pilot: React.FC = () => {
  const { 
    currentRoute, 
    routeElements, 
    routeMetadata 
  } = useRouteContext();

  const [history, setHistory] = useState<string[]>([
    "I'm Rox. Your personal helper for the website. How can I help you today?",
  ]);
  const [isListening, setListening] = useState<boolean>(true);
  const [isActive, setActive] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentResponse, setResponse] = useState<string>("");
  const [initialRouteResponse, setInitialRouteResponse] = useState<string>("");

  const lastProcessedRouteRef = useRef<string | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setListening(true);
  };

  useEffect(() => {
    const prepareContext = () => {
      // Prevent redundant context generation
      if (currentRoute === lastProcessedRouteRef.current) return;

      const interactiveDetails = routeElements.map(el => ({
        elementName: el.elementName,
        elementType: el.elementType,
        eventType: el.eventType,
        boundFunction: el.boundFunction,
        referencedFunctions: el.referencedFunctions
      }));

      const context = JSON.stringify({
        route: currentRoute,
        pageDescription: routeMetadata.pageDescription,
        pageContext: routeMetadata.context,
        interactiveElements: interactiveDetails
      });

      const initialPrompt = `You are Rox, a helpful AI assistant for a web application. 
      You are currently on the ${currentRoute} page. 
      Page Description: ${routeMetadata.pageDescription}
      Page Context: ${JSON.stringify(routeMetadata.context)}
      Interactive Elements: ${JSON.stringify(interactiveDetails)}
      
      Your primary goal is to:
      - Provide context-specific guidance for this page
      - Help users understand page features and actions
      - Offer step-by-step assistance
      - Be conversational and proactively helpful

      Begin with a brief, friendly overview of the current page and its main purpose. Keep the message as concise as possible`;

      // Reset previous response
      setInitialRouteResponse('');

      // Stream the AI response
      streamOpenAI(initialPrompt, (chunk) => {
        setInitialRouteResponse(prev => prev + chunk);
      });

      // Update the last processed route
      lastProcessedRouteRef.current = currentRoute;
    };

    // Only generate context if we have route elements
    // Add a small delay to ensure route is fully loaded
    const timeoutId = setTimeout(() => {
      if (currentRoute && routeElements.length > 0) {
        prepareContext();
      }
    }, 300);

    // Cleanup timeout
    return () => clearTimeout(timeoutId);
  }, [currentRoute, routeElements, routeMetadata]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputValue.trim()) {
      try {
        const userMessage = inputValue.trim();
        setInputValue("");
        setResponse("");
        setLoading(true);
        setListening(true);
        
        // Add user message to history immediately
        setHistory(prevHistory => [...prevHistory, userMessage].slice(-5));
        
        // Enhanced context-aware prompt
        const contextAwarePrompt = `You are Rox, a helpful AI assistant. 
        Current Page: ${currentRoute}
        Page Description: ${routeMetadata.pageDescription}
        Page Context: ${JSON.stringify(routeMetadata.context)}

        User Query: ${userMessage}

        Provide a helpful, context-specific response that:
        - Directly addresses the user's question
        - Relates to the current page's purpose
        - Offers practical guidance
        - Uses a friendly, conversational tone`;

        let tempResponse = "";
        await streamOpenAI(contextAwarePrompt, (chunk) => {
          tempResponse += chunk;
          setResponse(tempResponse);
        });

        // Add the complete AI response to history
        setHistory(prevHistory => [...prevHistory, tempResponse].slice(-5));
      } catch (error) {
        console.error("Error fetching response:", error);
        setResponse("Sorry, there was an error processing your request.");
      } finally {
        setLoading(false);
        setListening(false);
      }
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [history, currentResponse]);

  useEffect(() => {
    if (loading) {
      setListening(true);
    }
  }, [loading]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loading) {
        setListening(false);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [inputValue, loading]);

  // Render initial route context if no chat history
  const renderInitialContent = () => {
    if (initialRouteResponse) {
      return (
        <div 
          className={`flex justify-start text-gray-600 w-[50dvh] bg-white bg-opacity-20 backdrop-blur-lg shadow-md rounded-2xl p-3 text-md font-semibold mb-4 border border-white border-opacity-40`}
        >
          <p>{initialRouteResponse}</p>
        </div>
      );
    }
    return null;
  };

  return isActive ? (
    <div className="fixed top-16 right-0 max-h-[calc(100vh-4rem)] max-w-[50dvw] p-4 flex flex-col overflow-hidden h-max w-max justify-center items-end z-50">
      <motion.div
        className="w-[3rem] h-[3rem] rounded-full bg-blue-500 shadow-md mb-4 flex-shrink-0 flex-grow-0"
        animate={{ scale: isListening ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        ref={messagesEndRef}
        className="flex flex-col overflow-x-hidden overflow-y-auto"
        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        <style jsx>{`
          ::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {/* Render initial route context or chat history */}
        {history.length === 1 ? renderInitialContent() : null}
        {history.map((message, index) => (
          <div
            key={index}
            className={`flex ${index % 2 === 0 ? "justify-end text-gray-500" : "justify-start text-gray-600"} w-[50dvh] bg-white bg-opacity-20 backdrop-blur-lg shadow-md rounded-2xl p-3 text-md font-semibold mb-4 border border-white border-opacity-40`}
          >
            <p>{message}</p>
          </div>
        ))}
        {loading && <div
          className={`w-[50dvh] text-gray-500 bg-white bg-opacity-20 backdrop-blur-lg shadow-md rounded-2xl p-3 text-md font-semibold mb-4 border border-white border-opacity-40`}
        >
          {currentResponse.trim() === "" ? <Skeleton count={2} /> : currentResponse}
        </div>}
      </div>
      <form onSubmit={handleSubmit} className="w-full mt-4">
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Type your message here..."
          value={inputValue}
          onChange={handleInputChange}
        />
      </form>
    </div>
  ) : null;
};
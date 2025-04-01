"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { streamOpenAI, RouteContext } from "@/api/openai";
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useRouteContext } from '../context/RouteContext';
import TTSQueue from "@/components/TTSQueue";

export const Pilot: React.FC = () => {
  const {
    currentRoute,
    routeElements,
    routeMetadata
  } = useRouteContext();
  const [history, setHistory] = useState<string[]>([
    "Hello this is Rox. Your personal helper for the website. How can I help you today?",
  ]);
  const [isListening, setListening] = useState<boolean>(true);
  const [isActive, setActive] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentResponse, setResponse] = useState<string>("");
  const [initialRouteResponse, setInitialRouteResponse] = useState<string>("");
  const [showInitialResponse, setShowInitialResponse] = useState<boolean>(true);
  const [ttsQueue, setTtsQueue] = useState<string[]>([]);

  // Create the current route context object
  const getCurrentRouteContext = (): RouteContext | null => {
    if (!currentRoute) return null;
    
    const interactiveDetails = routeElements.map(el => ({
      elementName: el.elementName,
      elementType: el.elementType,
      eventType: el.eventType,
      boundFunction: el.boundFunction,
      referencedFunctions: el.referencedFunctions
    }));

    return {
      route: currentRoute,
      pageDescription: routeMetadata.pageDescription,
      context: routeMetadata.context,
      interactiveElements: interactiveDetails
    };
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setListening(true);
  };

  const handleDequeue = () => {
    setTtsQueue(prev => prev.slice(1));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputValue.trim()) {
      try {
        const userMessage = inputValue.trim();
        setInputValue("");
        setResponse("");
        setLoading(true);
        setListening(true);
        // Hide initial response when user starts chatting
        setShowInitialResponse(false);

        // Add user message to history immediately
        setHistory(prevHistory => [...prevHistory, userMessage].slice(-5));

        // Pass the current route context to streamOpenAI
        let tempResponse = await streamOpenAI(userMessage, getCurrentRouteContext());

        // Add the complete AI response to history
        if (tempResponse) {
          setHistory(prevHistory => [...prevHistory, tempResponse].slice(-5));
          // Add response to TTS queue
          setTtsQueue(prev => [...prev, tempResponse]);
        }
      } catch (error) {
        console.error("Error fetching response:", error);
        setResponse("Sorry, there was an error processing your request.");
      } finally {
        setLoading(false);
        setListening(false);
      }
    }
  };

  const lastProcessedRouteRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prepareContext = async () => {
      // Prevent redundant context generation
      if (currentRoute === lastProcessedRouteRef.current) return;

      // Get the current route context
      const routeContext = getCurrentRouteContext();
      if (!routeContext) return;

      const initialPrompt = `You are Rox, a helpful AI assistant for a web application.
      You are currently on the ${currentRoute} page.
      Provide a brief, friendly overview of the current page and its main purpose. Keep the message as concise as possible.`;

      // Reset previous response
      setInitialRouteResponse('');
      // Reset history when navigating to a new route
      setHistory(["Hello this is Rox. Your personal helper for the website. How can I help you today?"]);
      // Make sure we show the initial response for the new page
      setShowInitialResponse(true);

      // Stream the AI response with route context
      try {
        const response = await streamOpenAI(initialPrompt, routeContext);
        if (response) {
          setInitialRouteResponse(response);
          // Add initial response to TTS queue
          setTtsQueue(prev => [...prev, response]);
        } else {
          setInitialRouteResponse("I'm ready to help you with this page!");
        }
      } catch (error) {
        console.error("Error generating initial response:", error);
        setInitialRouteResponse("I'm ready to help you with this page!");
      }

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

  const renderInitialContent = () => {
    if (initialRouteResponse && showInitialResponse) {
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

  if (!isActive) return null;

  return (
    <div className="absolute top-0 right-0 max-h-[50dvh] max-w-[50dvw] p-4 flex flex-col overflow-hidden h-max w-max justify-center items-end bg-white z-50">
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
        {/* Only render the initial response OR chat history, not both */}
        {renderInitialContent()}
        {history.length > 1 && history.map((message, index) => (
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
      <div className="w-full mt-4 flex flex-col">
        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="w-full p-2 rounded-lg bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-40"
          />
        </form>
        {/* TTS Queue is now hidden - it's functionality remains but doesn't render an input */}
        {ttsQueue.length > 0 && (
          <div className="hidden">
            <TTSQueue queue={ttsQueue} onDequeue={handleDequeue} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Pilot;
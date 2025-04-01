"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { streamOpenAI, RouteContext } from "@/api/openai";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useRouteContext } from '../context/RouteContext';
import { useWakeWord } from "@/context/WakewordProvider";
import AudioInput from "@/components/AudioInput";
import TTSQueue from "@/components/TTSQueue";

export const Pilot: React.FC = () => {
  const {
    currentRoute,
    routeElements,
    routeMetadata
  } = useRouteContext();

  const [history, setHistory] = useState<string[]>([
    "Hello this is Rox. You personal helper for the website. How can I help you today?",
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
    if (!currentRoute) {
      console.log("No currentRoute defined.");
      return null;
    }
    
    const interactiveDetails = routeElements.map(el => ({
      elementName: el.elementName,
      elementType: el.elementType,
      eventType: el.eventType,
      boundFunction: el.boundFunction,
      referencedFunctions: el.referencedFunctions
    }));

    const routeContext: RouteContext = {
      route: currentRoute,
      pageDescription: routeMetadata.pageDescription,
      context: routeMetadata.context,
      interactiveElements: interactiveDetails
    };
    console.log("Constructed routeContext: ", routeContext);
    return routeContext;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setListening(true);
    console.log("Input changed: ", event.target.value);
  };

  const handleDequeue = () => {
    setTtsQueue(prev => {
      const newQueue = prev.slice(1);
      console.log("Dequeued TTS item. New queue: ", newQueue);
      return newQueue;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputValue.trim()) {
      try {
        const userMessage = inputValue.trim();
        console.log("User input submitted: ", userMessage);
        setInputValue("");
        setResponse("");
        setLoading(true);
        setListening(true);

        // Add user message to history immediately
        setHistory(prevHistory => {
          const newHistory = [...prevHistory, userMessage].slice(-5);
          console.log("Updated history after user message: ", newHistory);
          return newHistory;
        });

        // Pass the current route context to streamOpenAI
        const routeContext = getCurrentRouteContext();
        let tempResponse = await streamOpenAI(userMessage, routeContext);
        console.log("Response from streamOpenAI: ", tempResponse);

        // Add the complete AI response to history and enqueue for TTS
        if (tempResponse) {
          setHistory(prevHistory => {
            const newHistory = [...prevHistory, tempResponse].slice(-5);
            console.log("Updated history after AI response: ", newHistory);
            return newHistory;
          });
          setTtsQueue(prev => {
            const newQueue = [...prev, tempResponse];
            console.log("Updated TTS queue: ", newQueue);
            return newQueue;
          });
        }
      } catch (error) {
        console.error("Error fetching response:", error);
        setResponse("Sorry, there was an error processing your request.");
      } finally {
        setLoading(false);
        setListening(false);
        console.log("Finished handling submit. Loading:", loading, "Listening:", isListening);
      }
    }
  };

  const lastProcessedRouteRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prepareContext = async () => {
      if (currentRoute === lastProcessedRouteRef.current) {
        console.log("Route already processed:", currentRoute);
        return;
      }

      const routeContext = getCurrentRouteContext();
      if (!routeContext) {
        console.log("No route context available.");
        return;
      }

      const initialPrompt = `You are Rox, a helpful AI assistant for a web application.
You are currently on the ${currentRoute} page.
Provide a brief, friendly overview of the current page and its main purpose. Keep the message as concise as possible.`;
      console.log("Initial prompt for route overview: ", initialPrompt);

      // Reset previous response and history when navigating to a new route
      setInitialRouteResponse('');
      setHistory(["Hello this is Rox. Your personal helper for the website. How can I help you today?"]);
      setShowInitialResponse(true);

      try {
        const response = await streamOpenAI(initialPrompt, routeContext);
        console.log("Received initial route response: ", response);
        if (response) {
          setInitialRouteResponse(response);
          setTtsQueue(prev => {
            const newQueue = [...prev, response];
            console.log("Updated TTS queue with initial response: ", newQueue);
            return newQueue;
          });
        } else {
          setInitialRouteResponse("I'm ready to help you with this page!");
          console.log("Default initial response set.");
        }
      } catch (error) {
        console.error("Error generating initial response:", error);
        setInitialRouteResponse("I'm ready to help you with this page!");
      }

      lastProcessedRouteRef.current = currentRoute;
      console.log("Updated lastProcessedRouteRef to: ", currentRoute);
    };

    const timeoutId = setTimeout(() => {
      if (currentRoute && routeElements.length > 0) {
        console.log("Preparing context for route:", currentRoute);
        prepareContext();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentRoute, routeElements, routeMetadata]);

  // const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  //   event.preventDefault();
  //   if (inputValue.trim()) {
  //     try {
  //       const userMessage = inputValue.trim();
  //       setInputValue("");
  //       setResponse("");
  //       setLoading(true);
  //       setIsListening(true);

  //       // Add user message to history immediately
  //       setHistory(prevHistory => [...prevHistory, userMessage].slice(-5));

  //       // Enhanced context-aware prompt
  //       const contextAwarePrompt = `You are Rox, a helpful AI assistant.
  //       Current Page: ${currentRoute}
  //       Page Description: ${routeMetadata.pageDescription}
  //       Page Context: ${JSON.stringify(routeMetadata.context)}

  //       User Query: ${userMessage}

  //       Provide a helpful, context-specific response that:
  //       - Directly addresses the user's question
  //       - Relates to the current page's purpose
  //       - Offers practical guidance
  //       - Uses a friendly, conversational tone`;

  //       let tempResponse = "";
  //       await streamOpenAI(contextAwarePrompt, (chunk) => {
  //         tempResponse += chunk;
  //         setResponse(tempResponse);
  //       });

  //       // Add the complete AI response to history
  //       setHistory(prevHistory => [...prevHistory, tempResponse].slice(-5));
  //     } catch (error) {
  //       console.error("Error fetching response:", error);
  //       setResponse("Sorry, there was an error processing your request.");
  //     } finally {
  //       setLoading(false);
  //       setIsListening(false);
  //     }
  //   }
  // };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
      console.log("Auto-scrolled messages container.");
    }
  }, [history, currentResponse]);

  useEffect(() => {
    if (loading) {
      setListening(true);
      console.log("Loading started, setting listening to true.");
    }
  }, [loading]);

  const renderInitialContent = () => {
    if (initialRouteResponse && showInitialResponse) {
      console.log("Rendering initial content.");
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

  if (!isActive) {
    console.log("Component not active, returning null.");
    return null;
  }

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
        {renderInitialContent()}
        {history.length > 1 && history.map((message, index) => (
          <div
            key={index}
            className={`flex ${index % 2 === 0 ? "justify-end text-gray-500" : "justify-start text-gray-600"} w-[50dvh] bg-white bg-opacity-20 backdrop-blur-lg shadow-md rounded-2xl p-3 text-md font-semibold mb-4 border border-white border-opacity-40`}
          >
            <p>{message}</p>
          </div>
        ))}
        {loading && (
          <div className={`w-[50dvh] text-gray-500 bg-white bg-opacity-20 backdrop-blur-lg shadow-md rounded-2xl p-3 text-md font-semibold mb-4 border border-white border-opacity-40`}>
            {currentResponse.trim() === "" ? <Skeleton count={2} /> : currentResponse}
          </div>
        )}
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

"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { streamOpenAI } from "@/api/openai";
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
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

  const { isPilotActive, setPilotActive, sessionId } = useWakeWord();

  const [isListening, setIsListening] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [history, setHistory] = useState<string[]>([
    "Hello this is Rox. Your personal helper for the website. How can I help you today?",
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentResponse, setResponse] = useState<string>("");
  const [initialRouteResponse, setInitialRouteResponse] = useState<string>("");
  const [ttsQueue, setTtsQueue] = useState<string[]>([]);
  const [accumulatedText, setAccumulatedText] = useState<string>("");

  const lastProcessedRouteRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setIsListening(true);
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
        setIsListening(true);
        
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
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [history, currentResponse]);

  useEffect(() => {
    setHistory(["Hello this is Rox. Your personal helper for the website. How can I help you today?"]);
    setTtsQueue([]);
    setResponse("");
    setAccumulatedText("");
  }, [sessionId]);

  const handleTranscription = async (transcript: string) => {
    if (!transcript.trim()) return;

    try {
      const userMessage = transcript.trim();
      setResponse("");
      setLoading(true);
      setHistory((prev) => [...prev, userMessage]);

      const currentSession = sessionId; 
      let localAccumulated = "";
      await streamOpenAI(userMessage, (chunk) => {
        if (currentSession !== sessionId) return;

        localAccumulated += chunk;
        setResponse(localAccumulated);

        const regex = /([^.!?]+[.!?]+)/g;
        let match;
        let lastIndex = 0;
        const newSentences: string[] = [];
        while ((match = regex.exec(localAccumulated)) !== null) {
          newSentences.push(match[0].trim());
          lastIndex = regex.lastIndex;
        }
        if (newSentences.length > 0) {
          setHistory((prev) => [...prev, ...newSentences]);
          setTtsQueue((prev) => [...prev, ...newSentences]);
          localAccumulated = localAccumulated.slice(lastIndex);
        }
        setAccumulatedText(localAccumulated);
      });
      if (localAccumulated.trim()) {
        setHistory((prev) => [...prev, localAccumulated.trim()]);
      }
    } catch (error) {
      console.error("Error fetching response:", error);
      setResponse("Sorry, there was an error processing your request.");
    } finally {
      setLoading(false);
    }
  };

  const handleDequeue = () => {
    setTtsQueue((prev) => prev.slice(1));
  };

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

  if (!isPilotActive) return null;

  return (
    <div className="absolute top-15 right-0 max-h-[50dvh] max-w-[50dvw] p-4 flex flex-col overflow-hidden h-max w-max justify-center items-end">
      <button
        onClick={() => setPilotActive(false)}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-lg shadow-md rounded-full text-gray-500 hover:bg-opacity-40 transition"
      >
        ✕
      </button>
      <motion.div
        className={`w-[3rem] h-[3rem] rounded-full shadow-md mb-4 flex-shrink-0 flex-grow-0 ${
          isListening ? "bg-blue-500" : "bg-gray-500"
        }`}
        animate={isListening ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 1.5, repeat: isListening ? Infinity : 0, ease: "easeInOut" }}
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
            className={`flex ${
              index % 2 === 0 ? "justify-end text-gray-500" : "justify-start text-gray-600"
            } w-[50dvh] bg-white bg-opacity-20 backdrop-blur-lg shadow-md rounded-2xl p-3 text-md font-semibold mb-4 border border-white border-opacity-40`}
          >
            <p>{message}</p>
          </div>
        ))}
        {loading && (
          <div className="w-[50dvh] text-gray-500 bg-white bg-opacity-20 backdrop-blur-lg shadow-md rounded-2xl p-3 text-md font-semibold mb-4 border border-white border-opacity-40">
            {currentResponse.trim() === "" ? <Skeleton count={2} /> : currentResponse}
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="w-full mt-4">
        <input 
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="w-full p-2 rounded-lg bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-40"
        />
      </form>
      <AudioInput
        key={sessionId.toString()}
        onTranscription={handleTranscription}
        onAudioStart={() => setIsListening(true)}
        onAudioEnd={() => setIsListening(false)}
      />
      <TTSQueue queue={ttsQueue} onDequeue={handleDequeue} />
    </div>
  );
};

export default Pilot;
"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { streamOpenAI } from "@/api/openai";
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useWakeWord } from '@/context/WakewordProvider';
        
export default function Pilot() {
  const { isPilotActive } = useWakeWord();

  const [history, setHistory] = useState<string[]>([
    "Hello this is Rox. Your personal helper for the website. How can I help you today?",
  ]);
  const [isListening, setListening] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentResponse, setResponse] = useState<string>("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setListening(true);
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
        
        // Add user message to history immediately
        setHistory(prevHistory => [...prevHistory, userMessage].slice(-5));
        
        let tempResponse = "";
        await streamOpenAI(userMessage, (chunk) => {
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

  return isPilotActive ? (
    <div className="absolute top-0 right-0 max-h-[50dvh] max-w-[50dvw] p-4 flex flex-col overflow-hidden h-max w-max justify-center items-end">
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
}

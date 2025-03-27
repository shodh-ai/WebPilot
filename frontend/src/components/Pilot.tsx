"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { streamOpenAI } from "@/api/openai";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useWakeWord } from "@/context/WakewordProvider";
import AudioInput from "@/components/AudioInput";
import TTSQueue from "@/components/TTSQueue";

export default function Pilot() {
  const { isPilotActive, setPilotActive, sessionId } = useWakeWord();

  const [isListening, setIsListening] = useState(false);
  const [history, setHistory] = useState<string[]>([
    "Hello this is Rox. Your personal helper for the website. How can I help you today?",
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentResponse, setResponse] = useState<string>("");
  const [ttsQueue, setTtsQueue] = useState<string[]>([]);
  const [accumulatedText, setAccumulatedText] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [history, currentResponse]);

  useEffect(() => {
    setHistory([
      "Hello this is Rox. Your personal helper for the website. How can I help you today?",
    ]);
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
      await streamOpenAI(
        userMessage,
        (chunk) => {
          if (currentSession !== sessionId) return;
          localAccumulated = chunk;
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
        },
        // This callback receives the natural language formatted tool output.
        (functionOutput) => {
          setHistory((prev) => [...prev, functionOutput]);
          setTtsQueue((prev) => [...prev, functionOutput]);
        }
      );
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

  // if (!isPilotActive) return null;

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
      {/* Text input section */}
      <div className="w-full flex mb-4">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow p-3 rounded-l-2xl bg-white bg-opacity-20 backdrop-blur-lg shadow-md border border-white border-opacity-40 text-gray-600 focus:outline-none"
        />
        <button
          onClick={() => {
            if (textInput.trim()) {
              handleTranscription(textInput);
              setTextInput("");
            }
          }}
          className="p-3 rounded-r-2xl bg-blue-500 hover:bg-blue-600 transition text-white shadow-md border border-white border-opacity-40"
        >
          Send
        </button>
      </div>
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
      <AudioInput
        key={sessionId.toString()}
        onTranscription={handleTranscription}
        onAudioStart={() => setIsListening(true)}
        onAudioEnd={() => setIsListening(false)}
      />
      <TTSQueue queue={ttsQueue} onDequeue={handleDequeue} />
    </div>
  );
}

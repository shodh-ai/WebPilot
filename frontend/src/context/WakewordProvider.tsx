"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePorcupine } from "@picovoice/porcupine-react";

interface WakeWordContextProps {
  isPilotActive: boolean;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
}

const WakeWordContext = createContext<WakeWordContextProps>({
  isPilotActive: false,
  startListening: async () => {},
  stopListening: async () => {},
});

export const WakeWordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPilotActive, setIsPilotActive] = useState(false);

  const {
    keywordDetection,
    isLoaded,
    isListening,
    error,
    init,
    start,
    stop,
    release,
  } = usePorcupine();

  // Define the functions first
  const startListening = useCallback(async () => {
    if (isLoaded && !isListening) {
      await start();
    }
  }, [isLoaded, isListening, start]);

  const stopListening = useCallback(async () => {
    if (isListening) {
      await stop();
    }
  }, [isListening, stop]);

  useEffect(() => {
    const wakewordKey = process.env.NEXT_PUBLIC_WAKEWORD_KEY;
    if (!wakewordKey) {
      console.error("NEXT_PUBLIC_WAKEWORD_KEY is not defined in your environment variables.");
      return;
    }
    const porcupineKeyword = {
      publicPath: "/Hi-Rox_en_wasm_v3_0_0/Hi-Rox_en_wasm_v3_0_0.ppn",
      label: "Hi Rox",
    };
    const porcupineModel = { publicPath: "/porcupine_params.pv" };

    init(wakewordKey, porcupineKeyword, porcupineModel).catch((err) => {
      console.error("Error initializing Porcupine:", err);
    });
  }, [init]);

  // Start listening when ready
  useEffect(() => {
    if (isLoaded && !isListening) {
      startListening();
      console.log("Porcupine is loaded and listening started");
    }
  }, [isLoaded, isListening, startListening]);

  useEffect(() => {
    console.log("isListening:", isListening);
  }, [isListening]);

  useEffect(() => {
    if (error) {
      console.error("Porcupine error:", error);
    }
  }, [error]);

  useEffect(() => {
    if (keywordDetection !== null) {
      console.log(`Porcupine detected keyword: ${keywordDetection.label}`);
      setIsPilotActive(true);
    }
  }, [keywordDetection]);

  useEffect(() => {
    return () => {
      release();
    };
  }, [release]);

  return (
    <WakeWordContext.Provider value={{ isPilotActive, startListening, stopListening }}>
      {children}
    </WakeWordContext.Provider>
  );
};

export const useWakeWord = () => useContext(WakeWordContext);

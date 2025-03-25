"use client";

import { useEffect, useRef } from "react";

interface AudioInputProps {
  onTranscription: (transcript: string) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
}

export default function AudioInput({ onTranscription, onAudioStart, onAudioEnd }: AudioInputProps) {
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        console.log("Voice recognition started.");
        if (onAudioStart) onAudioStart();
        inactivityTimer.current = setTimeout(() => {
          console.log("Inactivity timeout reached, stopping recognition.");
          recognition.stop();
        }, 10000);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
          inactivityTimer.current = null;
        }
        const transcript = event.results[0][0].transcript;
        onTranscription(transcript);
      };

      recognition.onerror = (err) => {
        if (err.error != "aborted") {
          console.error("Speech recognition error:", err);
        }
      };

      recognition.onend = () => {
        console.log("Voice recognition ended.");
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
          inactivityTimer.current = null;
        }
        if (onAudioEnd) onAudioEnd();
      };

      recognition.start();
    } else {
      console.error("Speech Recognition API not supported in this browser.");
    }
  }, [onTranscription, onAudioStart, onAudioEnd]);

  return null;
}

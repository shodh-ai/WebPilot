"use client";

import { useEffect, useState } from "react";
import * as tts from "@diffusionstudio/vits-web";

interface AudioOutputProps {
  text: string;
  sessionId: number;
  voiceId?: string;
  onPlaybackFinished?: () => void;
}

export default function AudioOutput({
  text,
  sessionId,
  voiceId = "en_US-hfc_female-medium",
  onPlaybackFinished,
}: AudioOutputProps) {
  const [audioUrl, setAudioUrl] = useState<string>("");

  useEffect(() => {
    if (!text.trim()) return;
    async function synthesize() {
      try {
        const blob = await tts.predict({ text, voiceId });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      } catch (error) {
        console.error("Error synthesizing audio:", error);
      }
    }
    synthesize();
  }, [text, voiceId]);

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl("");
        if (onPlaybackFinished) onPlaybackFinished();
      };
      return () => {
        audio.pause();
        URL.revokeObjectURL(audioUrl);
        setAudioUrl("");
      };
    }
  }, [audioUrl, sessionId, onPlaybackFinished]);

  return null;
}

"use client";

import AudioOutput from "./AudioOutput";

interface TTSQueueProps {
  queue: string[];
  onDequeue: () => void;
}

export default function TTSQueue({ queue, onDequeue }: TTSQueueProps) {
  return queue.length > 0 ? (
    <AudioOutput text={queue[0]} onPlaybackFinished={onDequeue} />
  ) : null;
}

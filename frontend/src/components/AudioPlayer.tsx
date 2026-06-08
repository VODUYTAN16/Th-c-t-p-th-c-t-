import { useEffect, useRef } from "react";

interface AudioPlayerProps {
  audioBase64: string | null;
  onEnded?: () => void;
}

export default function AudioPlayer({ audioBase64, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioBase64) return;
    const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
    audioRef.current = audio;
    audio.onended = () => onEnded?.();
    audio.play().catch(() => {});
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioBase64, onEnded]);

  return null;
}

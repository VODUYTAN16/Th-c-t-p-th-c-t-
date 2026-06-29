import { useEffect, useRef, useState } from "react";
import { PlayCircleIcon } from "@heroicons/react/24/solid";

interface AudioPlayerProps {
  audioBase64: string | null;
  onEnded?: () => void;
}

export default function AudioPlayer({ audioBase64, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!audioBase64) return;
    const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
    audioRef.current = audio;
    audio.onended = () => {
      setBlocked(false);
      onEnded?.();
    };
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.error("Audio playback failed:", err);
        // Browser blocked autoplay due to lack of interaction
        if (err.name === "NotAllowedError") {
          setBlocked(true);
        } else {
          onEnded?.(); // Ignore other errors to continue
        }
      });
    }

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioBase64, onEnded]);

  if (!blocked) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white p-3 rounded-xl shadow-lg border border-red-100 flex items-center gap-3 animate-bounce">
      <span className="text-sm font-medium text-red-600">Trình duyệt chặn âm thanh</span>
      <button 
        onClick={() => {
          audioRef.current?.play();
          setBlocked(false);
        }}
        className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
      >
        <PlayCircleIcon className="w-5 h-5" />
        Phát
      </button>
    </div>
  );
}

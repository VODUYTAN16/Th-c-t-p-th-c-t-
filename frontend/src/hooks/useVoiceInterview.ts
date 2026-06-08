import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL as string;
const WS_URL = API_URL.replace(/^http/, "ws");

interface TranscriptMessage {
  role: string;
  content: string;
  message_type?: string;
}

interface UseVoiceInterviewOptions {
  sessionId: string;
  token: string;
  onComplete?: () => void;
}

export function useVoiceInterview({ sessionId, token, onComplete }: UseVoiceInterviewOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/ws/interview/${sessionId}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setError("Lỗi kết nối WebSocket");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "interviewer_speech") {
        setMessages((prev) => [
          ...prev,
          { role: "interviewer", content: data.text, message_type: data.message_type },
        ]);
        if (data.audio_base64) {
          setCurrentAudio(data.audio_base64);
          setIsAiSpeaking(true);
        }
        if (data.question_id) setCurrentQuestionId(data.question_id);
        if (data.question_index !== undefined) setQuestionIndex(data.question_index);
        if (data.total_questions) setTotalQuestions(data.total_questions);
      }

      if (data.type === "transcript" && data.final && data.text) {
        setMessages((prev) => [
          ...prev,
          { role: "candidate", content: data.text, message_type: "answer" },
        ]);
      }

      if (data.type === "interview_complete") {
        setIsComplete(true);
        setMessages((prev) => [
          ...prev,
          { role: "system", content: data.text, message_type: "system" },
        ]);
        onComplete?.();
      }

      if (data.type === "error") {
        setError(data.message);
      }
    };

    return () => ws.close();
  }, [sessionId, token, onComplete]);

  const sendAudioChunk = useCallback(
    (audioBase64: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN && currentQuestionId) {
        wsRef.current.send(
          JSON.stringify({
            type: "audio_chunk",
            audio_base64: audioBase64,
            question_id: currentQuestionId,
          })
        );
      }
    },
    [currentQuestionId]
  );

  const endInterview = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "end_interview" }));
  }, []);

  const onAudioEnded = useCallback(() => {
    setIsAiSpeaking(false);
    setCurrentAudio(null);
  }, []);

  return {
    connected,
    messages,
    currentAudio,
    questionIndex,
    totalQuestions,
    isComplete,
    error,
    isAiSpeaking,
    sendAudioChunk,
    endInterview,
    onAudioEnded,
  };
}

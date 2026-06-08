import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AudioPlayer from "../components/AudioPlayer";
import InterviewProgress from "../components/InterviewProgress";
import MicRecorder from "../components/MicRecorder";
import TranscriptPanel from "../components/TranscriptPanel";
import { useAuth } from "../contexts/AuthContext";
import { useVoiceInterview } from "../hooks/useVoiceInterview";
import { apiFetch } from "../lib/api";

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [completing, setCompleting] = useState(false);

  const handleComplete = useCallback(async () => {
    if (!sessionId || !accessToken) return;
    setCompleting(true);
    try {
      await apiFetch(`/sessions/${sessionId}/complete`, { method: "POST" }, accessToken);
      navigate(`/report/${sessionId}`);
    } catch {
      navigate(`/report/${sessionId}`);
    }
  }, [sessionId, accessToken, navigate]);

  const {
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
  } = useVoiceInterview({
    sessionId: sessionId!,
    token: accessToken!,
    onComplete: handleComplete,
  });

  const handleEnd = () => {
    endInterview();
    handleComplete();
  };

  if (!sessionId || !accessToken) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Phòng phỏng vấn</h1>
        <span className={`text-sm px-3 py-1 rounded-full ${connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {connected ? "Đã kết nối" : "Đang kết nối..."}
        </span>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>}

      {totalQuestions > 0 && (
        <InterviewProgress current={questionIndex} total={totalQuestions} />
      )}

      <TranscriptPanel messages={messages} />

      <AudioPlayer audioBase64={currentAudio} onEnded={onAudioEnded} />

      <div className="flex flex-col items-center gap-4 py-6">
        {!isComplete && (
          <>
            <MicRecorder
              onAudioChunk={sendAudioChunk}
              disabled={isAiSpeaking || !connected}
            />
            <button
              onClick={handleEnd}
              className="text-sm text-red-500 hover:underline"
            >
              Kết thúc phỏng vấn
            </button>
          </>
        )}
        {isComplete && (
          <div className="text-center">
            <p className="text-green-600 font-medium mb-3">Phỏng vấn đã kết thúc!</p>
            <button
              onClick={handleComplete}
              disabled={completing}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {completing ? "Đang đánh giá..." : "Xem báo cáo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

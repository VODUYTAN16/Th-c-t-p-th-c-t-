import { useCallback, useRef, useState } from "react";

interface MicRecorderProps {
  onAudioChunk: (base64: string) => void;
  disabled?: boolean;
}

export default function MicRecorder({ onAudioChunk, disabled }: MicRecorderProps) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const sendFullRecording = useCallback(() => {
    if (chunksRef.current.length === 0) return;
    // Gop toan bo cac manh thanh 1 blob WebM hoan chinh (co header)
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    chunksRef.current = [];
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (base64) onAudioChunk(base64);
    };
    reader.readAsDataURL(blob);
  }, [onAudioChunk]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      // Chi gui khi dung han -> blob day du header, STT decode duoc
      recorder.onstop = () => {
        sendFullRecording();
      };

      // Khong dung timeslice: ghi lien tuc, chi xuat data khi stop()
      recorder.start();
      setRecording(true);
    } catch {
      alert("Không thể truy cập microphone. Vui lòng cấp quyền.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      // stop() se kich hoat ondataavailable roi onstop -> gui blob
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setRecording(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled}
        className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl shadow-lg transition ${
          recording
            ? "bg-red-500 hover:bg-red-600 animate-pulse"
            : "bg-primary-600 hover:bg-primary-700"
        } disabled:opacity-50`}
      >
        {recording ? "⏹" : "🎤"}
      </button>
      <p className="text-sm text-slate-500">
        {recording ? "Đang ghi âm... Nhấn để dừng" : "Nhấn để bắt đầu trả lời"}
      </p>
    </div>
  );
}

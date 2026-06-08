interface Message {
  role: string;
  content: string;
  message_type?: string;
}

interface TranscriptPanelProps {
  messages: Message[];
}

export default function TranscriptPanel({ messages }: TranscriptPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 h-80 overflow-y-auto space-y-3">
      {messages.length === 0 && (
        <p className="text-slate-400 text-center py-8">Hội thoại sẽ hiển thị ở đây...</p>
      )}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
              msg.role === "candidate"
                ? "bg-primary-100 text-primary-800"
                : msg.role === "system"
                ? "bg-slate-100 text-slate-600 italic"
                : "bg-slate-200 text-slate-800"
            }`}
          >
            <span className="text-xs font-medium block mb-1 opacity-60">
              {msg.role === "candidate" ? "Bạn" : msg.role === "system" ? "Hệ thống" : "Nhà tuyển dụng"}
            </span>
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  );
}

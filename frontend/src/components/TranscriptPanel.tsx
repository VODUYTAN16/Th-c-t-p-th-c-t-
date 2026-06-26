import { UserIcon, ComputerDesktopIcon, InformationCircleIcon } from "@heroicons/react/24/solid";

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
    <div className="bg-white rounded-2xl border border-slate-200 p-5 h-[500px] overflow-y-auto space-y-4 shadow-sm">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
          <InformationCircleIcon className="w-8 h-8 opacity-50" />
          <p className="text-sm font-medium">Hội thoại sẽ hiển thị ở đây...</p>
        </div>
      )}
      {messages.map((msg, i) => {
        const isCandidate = msg.role === "candidate";
        const isSystem = msg.role === "system";

        return (
          <div
            key={i}
            className={`flex gap-3 ${isCandidate ? "flex-row-reverse" : "flex-row"} items-end`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              isCandidate 
                ? "bg-violet-600 text-white" 
                : isSystem
                  ? "bg-slate-300 text-slate-600"
                  : "bg-slate-800 text-white"
            }`}>
              {isCandidate ? (
                <UserIcon className="w-4 h-4" />
              ) : isSystem ? (
                <InformationCircleIcon className="w-4 h-4" />
              ) : (
                <ComputerDesktopIcon className="w-4 h-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                isCandidate
                  ? "bg-violet-100 text-violet-900 rounded-br-sm"
                  : isSystem
                    ? "bg-slate-100 text-slate-600 italic rounded-bl-sm"
                    : "bg-slate-50 border border-slate-100 text-slate-800 rounded-bl-sm"
              }`}
            >
              <span className="text-[11px] font-bold block mb-1 opacity-50 uppercase tracking-wider">
                {isCandidate ? "Bạn" : isSystem ? "Hệ thống" : "Nhà tuyển dụng"}
              </span>
              {msg.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

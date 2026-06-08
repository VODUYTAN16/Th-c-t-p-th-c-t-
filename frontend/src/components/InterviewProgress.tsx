interface InterviewProgressProps {
  current: number;
  total: number;
}

export default function InterviewProgress({ current, total }: InterviewProgressProps) {
  const pct = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-slate-600 mb-1">
        <span>Câu hỏi {current + 1}/{total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

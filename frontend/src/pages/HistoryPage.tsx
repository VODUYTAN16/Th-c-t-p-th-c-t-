import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch, type Session } from "../lib/api";

const STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  parsing: "Đang phân tích",
  ready: "Sẵn sàng",
  active: "Đang phỏng vấn",
  evaluating: "Đang đánh giá",
  completed: "Hoàn thành",
  failed: "Thất bại",
};

const STATUS_COLORS: Record<string, string> = {
  ready: "bg-blue-100 text-blue-700",
  active: "bg-yellow-100 text-yellow-700",
  evaluating: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  parsing: "bg-orange-100 text-orange-700",
  draft: "bg-slate-100 text-slate-600",
};

export default function HistoryPage() {
  const { accessToken } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    apiFetch<Session[]>("/sessions", {}, accessToken)
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return <div className="text-center py-16 text-slate-500">Đang tải...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Lịch sử phỏng vấn</h1>

      {sessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-slate-500 mb-4">Chưa có buổi phỏng vấn nào</p>
          <Link to="/" className="text-primary-600 hover:underline">
            Tạo buổi phỏng vấn đầu tiên
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition"
            >
              <div>
                <p className="font-medium">{s.title || s.position_applied}</p>
                <p className="text-sm text-slate-500">
                  {new Date(s.created_at).toLocaleDateString("vi-VN")} · {s.language === "vi" ? "Tiếng Việt" : "English"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[s.status] || "bg-slate-100"}`}>
                  {STATUS_LABELS[s.status] || s.status}
                </span>
                {s.status === "ready" && (
                  <Link
                    to={`/interview/${s.id}`}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    Bắt đầu
                  </Link>
                )}
                {s.status === "active" && (
                  <Link
                    to={`/interview/${s.id}`}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    Tiếp tục
                  </Link>
                )}
                {(s.status === "completed" || s.status === "evaluating") && (
                  <Link
                    to={`/report/${s.id}`}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    Xem báo cáo
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

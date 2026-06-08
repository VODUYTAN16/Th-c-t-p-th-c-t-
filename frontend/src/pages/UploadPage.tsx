import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch, uploadDocument, type Session } from "../lib/api";

export default function UploadPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [position, setPosition] = useState("");
  const [industry, setIndustry] = useState("");
  const [language, setLanguage] = useState("vi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!cvFile || !accessToken || loading) return;
    setLoading(true);
    setError("");

    try {
      setStatus("Đang tải CV...");
      const cvDoc = await uploadDocument(cvFile, "cv", accessToken);

      let jdDocId: string | undefined;
      if (jdFile) {
        setStatus("Đang tải JD...");
        const jdDoc = await uploadDocument(jdFile, "jd", accessToken);
        jdDocId = jdDoc.id;
      }

      setStatus("Đang phân tích CV và tạo câu hỏi (có thể mất 30s–2 phút)...");
      const session = await apiFetch<Session>(
        "/sessions",
        {
          method: "POST",
          body: JSON.stringify({
            cv_document_id: cvDoc.id,
            jd_document_id: jdDocId,
            position_applied: position,
            industry: industry || null,
            language,
          }),
        },
        accessToken
      );

      if (session.status === "failed") {
        throw new Error(session.error_message || "Phân tích CV thất bại");
      }
      if (session.status !== "ready") {
        throw new Error(`Phiên chưa sẵn sàng (trạng thái: ${session.status})`);
      }

      navigate(`/interview/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Tạo buổi phỏng vấn mới</h1>
      <p className="text-slate-600 mb-8">Tải CV và mô tả công việc để AI tạo câu hỏi cá nhân hóa.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
        {status && <div className="bg-blue-50 text-blue-600 p-3 rounded-lg text-sm">{status}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">CV (PDF, DOCX) *</label>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Job Description (tùy chọn)</label>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={(e) => setJdFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Vị trí ứng tuyển *</label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="VD: Backend Developer"
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ngành nghề</label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="VD: Công nghệ thông tin"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ngôn ngữ phỏng vấn</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !cvFile}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Bắt đầu phân tích & tạo câu hỏi"}
        </button>
      </form>
    </div>
  );
}

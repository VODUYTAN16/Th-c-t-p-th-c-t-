import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, type Report, type Session } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL as string;

export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { accessToken } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId || !accessToken) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 24; // ~2 phút voi interval 5s

    // Tra ve true neu da dung (xong / loi / het luot), false neu can poll tiep
    const fetchReport = async (): Promise<boolean> => {
      attempts += 1;
      try {
        const sess = await apiFetch<Session>(
          `/sessions/${sessionId}`,
          {},
          accessToken
        );
        setSession(sess);

        // Phien loi -> dung han, khong goi /report nua
        if (sess.status === 'failed') {
          setError(sess.error_message || 'Đánh giá thất bại. Vui lòng thử lại.');
          setLoading(false);
          return true;
        }

        // Con dang xu ly -> cho tiep
        if (sess.status === 'evaluating' || sess.status === 'active') {
          setError('Đang đánh giá, vui lòng đợi...');
          if (attempts >= MAX_ATTEMPTS) {
            setError('Quá thời gian chờ đánh giá. Vui lòng tải lại trang sau.');
            setLoading(false);
            return true;
          }
          return false;
        }

        // Da hoan thanh -> lay report
        const data = await apiFetch<Report>(
          `/sessions/${sessionId}/report`,
          {},
          accessToken
        );
        setReport(data);
        setError('');
        setLoading(false);
        return true;
      } catch (err) {
        // Report chua san sang (404) -> thu lai toi gioi han
        setError(err instanceof Error ? err.message : 'Chưa có báo cáo');
        if (attempts >= MAX_ATTEMPTS) {
          setLoading(false);
          return true;
        }
        return false;
      }
    };

    let intervalId: number | undefined;

    fetchReport().then((done) => {
      if (done) return;
      intervalId = window.setInterval(async () => {
        const isDone = await fetchReport();
        if (isDone && intervalId) clearInterval(intervalId);
      }, 5000);
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionId, accessToken]);

  if (loading) {
    return (
      <div className="text-center py-16 text-slate-500">
        Đang tải báo cáo...
      </div>
    );
  }

  const chartData = report
    ? [
        { subject: 'Nội dung', score: report.avg_content },
        { subject: 'Liên quan', score: report.avg_relevance },
        { subject: 'Đầy đủ', score: report.avg_completeness },
        { subject: 'Trình bày', score: report.avg_presentation },
      ]
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Báo cáo phỏng vấn</h1>
        <Link
          to="/history"
          className="text-primary-600 hover:underline text-sm"
        >
          ← Lịch sử
        </Link>
      </div>

      {error && !report && (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {report && (
        <>
          <div className="bg-white rounded-xl border p-6 grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-slate-500 text-sm">Vị trí</p>
              <p className="font-medium">{session?.position_applied}</p>
              <p className="text-4xl font-bold text-primary-600 mt-4">
                {report.overall_score.toFixed(1)}
                <span className="text-lg text-slate-400">/10</span>
              </p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Radar
                  dataKey="score"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-3">Tổng kết</h2>
            <p className="text-slate-700 whitespace-pre-wrap">
              {report.summary}
            </p>
          </div>

          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold">Đánh giá từng câu hỏi</h2>
            {report.evaluations.map((ev, i) => (
              <div key={i} className="border-t pt-4 first:border-0 first:pt-0">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm">{ev.question_text}</p>
                  <span className="text-primary-600 font-bold text-sm ml-4">
                    {ev.score_overall.toFixed(1)}/10
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{ev.category}</p>
                <p className="text-sm text-slate-600 mt-2">{ev.feedback}</p>
                {ev.sample_answer && (
                  <div className="mt-2 bg-slate-50 p-3 rounded-lg text-sm">
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      Câu trả lời mẫu:
                    </p>
                    {ev.sample_answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {report.cv_suggestions.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold mb-3">Gợi ý cải thiện CV</h2>
              <ul className="space-y-2">
                {report.cv_suggestions.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-primary-600 font-medium shrink-0">
                      [{s.section}]
                    </span>
                    <span>{s.suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4">
            {report.pdf_url && (
              <a
                href={report.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                Tải PDF
              </a>
            )}
            <a
              href={`${API_URL}/sessions/${sessionId}/report/pdf`}
              className="border border-primary-600 text-primary-600 px-6 py-2 rounded-lg hover:bg-primary-50"
              onClick={(e) => {
                e.preventDefault();
                fetch(`${API_URL}/sessions/${sessionId}/report/pdf`, {
                  headers: { Authorization: `Bearer ${accessToken}` },
                })
                  .then((r) => r.blob())
                  .then((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `report-${sessionId}.pdf`;
                    a.click();
                  });
              }}
            >
              Tải PDF (API)
            </a>
          </div>
        </>
      )}
    </div>
  );
}

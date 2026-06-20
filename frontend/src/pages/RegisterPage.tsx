import { FormEvent, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppHeader from "../components/AppHeader";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const REGISTER_SLIDES = [
  {
    image: "/login_slide_1_simple.png",
    title: "Nâng tầm kỹ năng phỏng vấn",
    desc: "Nhận 10-15 câu hỏi cá nhân hóa từ CV của bạn, luyện nói tự nhiên và nhận đánh giá chi tiết theo chuẩn quốc tế.",
  },
  {
    image: "/login_slide_2_simple.png",
    title: "Phân tích CV & JD tự động",
    desc: "AI tự động bóc tách kỹ năng, kinh nghiệm và so khớp với mô tả công việc của vị trí bạn ứng tuyển để tìm điểm thiếu hụt.",
  },
  {
    image: "/login_slide_3_simple.png",
    title: "Đánh giá & Gợi ý cải thiện",
    desc: "Chấm điểm chi tiết 4 tiêu chí chuẩn quốc tế kèm câu trả lời mẫu hoàn hảo và đề xuất nâng cấp CV phù hợp.",
  },
];

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto transition slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % REGISTER_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signUp(email, password, fullName);
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-violet-50/10 to-indigo-50/20 flex flex-col relative font-sans">
      {/* Google Fonts and CSS grid pattern for background */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        
        .bg-grid {
          background-size: 50px 50px;
          background-image: 
            linear-gradient(to right, rgba(124, 58, 237, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(124, 58, 237, 0.02) 1px, transparent 1px);
        }
      `}</style>

      {/* Header */}
      <AppHeader />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-6 md:p-8 relative z-10">

        {/* Background Grid & Decorative Hologram blobs */}
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-tr from-violet-400/20 via-indigo-300/20 to-fuchsia-300/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[70vw] h-[70vw] bg-gradient-to-br from-indigo-400/20 via-pink-300/15 to-cyan-300/20 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-[20%] left-[20%] w-[50vw] h-[40vw] bg-gradient-to-r from-fuchsia-300/10 via-purple-400/10 to-cyan-300/10 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute top-[40%] right-[5%] w-[45vw] h-[45vw] bg-gradient-to-tr from-violet-200/20 to-fuchsia-200/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Unified Premium Card (Combines left visual & right form inside a single white grid panel) */}
        <div className="w-full max-w-5xl bg-white/95 backdrop-blur-md border border-slate-200/70 rounded-3xl overflow-hidden shadow-[0_30px_70px_-10px_rgba(124,58,237,0.12),_0_0_50px_rgba(124,58,237,0.02)] grid md:grid-cols-12 min-h-[500px] md:min-h-[550px] relative z-10">

          {/* Left Column: Carousel panel inside unified card (Solid white background to blend with image white background) */}
          <div className="hidden md:flex md:col-span-6 bg-white p-6 md:p-8 flex-col justify-between border-r border-slate-100 relative overflow-hidden">
            {/* Soft decorative background circles */}
            <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-violet-50/50 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-16 w-48 h-48 rounded-full bg-indigo-50/40 blur-3xl pointer-events-none" />

            {/* Visual Illustration Carousel (Enlarged to h-[340px] and max-w-[400px]) */}
            <div className="relative my-1 flex flex-col justify-center">
              <div className="relative h-[340px] w-full flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSlide}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <img
                      src={REGISTER_SLIDES[activeSlide].image}
                      alt={REGISTER_SLIDES[activeSlide].title}
                      className="w-full max-w-[400px] h-full object-contain"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Text Carousel & Indicators at bottom */}
            <div className="flex flex-col justify-end mt-4 shrink-0">
              {/* Indicators */}
              <div className="flex gap-2.5 mb-3">
                {REGISTER_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${idx === activeSlide ? "w-8 bg-violet-600" : "w-2 bg-slate-200 hover:bg-violet-400"
                      }`}
                    aria-label={`Xem slide ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSlide}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-snug">
                      {REGISTER_SLIDES[activeSlide].title}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 mt-1 font-semibold leading-relaxed">
                      {REGISTER_SLIDES[activeSlide].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: Form Area inside unified card */}
          <div className="col-span-12 md:col-span-6 p-6 md:p-8 flex flex-col justify-center bg-white relative">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-violet-100/30 blur-2xl pointer-events-none" />

            <div className="w-full max-w-md mx-auto">

              {/* Title & Sub */}
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-2">
                Tạo tài khoản mới
              </h2>
              <p className="text-slate-500 text-base font-semibold mb-5">
                Chỉ mất chưa đầy một phút để thiết lập tài khoản của bạn.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">

                {/* Error Banner */}
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Name Input */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Họ và tên
                  </label>
                  <div className="relative flex items-center group">
                    <UserIcon className="absolute left-5 w-5 h-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-14 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-slate-50/50 text-slate-800 placeholder-slate-400 transition-all text-base font-semibold hover:border-slate-300"
                      required
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Địa chỉ Email
                  </label>
                  <div className="relative flex items-center group">
                    <EnvelopeIcon className="absolute left-5 w-5 h-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-14 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-slate-50/50 text-slate-800 placeholder-slate-400 transition-all text-base font-semibold hover:border-slate-300"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Mật khẩu
                  </label>
                  <div className="relative flex items-center group">
                    <LockClosedIcon className="absolute left-5 w-5 h-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-14 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 bg-slate-50/50 text-slate-800 placeholder-slate-400 transition-all text-base font-semibold hover:border-slate-300"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                {/* Terms text */}
                <div className="text-xs font-bold text-slate-500 leading-normal pt-0.5">
                  Bằng cách đăng ký, bạn đồng ý với các Điều khoản Dịch vụ và Chính sách Bảo mật của chúng tôi.
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white text-base font-bold bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 rounded-2xl hover:shadow-[0_10px_25px_rgba(124,58,237,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang đăng ký...</span>
                    </>
                  ) : (
                    <span>Đăng ký tài khoản</span>
                  )}
                </button>

                {/* Redirect to login */}
                <p className="text-center text-sm font-bold text-slate-500 pt-2">
                  Đã có tài khoản?{" "}
                  <Link
                    to="/login"
                    className="text-violet-600 hover:text-violet-700 hover:underline font-extrabold transition-colors ml-1"
                  >
                    Đăng nhập
                  </Link>
                </p>

              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

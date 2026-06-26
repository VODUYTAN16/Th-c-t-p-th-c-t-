import { Link } from "react-router-dom";

export default function AppFooter() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo + copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-[11px] shrink-0">
            AI
          </div>
          <span className="text-[13px] text-slate-400 text-center sm:text-left">
            © {new Date().getFullYear()} AI Interview Assistant
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[13px]">
          <Link to="/" className="text-slate-500 hover:text-slate-700 transition-colors">Trang chủ</Link>
          <Link to="/dashboard" className="text-slate-500 hover:text-slate-700 transition-colors">Tạo phiên</Link>
          <Link to="/history" className="text-slate-500 hover:text-slate-700 transition-colors">Lịch sử</Link>
        </div>
      </div>
    </footer>
  );
}

import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-600">
            AI Interview Assistant
          </Link>
          {user && (
            <nav className="flex items-center gap-6 text-sm">
              <Link to="/" className="hover:text-primary-600">Tạo phiên</Link>
              <Link to="/history" className="hover:text-primary-600">Lịch sử</Link>
              <span className="text-slate-500">{user.email}</span>
              <button onClick={handleSignOut} className="text-red-500 hover:underline">
                Đăng xuất
              </button>
            </nav>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

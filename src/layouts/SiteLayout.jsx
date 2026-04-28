import {
  LogIn,
  Menu,
  ShoppingCart,
  User2,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAppState } from "../lib/app-state";

function HeaderLink({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `text-sm font-medium transition ${
          isActive ? "text-lime-800" : "text-stone-700 hover:text-lime-800"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function SiteLayout() {
  const { navigationLinks, cartCount, currentUser, logout } = useAppState();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isAdminView = useMemo(
    () => location.pathname.startsWith("/admin"),
    [location.pathname]
  );

  return (
    <div className="page-shell">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-[rgba(227,230,213,0.82)] backdrop-blur-xl">
        <div className="container-shell flex items-center justify-between gap-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-logo text-4xl font-semibold leading-none text-stone-900">
              Ophelia
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navigationLinks.map((item) => (
              <HeaderLink key={item.href} to={item.href}>
                {item.label}
              </HeaderLink>
            ))}
            {currentUser?.role === "admin" && <HeaderLink to="/admin">Админка</HeaderLink>}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/cart"
              className="relative inline-flex items-center justify-center rounded-full border border-stone-900/10 bg-white/80 p-3 transition hover:bg-lime-50"
              aria-label="Корзина"
            >
              <ShoppingCart className="size-5" />
              <span className="absolute -right-1 -top-1 inline-flex size-5 items-center justify-center rounded-full bg-lime-600 text-xs font-semibold text-white">
                {cartCount}
              </span>
            </Link>
            {currentUser ? (
              <>
                <Link
                  to={currentUser.role === "admin" ? "/admin" : "/profile"}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/80 px-4 py-3 text-sm font-medium transition hover:bg-lime-50"
                >
                  <User2 className="size-4" />
                  {currentUser.role === "admin" ? "Профиль" : currentUser.name}
                </Link>
                {!isAdminView && (
                  <button
                    type="button"
                    onClick={logout}
                    className="text-sm font-medium text-stone-600 transition hover:text-lime-800"
                  >
                    Выйти
                  </button>
                )}
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/80 px-4 py-3 text-sm font-medium transition hover:bg-lime-50"
              >
                <LogIn className="size-4" />
                Войти
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex rounded-full border border-stone-900/10 bg-white/80 p-3 text-stone-900 lg:hidden"
            aria-label="Открыть меню"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-stone-900/8 bg-[rgba(227,230,213,0.98)] lg:hidden">
            <div className="container-shell flex flex-col gap-4 py-4">
              {navigationLinks.map((item) => (
                <HeaderLink key={item.href} to={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </HeaderLink>
              ))}
              {currentUser?.role === "admin" && (
                <HeaderLink to="/admin" onClick={() => setMenuOpen(false)}>
                  Админка
                </HeaderLink>
              )}
              <div className="flex items-center gap-3 pt-3">
                <Link
                  to="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white px-4 py-3 text-sm font-medium"
                >
                  <ShoppingCart className="size-4" />
                  Корзина ({cartCount})
                </Link>
                <Link
                  to={currentUser ? (currentUser.role === "admin" ? "/admin" : "/profile") : "/login"}
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white px-4 py-3 text-sm font-medium"
                >
                  <User2 className="size-4" />
                  {currentUser ? (currentUser.role === "admin" ? "Админка" : "Профиль") : "Войти"}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-20 bg-green-950 py-14 text-white">
        <div className="container-shell grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="font-logo text-4xl">Ophelia</p>
            <p className="mt-4 max-w-md text-sm leading-7 text-green-100/80">
              Премиальная бытовая техника и электроника, отобранная для спокойной работы,
              долгого срока службы и красивой повседневности.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-lime-300">
              Контакты
            </p>
            <ul className="mt-4 space-y-3 text-sm text-green-100/80">
              <li>hello@ophelia.store</li>
              <li>+7 (495) 555-01-19</li>
              <li>Москва, Тверская 18</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-lime-300">
              Мы в соцсетях
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-green-100/80">
              <span>Telegram</span>
              <span>Instagram</span>
              <span>VK</span>
            </div>
          </div>
        </div>
        <div className="container-shell mt-12 border-t border-white/10 pt-6 text-sm text-green-100/65">
          © 2026 Ophelia. Техника с заботой о доме.
        </div>
      </footer>
    </div>
  );
}

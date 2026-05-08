import { ArrowRight, ShieldCheck, User2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/Button";
import Reveal from "../components/Reveal";
import { useAppState } from "../lib/app-state";
import { clearRussianValidity, handleRussianInvalid } from "../lib/form-validation";

export default function LoginPage() {
  const { currentUser, login } = useAppState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/profile";
  const demo = searchParams.get("demo");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === "admin" ? "/admin" : "/profile", { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (currentUser || (demo !== "admin" && demo !== "shopper")) {
      return;
    }

    const credentials =
      demo === "admin"
        ? { email: "admin@admin.com", password: "password" }
        : { email: "hello@ophelia.store", password: "ophelia123" };

    const runLogin = async () => {
      const result = await login(credentials);

      if (result.ok) {
        navigate(result.user.role === "admin" ? "/admin" : redirect, { replace: true });
      }
    };

    runLogin();
  }, [currentUser, demo, login, navigate, redirect]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    window.setTimeout(async () => {
      const result = await login(form);
      setLoading(false);

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      navigate(result.user.role === "admin" ? "/admin" : redirect, { replace: true });
    }, 700);
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="container-shell py-12">
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <Reveal>
          <section className="soft-card rounded-[34px] p-8 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-700">
              Вход
            </p>
            <h1 className="mt-4 text-4xl font-semibold text-stone-900">
              Доступ в личный кабинет и панель управления.
            </h1>
            <p className="mt-5 text-base leading-7 text-stone-600">
              Используйте демо-доступ администратора или покупателя. Если адрес эл. почты ещё не
              существует, эта демо-версия автоматически создаст новый аккаунт покупателя.
            </p>
            <div className="mt-8 grid gap-4">
              <button
                type="button"
                onClick={() => fillDemo("admin@admin.com", "password")}
                className="rounded-[22px] bg-[var(--surface-muted)] p-5 text-left transition hover:bg-lime-100"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-5 text-lime-700" />
                  <p className="font-semibold text-stone-900">Демо администратора</p>
                </div>
                <p className="mt-2 text-sm text-stone-600">admin@admin.com / password</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("hello@ophelia.store", "ophelia123")}
                className="rounded-[22px] bg-[var(--surface-muted)] p-5 text-left transition hover:bg-lime-100"
              >
                <div className="flex items-center gap-3">
                  <User2 className="size-5 text-lime-700" />
                  <p className="font-semibold text-stone-900">Демо покупателя</p>
                </div>
                <p className="mt-2 text-sm text-stone-600">hello@ophelia.store / ophelia123</p>
              </button>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="soft-card rounded-[34px] p-8 md:p-10">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-stone-700">Эл. почта</span>
                <input
                  className="input-base"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  onInvalid={handleRussianInvalid}
                  onInput={clearRussianValidity}
                  required
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-stone-700">Пароль</span>
                <input
                  className="input-base"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  onInvalid={handleRussianInvalid}
                  onInput={clearRussianValidity}
                  required
                />
              </label>
              {message && (
                <div className="rounded-[20px] bg-red-50 px-4 py-3 text-sm text-red-600">
                  {message}
                </div>
              )}
              <Button type="submit" loading={loading} className="mt-2 w-full justify-center py-4">
                Продолжить
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </section>
        </Reveal>
      </div>
    </div>
  );
}

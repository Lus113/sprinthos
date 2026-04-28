import { Link } from "react-router-dom";
import Button from "../components/Button";

export default function NotFoundPage() {
  return (
    <div className="container-shell flex min-h-[70vh] items-center py-16">
      <div className="soft-card grid w-full gap-8 rounded-[36px] p-8 md:grid-cols-[1fr_0.85fr] md:p-12">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-700">404</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight text-stone-900">
            Техника сломалась, страница не найдена.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
            Мы уже проверили витрину, маршрут сервиса и тихий угол за холодильниками. Ничего.
            Давайте вернёмся на главную.
          </p>
          <Link to="/" className="mt-8 inline-flex">
            <Button>Вернуться на главную</Button>
          </Link>
        </div>
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
          alt="Креативная иллюстрация 404"
          className="h-full min-h-[320px] w-full rounded-[28px] object-cover"
        />
      </div>
    </div>
  );
}

import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import { useAppState } from "../lib/app-state";

export default function AboutPage() {
  const { partners, siteCopy } = useAppState();

  return (
    <div className="container-shell py-12">
      <Reveal>
        <section className="grid gap-8 lg:grid-cols-[1fr_0.92fr]">
          <div className="soft-card rounded-[34px] p-8 md:p-10">
            <SectionHeading
              eyebrow="О нас"
              title="Ophelia отбирает технику для дома, которая выглядит спокойно и работает уверенно."
              description={siteCopy.about}
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                "Внимательный отбор товаров вместо бесконечных списков",
                "Быстрая координация доставки, установки и сервиса",
                "Премиальная палитра и чистый сценарий покупки на каждом экране",
                "Управление товарами, блогом и остатками через админ-панель"
              ].map((point) => (
                <div key={point} className="rounded-[22px] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-stone-700">
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="soft-card rounded-[34px] p-6">
            <img
              src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
              alt="Шоурум Ophelia в гостиной зоне"
              className="h-full min-h-[420px] w-full rounded-[28px] object-cover"
            />
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-8">
        <section className="soft-card rounded-[34px] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-700">
            Партнёры
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {partners.map((partner) => (
              <div
                key={partner}
                className="rounded-[20px] bg-[var(--surface-muted)] px-4 py-5 text-center text-lg font-semibold text-stone-900"
              >
                {partner}
              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
}

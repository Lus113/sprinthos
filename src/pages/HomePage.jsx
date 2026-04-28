import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import BlogCard from "../components/BlogCard";
import Button from "../components/Button";
import ProductCard from "../components/ProductCard";
import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import { useAppState } from "../lib/app-state";

function FaqItem({ item, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="soft-card w-full rounded-[24px] p-5 text-left transition hover:border-lime-600/30"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-lg font-semibold text-stone-900">{item.question}</p>
        <span className="text-2xl text-lime-700">{open ? "−" : "+"}</span>
      </div>
      {open && <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600">{item.answer}</p>}
    </button>
  );
}

export default function HomePage() {
  const { blogPosts, faqs, partners, products, siteCopy, tariffs } = useAppState();
  const popularProducts = products.slice(0, 6);
  const featuredPosts = blogPosts.slice(0, 4);
  const [openFaq, setOpenFaq] = useState(faqs[0]?.question);

  return (
    <div>
      <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1800&q=80"
          alt="Премиальный интерьер кухни Ophelia"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="container-shell relative flex min-h-[calc(100vh-5rem)] items-center py-20">
          <div className="max-w-3xl text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
              <Sparkles className="size-4 text-lime-300" />
              Премиальная техника для дома с характером
            </div>
            <h1 className="text-balance mt-8 text-5xl font-semibold leading-tight md:text-7xl">
              Добро пожаловать в Ophelia — технику с заботой о вас.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78 md:text-xl">
              {siteCopy.heroSubtitle}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/catalog">
                <Button className="px-7 py-4 text-base">
                  Смотреть каталог
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link
                to="/tariffs"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-4 text-base font-medium text-white backdrop-blur transition hover:bg-white/15"
              >
                Выбрать тариф
              </Link>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {[
                "Белые карточки товаров с аккуратными характеристиками",
                "Автоматическая скидка 24% для заказов свыше 100 000 ₽",
                "Личный кабинет, демо-аккаунты и защищённая админ-панель"
              ].map((point) => (
                <div
                  key={point}
                  className="rounded-[22px] border border-white/15 bg-white/10 p-4 backdrop-blur"
                >
                  <Check className="size-5 text-lime-300" />
                  <p className="mt-3 text-sm leading-6 text-white/80">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-20">
        <Reveal>
          <SectionHeading
            eyebrow="Блог"
            title="Новости и заметки о технике для дома, где важны тишина, удобство и долговечность."
            description="Наши материалы близки к продуктам: практичные, спокойные по тону и сосредоточенные на том, что реально улучшает повседневность."
          />
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featuredPosts.map((post) => (
            <Reveal key={post.id}>
              <BlogCard post={post} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-shell py-8">
        <Reveal>
          <SectionHeading
            eyebrow="Популярное"
            title="Шесть категорий, к которым покупатели возвращаются снова и снова."
            description="Телевизоры, холодильники, игровые консоли, телефоны, пылесосы и утюги — с продуманной подачей и полноценными карточками товаров."
          />
        </Reveal>
        <div className="mt-10 grid gap-6 grid-autofill">
          {popularProducts.map((product) => (
            <Reveal key={product.id}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-shell py-20">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <div className="soft-card h-full rounded-[32px] p-8 md:p-10">
              <SectionHeading
                eyebrow="О магазине"
                title={siteCopy.heroTitle}
                description={siteCopy.about}
              />
              <div className="mt-10 grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] bg-[var(--surface-muted)] p-5">
                  <ShieldCheck className="size-6 text-lime-700" />
                  <p className="mt-4 text-lg font-semibold text-stone-900">Сервис с вниманием</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Доставка, установка и сопровождение здесь воспринимаются как часть самого продукта.
                  </p>
                </div>
                <div className="rounded-[22px] bg-[var(--surface-muted)] p-5">
                  <Sparkles className="size-6 text-lime-700" />
                  <p className="mt-4 text-lg font-semibold text-stone-900">Выверенный ассортимент</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Мы выбираем меньше позиций, но каждая из них заслуживает своё место долгой и комфортной эксплуатацией.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="soft-card rounded-[32px] p-8 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-700">
                Партнёры
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {partners.map((partner) => (
                  <div
                    key={partner}
                    className="rounded-[20px] border border-stone-900/8 bg-white p-5 text-center text-lg font-semibold text-stone-900"
                  >
                    {partner}
                  </div>
                ))}
              </div>
              <img
                src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80"
                alt="Шоурум Ophelia"
                className="mt-8 h-72 w-full rounded-[26px] object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-shell py-8">
        <Reveal>
          <SectionHeading
            eyebrow="Тарифы"
            title="Выберите уровень сервиса, который подходит вашей покупке."
            description="Каждый тариф включает поддержку по доставке, но глубина координации, установки и гарантийного сопровождения меняется в зависимости от уровня."
            align="center"
          />
        </Reveal>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {tariffs.map((tariff) => (
            <Reveal key={tariff.id}>
              <div className="soft-card flex h-full flex-col rounded-[28px] p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-stone-500">{tariff.priceLabel}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-stone-900">{tariff.name}</h3>
                  </div>
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-lime-800">
                    Сервис
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-stone-600">{tariff.description}</p>
                <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-stone-700">
                  {tariff.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 text-lime-700" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to={`/tariffs?plan=${encodeURIComponent(tariff.name)}#apply`} className="mt-8">
                  <Button className="w-full justify-center">Выбрать</Button>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-shell py-20">
        <Reveal>
          <SectionHeading
            eyebrow="Вопросы"
            title="Практичные ответы о гарантии, сервисе, возвратах и сертификатах."
            description="Даже премиальный магазин должен оставаться понятным. Вот вопросы, которые чаще всего задают перед оформлением заказа."
          />
        </Reveal>
        <div className="mt-8 flex flex-col gap-4">
          {faqs.map((item, index) => (
            <Reveal key={item.question}>
              <FaqItem
                item={item}
                open={openFaq === item.question}
                onToggle={() =>
                  setOpenFaq((current) => (current === item.question ? null : item.question))
                }
              />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}

import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import { useAppState } from "../lib/app-state";
import { formatPrice, titleFromCategory } from "../lib/format";

export default function CatalogPage() {
  const { category } = useParams();
  const { categories, products } = useAppState();
  const [manufacturer, setManufacturer] = useState("Все");
  const maxProductPrice = Math.max(...products.map((product) => product.price));
  const [priceLimit, setPriceLimit] = useState(maxProductPrice);

  const manufacturers = useMemo(
    () => ["Все", ...Array.from(new Set(products.map((product) => product.manufacturer)))],
    [products]
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const categoryMatch = category ? product.category === category : true;
        const manufacturerMatch =
          manufacturer === "Все" ? true : product.manufacturer === manufacturer;
        const priceMatch = product.price <= priceLimit;

        return categoryMatch && manufacturerMatch && priceMatch;
      }),
    [category, manufacturer, priceLimit, products]
  );

  return (
    <div className="container-shell py-12">
      <Reveal>
        <section className="soft-card rounded-[34px] p-8 md:p-10">
          <SectionHeading
            eyebrow="Каталог"
            title={
              category
                ? `${titleFromCategory(category)} для продуманной повседневной жизни`
                : "Аккуратный каталог из шести ключевых категорий техники"
            }
            description="Используйте демо-фильтры по цене и производителю, переключайте категории и открывайте карточки товаров с галереей, характеристиками, корзиной и избранным."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/catalog"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                !category
                  ? "bg-lime-600 text-white"
                  : "border border-stone-900/10 bg-white text-stone-700 hover:bg-lime-50"
              }`}
            >
              Все
            </Link>
            {categories.map((entry) => (
              <Link
                key={entry}
                to={`/catalog/${entry}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  category === entry
                    ? "bg-lime-600 text-white"
                    : "border border-stone-900/10 bg-white text-stone-700 hover:bg-lime-50"
                }`}
              >
                {titleFromCategory(entry)}
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
        <Reveal>
          <aside className="soft-card rounded-[28px] p-6">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="size-5 text-lime-700" />
              <p className="text-lg font-semibold text-stone-900">Фильтры</p>
            </div>
            <div className="mt-6 flex flex-col gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-stone-700">Производитель</span>
                <select
                  value={manufacturer}
                  onChange={(event) => setManufacturer(event.target.value)}
                  className="input-base"
                >
                  {manufacturers.map((entry) => (
                    <option key={entry}>{entry}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-3">
                <span className="text-sm font-medium text-stone-700">
                  До {formatPrice(priceLimit)}
                </span>
                <input
                  type="range"
                  min="10000"
                  max={maxProductPrice}
                  step="5000"
                  value={priceLimit}
                  onChange={(event) => setPriceLimit(Number(event.target.value))}
                  className="accent-lime-600"
                />
              </label>
            </div>
          </aside>
        </Reveal>

        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="text-sm text-stone-600">
              Найдено <span className="font-semibold text-stone-900">{filteredProducts.length}</span>{" "}
              товаров
            </p>
            <button
              type="button"
              onClick={() => {
                setManufacturer("Все");
                setPriceLimit(maxProductPrice);
              }}
              className="text-sm font-medium text-lime-800 transition hover:text-green-800"
            >
              Сбросить фильтры
            </button>
          </div>
          <div className="grid gap-6 grid-autofill">
            {filteredProducts.map((product) => (
              <Reveal key={product.id}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

import { Heart, ShoppingBag, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/Button";
import ProductCard from "../components/ProductCard";
import QuantitySelector from "../components/QuantitySelector";
import Reveal from "../components/Reveal";
import { useAppState } from "../lib/app-state";
import { formatPrice, titleFromCategory } from "../lib/format";

export default function ProductPage() {
  const { slug } = useParams();
  const { addToCart, isFavorite, products, toggleFavorite } = useAppState();
  const product = products.find((entry) => entry.slug === slug);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const recommendations = useMemo(
    () =>
      products
        .filter((entry) => entry.category === product?.category && entry.id !== product?.id)
        .slice(0, 3),
    [product, products]
  );

  if (!product) {
    return (
      <div className="container-shell py-20">
        <div className="soft-card rounded-[28px] p-10 text-center">
          <h1 className="text-3xl font-semibold text-stone-900">Товар не найден</h1>
          <p className="mt-4 text-stone-600">Выбранный товар недоступен в этой демо-версии.</p>
          <Link to="/catalog" className="mt-8 inline-flex">
            <Button>Вернуться в каталог</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-shell py-12">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <section className="soft-card rounded-[32px] p-5 md:p-6">
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="h-[420px] w-full rounded-[26px] object-cover"
            />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={`overflow-hidden rounded-[20px] border transition ${
                    selectedImage === index
                      ? "border-lime-600"
                      : "border-stone-900/10 hover:border-lime-500/40"
                  }`}
                >
                  <img src={image} alt={`${product.name}, превью ${index + 1}`} className="h-28 w-full object-cover" />
                </button>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="soft-card rounded-[32px] p-8 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-lime-700">
              {titleFromCategory(product.category)}
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-stone-900">{product.name}</h1>
            <p className="mt-4 text-base leading-7 text-stone-600">{product.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-stone-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-3 py-1.5">
                <Star className="size-4 fill-lime-500 text-lime-500" />
                {product.rating}
              </span>
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5">
                {product.manufacturer}
              </span>
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5">
                В наличии: {product.stock}
              </span>
            </div>
            <div className="mt-7">
              <p className="text-sm text-stone-500">Цена</p>
              <p className="mt-2 text-4xl font-semibold text-stone-900">
                {formatPrice(product.price)}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <QuantitySelector value={quantity} onChange={setQuantity} max={product.stock} />
              <Button
                className="min-w-[210px] justify-center px-7"
                onClick={() => addToCart(product.id, quantity)}
              >
                <ShoppingBag className="size-4" />
                Добавить в корзину
              </Button>
              <Button
                variant="outline"
                className="min-w-[170px] justify-center"
                onClick={() => toggleFavorite(product.id)}
              >
                <Heart className={`size-4 ${isFavorite(product.id) ? "fill-current text-lime-700" : ""}`} />
                В избранное
              </Button>
            </div>
            <div className="mt-10 rounded-[26px] bg-[var(--surface-muted)] p-6">
              <p className="text-lg font-semibold text-stone-900">Характеристики</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="rounded-[20px] bg-white p-4">
                    <p className="text-sm text-stone-500">{key}</p>
                    <p className="mt-2 text-base font-medium text-stone-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      </div>

      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-700">
              Похожие товары
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-stone-900">
              Вам также могут подойти эти модели
            </h2>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {recommendations.map((entry) => (
            <Reveal key={entry.id}>
              <ProductCard product={entry} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}

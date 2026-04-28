import { Heart, ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "./Button";
import { formatPrice, titleFromCategory } from "../lib/format";
import { useAppState } from "../lib/app-state";

export default function ProductCard({ product }) {
  const { addToCart, isFavorite, toggleFavorite } = useAppState();

  return (
    <article className="soft-card group flex h-full flex-col overflow-hidden rounded-[24px]">
      <Link to={`/product/${product.slug}`} className="relative overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-stone-900">
          {titleFromCategory(product.category)}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">{product.manufacturer}</p>
            <Link
              to={`/product/${product.slug}`}
              className="mt-1 block text-xl font-semibold text-stone-900 transition hover:text-lime-800"
            >
              {product.name}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => toggleFavorite(product.id)}
            className={`rounded-full border p-2 transition ${
              isFavorite(product.id)
                ? "border-lime-600 bg-lime-100 text-lime-700"
                : "border-stone-900/10 bg-white text-stone-700 hover:bg-lime-50"
            }`}
            aria-label="Переключить избранное"
          >
            <Heart className={`size-4 ${isFavorite(product.id) ? "fill-current" : ""}`} />
          </button>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
          {product.shortDescription}
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-stone-500">
          <Star className="size-4 fill-lime-500 text-lime-500" />
          <span>{product.rating}</span>
          <span className="h-1 w-1 rounded-full bg-stone-300" />
          <span>В наличии: {product.stock}</span>
        </div>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">Цена</p>
            <p className="text-2xl font-semibold text-stone-900">
              {formatPrice(product.price)}
            </p>
          </div>
          <Button className="px-4 py-2.5" onClick={() => addToCart(product.id, 1)}>
            <ShoppingBag className="size-4" />
            В корзину
          </Button>
        </div>
      </div>
    </article>
  );
}

import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "../lib/format";

export default function BlogCard({ post }) {
  return (
    <article className="soft-card overflow-hidden rounded-[24px]">
      <Link to={`/blog/${post.slug}`} className="block overflow-hidden">
        <img
          src={post.images[0]}
          alt={post.title}
          className="h-56 w-full object-cover transition duration-500 hover:scale-105"
        />
      </Link>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
          <span>{formatDate(post.date)}</span>
          <span className="h-1 w-1 rounded-full bg-stone-300" />
          <span>{post.readingTime}</span>
        </div>
        <Link to={`/blog/${post.slug}`} className="mt-3 block text-2xl font-semibold text-stone-900">
          {post.title}
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{post.excerpt}</p>
        <Link
          to={`/blog/${post.slug}`}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-lime-800 transition hover:text-green-800"
        >
          Читать статью
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

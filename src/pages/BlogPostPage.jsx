import { Link, useParams } from "react-router-dom";
import Button from "../components/Button";
import Reveal from "../components/Reveal";
import { useAppState } from "../lib/app-state";
import { formatDate } from "../lib/format";

export default function BlogPostPage() {
  const { slug } = useParams();
  const { blogPosts } = useAppState();
  const post = blogPosts.find((entry) => entry.slug === slug);

  if (!post) {
    return (
      <div className="container-shell py-20">
        <div className="soft-card rounded-[28px] p-10 text-center">
          <h1 className="text-3xl font-semibold text-stone-900">Статья не найдена</h1>
          <Link to="/blog" className="mt-8 inline-flex">
            <Button>Вернуться в блог</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="container-shell py-12">
      <Reveal>
        <div className="soft-card overflow-hidden rounded-[34px]">
          <img src={post.images[0]} alt={post.title} className="h-[420px] w-full object-cover" />
          <div className="p-8 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-700">
              {formatDate(post.date)} · {post.readingTime}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-stone-900 md:text-5xl">
              {post.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-600">{post.excerpt}</p>
            <div className="mt-8 flex flex-col gap-6 text-base leading-8 text-stone-700">
              {post.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {post.images.length > 1 && (
              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {post.images.slice(1).map((image, index) => (
                  <img
                    key={image}
                    src={image}
                    alt={`${post.title}, иллюстрация ${index + 1}`}
                    className="h-64 w-full rounded-[24px] object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </article>
  );
}

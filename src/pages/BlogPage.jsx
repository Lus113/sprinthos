import BlogCard from "../components/BlogCard";
import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import { useAppState } from "../lib/app-state";

export default function BlogPage() {
  const { blogPosts } = useAppState();

  return (
    <div className="container-shell py-12">
      <Reveal>
        <SectionHeading
          eyebrow="Блог"
          title="Спокойный редакционный взгляд на технику, сервис и домашние сценарии."
          description="Каждая публикация открывается как полноценная статья и редактируется через админ-панель."
        />
      </Reveal>
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {blogPosts.map((post) => (
          <Reveal key={post.id}>
            <BlogCard post={post} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

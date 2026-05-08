import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import Button from "../components/Button";
import ImageDropzone from "../components/ImageDropzone";
import Reveal from "../components/Reveal";
import { useAppState } from "../lib/app-state";
import { formatDate, formatPrice, titleFromCategory } from "../lib/format";

const adminTabs = [
  "Сводка",
  "Управление товарами",
  "Управление блогом",
  "Управление заказами",
  "Заявки по тарифам",
  "Склад"
];

const emptyProduct = {
  id: "",
  name: "",
  category: "televisions",
  manufacturer: "Samsung",
  price: "",
  stock: "",
  rating: "4.7",
  shortDescription: "",
  description: "",
  images: [],
  featureOne: "",
  featureTwo: "",
  featureThree: "",
  featureFour: ""
};

const emptyPost = {
  id: "",
  title: "",
  excerpt: "",
  images: [],
  readingTime: "4 мин чтения",
  content: ""
};

const orderStatuses = ["Собирается", "В пути", "Доставлен"];
const requestStatuses = ["Не выполнен", "В очереди", "Сделан"];

function InputField({ placeholder, value, onChange, type = "text" }) {
  return (
    <input
      className="input-base"
      placeholder={placeholder}
      value={value}
      type={type}
      onChange={onChange}
    />
  );
}

export default function AdminPage() {
  const {
    blogPosts,
    orders,
    products,
    tariffRequests,
    upsertBlogPost,
    upsertProduct,
    updateOrderStatus,
    updateRequestStatus,
    updateWarehouseStock,
    deleteBlogPost,
    deleteProduct,
    uploadImages,
    deleteUploadedImages
  } = useAppState();
  const [activeTab, setActiveTab] = useState("Сводка");
  const [productForm, setProductForm] = useState(emptyProduct);
  const [postForm, setPostForm] = useState(emptyPost);
  const [productFormError, setProductFormError] = useState("");
  const [postFormError, setPostFormError] = useState("");

  const stats = useMemo(
    () => ({
      revenue: orders.reduce((sum, order) => sum + order.total, 0),
      stock: products.reduce((sum, product) => sum + product.stock, 0)
    }),
    [orders, products]
  );

  const saveProduct = () => {
    if (!productForm.images.length) {
      setProductFormError("Добавьте хотя бы одно изображение товара.");
      return;
    }

    setProductFormError("");
    upsertProduct(productForm);
    setProductForm(emptyProduct);
  };

  const savePost = () => {
    if (!postForm.images.length) {
      setPostFormError("Добавьте обложку или хотя бы одну иллюстрацию.");
      return;
    }

    setPostFormError("");
    upsertBlogPost(postForm);
    setPostForm(emptyPost);
  };

  return (
    <div className="container-shell py-12">
      <Reveal>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-700">
              Админ-панель
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-stone-900">
              Строгая панель управления для демо-магазина Ophelia.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
              Управляйте товарами, публикациями блога, статусами заказов, тарифными заявками и
              складскими остатками в одном русскоязычном интерфейсе.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {adminTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? "bg-lime-600 text-white"
                    : "border border-stone-900/10 bg-white text-stone-700 hover:bg-lime-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {activeTab === "Сводка" && (
        <Reveal className="mt-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Заказы", value: orders.length },
              { label: "Товары", value: products.length },
              { label: "Заявки по тарифам", value: tariffRequests.length },
              { label: "Выручка", value: formatPrice(stats.revenue) }
            ].map((stat) => (
              <div key={stat.label} className="soft-card rounded-[28px] p-6">
                <p className="text-sm text-stone-500">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold text-stone-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {activeTab === "Управление товарами" && (
        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <section className="soft-card rounded-[32px] p-7">
              <h2 className="text-2xl font-semibold text-stone-900">
                {productForm.id ? "Редактирование товара" : "Добавление товара"}
              </h2>
              <div className="mt-6 grid gap-4">
                <InputField
                  placeholder="Название товара"
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
                <InputField
                  placeholder="Производитель"
                  value={productForm.manufacturer}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, manufacturer: event.target.value }))
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    placeholder="Цена"
                    type="number"
                    value={productForm.price}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, price: event.target.value }))
                    }
                  />
                  <InputField
                    placeholder="Остаток"
                    type="number"
                    value={productForm.stock}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, stock: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    placeholder="Рейтинг"
                    value={productForm.rating}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, rating: event.target.value }))
                    }
                  />
                  <select
                    className="input-base"
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, category: event.target.value }))
                    }
                  >
                    {["televisions", "refrigerators", "game-consoles", "telephones", "vacuum-cleaners", "irons"].map(
                      (entry) => (
                        <option key={entry} value={entry}>
                          {titleFromCategory(entry)}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <InputField
                  placeholder="Краткое описание"
                  value={productForm.shortDescription}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      shortDescription: event.target.value
                    }))
                  }
                />
                <textarea
                  className="input-base min-h-[120px]"
                  placeholder="Полное описание"
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, description: event.target.value }))
                  }
                />

                <ImageDropzone
                  label="Фотографии товара"
                  hint="Первое изображение автоматически становится главным"
                  value={productForm.images}
                  onChange={(images) => {
                    setProductForm((current) => ({ ...current, images }));
                    setProductFormError("");
                  }}
                  onUpload={(files) => uploadImages(files, "product-images")}
                  onRemove={deleteUploadedImages}
                  maxFiles={5}
                  primaryLabel="Главное фото"
                />

                {productFormError && (
                  <div className="rounded-[18px] bg-red-50 px-4 py-3 text-sm text-red-600">
                    {productFormError}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    placeholder="Характеристика 1"
                    value={productForm.featureOne}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, featureOne: event.target.value }))
                    }
                  />
                  <InputField
                    placeholder="Характеристика 2"
                    value={productForm.featureTwo}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, featureTwo: event.target.value }))
                    }
                  />
                  <InputField
                    placeholder="Характеристика 3"
                    value={productForm.featureThree}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        featureThree: event.target.value
                      }))
                    }
                  />
                  <InputField
                    placeholder="Характеристика 4"
                    value={productForm.featureFour}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, featureFour: event.target.value }))
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={saveProduct}>Сохранить товар</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setProductForm(emptyProduct);
                      setProductFormError("");
                    }}
                  >
                    Очистить форму
                  </Button>
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section className="grid gap-4">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="soft-card grid gap-4 rounded-[28px] p-4 md:grid-cols-[120px_1fr_auto] md:items-center"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-28 w-full rounded-[20px] object-cover"
                  />
                  <div>
                    <p className="text-sm text-stone-500">{product.manufacturer}</p>
                    <h3 className="mt-1 text-xl font-semibold text-stone-900">{product.name}</h3>
                    <p className="mt-2 text-sm text-stone-600">
                      {formatPrice(product.price)} · В наличии: {product.stock}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        {
                          setProductForm({
                            id: product.id,
                            name: product.name,
                            category: product.category,
                            manufacturer: product.manufacturer,
                            price: String(product.price),
                            stock: String(product.stock),
                            rating: String(product.rating),
                            shortDescription: product.shortDescription,
                            description: product.description,
                            images: product.images,
                            featureOne: Object.values(product.specs)[0] || "",
                            featureTwo: Object.values(product.specs)[1] || "",
                            featureThree: Object.values(product.specs)[2] || "",
                            featureFour: Object.values(product.specs)[3] || ""
                          });
                          setProductFormError("");
                        }
                      }
                      className="rounded-full border border-stone-900/10 bg-white p-3 transition hover:bg-lime-50"
                      aria-label={`Редактировать товар ${product.name}`}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProduct(product.id)}
                      className="rounded-full border border-stone-900/10 bg-white p-3 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Удалить товар ${product.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </Reveal>
        </div>
      )}

      {activeTab === "Управление блогом" && (
        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <section className="soft-card rounded-[32px] p-7">
              <h2 className="text-2xl font-semibold text-stone-900">
                {postForm.id ? "Редактирование публикации" : "Новая публикация"}
              </h2>
              <div className="mt-6 grid gap-4">
                <InputField
                  placeholder="Заголовок"
                  value={postForm.title}
                  onChange={(event) =>
                    setPostForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
                <InputField
                  placeholder="Краткое описание"
                  value={postForm.excerpt}
                  onChange={(event) =>
                    setPostForm((current) => ({ ...current, excerpt: event.target.value }))
                  }
                />
                <InputField
                  placeholder="Время чтения"
                  value={postForm.readingTime}
                  onChange={(event) =>
                    setPostForm((current) => ({ ...current, readingTime: event.target.value }))
                  }
                />

                <ImageDropzone
                  label="Обложка и дополнительные иллюстрации"
                  hint="Первое изображение становится обложкой публикации"
                  value={postForm.images}
                  onChange={(images) => {
                    setPostForm((current) => ({ ...current, images }));
                    setPostFormError("");
                  }}
                  onUpload={(files) => uploadImages(files, "blog-images")}
                  onRemove={deleteUploadedImages}
                  maxFiles={5}
                  primaryLabel="Обложка"
                />

                {postFormError && (
                  <div className="rounded-[18px] bg-red-50 px-4 py-3 text-sm text-red-600">
                    {postFormError}
                  </div>
                )}

                <textarea
                  className="input-base min-h-[220px]"
                  placeholder="Текст статьи (каждый абзац с новой строки)"
                  value={postForm.content}
                  onChange={(event) =>
                    setPostForm((current) => ({ ...current, content: event.target.value }))
                  }
                />

                <div className="flex flex-wrap gap-3">
                  <Button onClick={savePost}>Сохранить публикацию</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPostForm(emptyPost);
                      setPostFormError("");
                    }}
                  >
                    Очистить форму
                  </Button>
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section className="grid gap-4">
              {blogPosts.map((post) => (
                <article
                  key={post.id}
                  className="soft-card grid gap-4 rounded-[28px] p-4 md:grid-cols-[140px_1fr_auto] md:items-center"
                >
                  <img
                    src={post.images[0]}
                    alt={post.title}
                    className="h-28 w-full rounded-[20px] object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-stone-900">{post.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
                      {post.excerpt}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                      Иллюстраций: {post.images.length}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        {
                          setPostForm({
                            id: post.id,
                            title: post.title,
                            excerpt: post.excerpt,
                            images: post.images,
                            readingTime: post.readingTime,
                            content: post.content.join("\n")
                          });
                          setPostFormError("");
                        }
                      }
                      className="rounded-full border border-stone-900/10 bg-white p-3 transition hover:bg-lime-50"
                      aria-label={`Редактировать публикацию ${post.title}`}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBlogPost(post.id)}
                      className="rounded-full border border-stone-900/10 bg-white p-3 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Удалить публикацию ${post.title}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </Reveal>
        </div>
      )}

      {activeTab === "Управление заказами" && (
        <Reveal className="mt-8">
          <section className="soft-card rounded-[32px] p-7">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-stone-700">
                <thead>
                  <tr className="border-b border-stone-900/10 text-stone-500">
                    <th className="pb-4 pr-6 font-medium">Заказ</th>
                    <th className="pb-4 pr-6 font-medium">Дата</th>
                    <th className="pb-4 pr-6 font-medium">Получатель</th>
                    <th className="pb-4 pr-6 font-medium">Сумма</th>
                    <th className="pb-4 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-stone-900/6">
                      <td className="py-4 pr-6 font-semibold text-stone-900">{order.number}</td>
                      <td className="py-4 pr-6">{formatDate(order.date)}</td>
                      <td className="py-4 pr-6">{order.recipient}</td>
                      <td className="py-4 pr-6">{formatPrice(order.total)}</td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          {orderStatuses.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => updateOrderStatus(order.id, status)}
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                order.status === status
                                  ? "bg-lime-600 text-white"
                                  : "bg-[var(--surface-muted)] text-stone-700 hover:bg-lime-100"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </Reveal>
      )}

      {activeTab === "Заявки по тарифам" && (
        <Reveal className="mt-8">
          <section className="soft-card rounded-[32px] p-7">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-stone-700">
                <thead>
                  <tr className="border-b border-stone-900/10 text-stone-500">
                    <th className="pb-4 pr-6 font-medium">Имя</th>
                    <th className="pb-4 pr-6 font-medium">Телефон</th>
                    <th className="pb-4 pr-6 font-medium">Тариф</th>
                    <th className="pb-4 pr-6 font-medium">Дата</th>
                    <th className="pb-4 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {tariffRequests.map((request) => (
                    <tr key={request.id} className="border-b border-stone-900/6">
                      <td className="py-4 pr-6 font-semibold text-stone-900">{request.name}</td>
                      <td className="py-4 pr-6">{request.phone}</td>
                      <td className="py-4 pr-6">{request.tariff}</td>
                      <td className="py-4 pr-6">{formatDate(request.date)}</td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          {requestStatuses.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => updateRequestStatus(request.id, status)}
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                request.status === status
                                  ? "bg-lime-600 text-white"
                                  : "bg-[var(--surface-muted)] text-stone-700 hover:bg-lime-100"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </Reveal>
      )}

      {activeTab === "Склад" && (
        <Reveal className="mt-8">
          <section className="soft-card rounded-[32px] p-7">
            <div className="grid gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="grid gap-4 rounded-[22px] bg-[var(--surface-muted)] p-4 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <p className="text-lg font-semibold text-stone-900">{product.name}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      {titleFromCategory(product.category)} · {product.manufacturer}
                    </p>
                  </div>
                  <label className="flex items-center gap-3">
                    <span className="text-sm font-medium text-stone-700">Остаток</span>
                    <input
                      type="number"
                      min="0"
                      value={product.stock}
                      onChange={(event) => updateWarehouseStock(product.id, event.target.value)}
                      className="input-base w-28"
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}

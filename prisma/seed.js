import crypto from "node:crypto";
import { TariffRequestStatus, TariffType, UserRole } from "@prisma/client";
import { prisma } from "../server/prisma.js";

function hashPassword(password) {
  const salt = crypto.randomUUID().replace(/-/g, "");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const categories = [
  { name: "Телевизоры", slug: "televisions" },
  { name: "Холодильники", slug: "refrigerators" },
  { name: "Игровые консоли", slug: "game-consoles" },
  { name: "Телефоны", slug: "telephones" },
  { name: "Пылесосы", slug: "vacuum-cleaners" },
  { name: "Утюги", slug: "irons" }
];

const productSeeds = [
  {
    name: "Samsung The Frame 55",
    description:
      "Премиальный телевизор с матовым экраном, художественным режимом и чистым 4K-изображением для современного интерьера.",
    shortDescription: "Телевизор 4K QLED с интерьерным дизайном",
    manufacturer: "Samsung",
    price: 149990,
    categorySlug: "televisions",
    stockQuantity: 8,
    rating: 4.9,
    specsJson: {
      Диагональ: "55 дюймов",
      Разрешение: "3840 x 2160",
      Аудиосистема: "Dolby Atmos",
      Дизайн: "Режим картины и тонкая рамка"
    },
    images: [
      "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    name: "LG InstaView Door-in-Door",
    description:
      "Вместительный холодильник с инверторным компрессором, стеклянной панелью InstaView и продуманной системой хранения.",
    shortDescription: "Холодильник side-by-side для большой кухни",
    manufacturer: "LG",
    price: 189990,
    categorySlug: "refrigerators",
    stockQuantity: 5,
    rating: 4.8,
    specsJson: {
      Объем: "635 л",
      Охлаждение: "No Frost",
      Компрессор: "Инверторный",
      Особенность: "Панель InstaView Door-in-Door"
    },
    images: [
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    name: "PlayStation 5 Slim",
    description:
      "Игровая консоль нового поколения с быстрым SSD, поддержкой трассировки лучей и плавным 4K-геймплеем.",
    shortDescription: "Игровая консоль для домашнего развлечения",
    manufacturer: "Sony",
    price: 69990,
    categorySlug: "game-consoles",
    stockQuantity: 12,
    rating: 4.9,
    specsJson: {
      Накопитель: "1 ТБ SSD",
      Геймпад: "DualSense",
      Видео: "4K HDR",
      Особенность: "Ray Tracing и Tempest Audio"
    },
    images: [
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=1200&q=80"
    ]
  }
];

const blogSeeds = [
  {
    title: "Как выбрать технику для дома, которая будет радовать каждый день",
    previewText:
      "Собрали короткий гид по выбору техники: от приоритетов по функциям до нюансов гарантий и сервиса.",
    fullText: [
      "Покупка техники для дома давно перестала быть просто выбором по характеристикам. Сегодня важно, как устройство вписывается в ритм жизни, интерьер и привычки семьи.",
      "Мы советуем начинать с трех вопросов: где техника будет стоять, как часто она будет использоваться и какие функции действительно экономят время, а не остаются маркетинговым обещанием.",
      "В Офелии мы подбираем ассортимент так, чтобы каждая модель сочетала надежность, понятное управление и комфорт в повседневных сценариях."
    ].join("\n\n"),
    coverImageUrl:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80"
    ]
  }
];

async function upsertUsers() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {
      name: "Администратор Офелии",
      role: UserRole.admin,
      phone: "+7 (999) 000-00-01"
    },
    create: {
      email: "admin@admin.com",
      passwordHash: hashPassword("password"),
      name: "Администратор Офелии",
      phone: "+7 (999) 000-00-01",
      role: UserRole.admin
    }
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "hello@ophelia.store" },
    update: {
      name: "Ольга Смирнова",
      role: UserRole.user,
      phone: "+7 (999) 000-00-02"
    },
    create: {
      email: "hello@ophelia.store",
      passwordHash: hashPassword("ophelia123"),
      name: "Ольга Смирнова",
      phone: "+7 (999) 000-00-02",
      role: UserRole.user
    }
  });

  const defaultAddress = "Москва, Ленинский проспект, 18, кв. 24";
  const existingAddress = await prisma.userAddress.findFirst({
    where: {
      userId: demoUser.id,
      addressText: defaultAddress
    }
  });

  if (!existingAddress) {
    await prisma.userAddress.create({
      data: {
        userId: demoUser.id,
        addressText: defaultAddress,
        isDefault: true
      }
    });
  }

  return { admin, demoUser };
}

async function upsertCategories() {
  const map = new Map();

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category
    });

    map.set(saved.slug, saved);
  }

  return map;
}

async function upsertProducts(categoryMap) {
  for (const product of productSeeds) {
    const category = categoryMap.get(product.categorySlug);
    const existing = await prisma.product.findFirst({
      where: { name: product.name }
    });

    const saved = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: product.name,
            description: product.description,
            shortDescription: product.shortDescription,
            manufacturer: product.manufacturer,
            price: product.price,
            rating: product.rating,
            categoryId: category.id,
            stockQuantity: product.stockQuantity,
            specsJson: product.specsJson
          }
        })
      : await prisma.product.create({
          data: {
            name: product.name,
            description: product.description,
            shortDescription: product.shortDescription,
            manufacturer: product.manufacturer,
            price: product.price,
            rating: product.rating,
            categoryId: category.id,
            stockQuantity: product.stockQuantity,
            specsJson: product.specsJson
          }
        });

    await prisma.productImage.deleteMany({
      where: { productId: saved.id }
    });

    await prisma.productImage.createMany({
      data: product.images.map((imageUrl, index) => ({
        productId: saved.id,
        imageUrl,
        isMain: index === 0,
        sortOrder: index
      }))
    });
  }
}

async function upsertBlogPosts() {
  for (const post of blogSeeds) {
    const existing = await prisma.blogPost.findFirst({
      where: { title: post.title }
    });

    if (existing) {
      await prisma.blogPost.update({
        where: { id: existing.id },
        data: post
      });
      continue;
    }

    await prisma.blogPost.create({ data: post });
  }
}

async function seedTariffRequest() {
  const existing = await prisma.tariffRequest.findFirst({
    where: {
      userName: "Анна Петрова",
      phone: "+7 (900) 123-45-67",
      tariffType: TariffType.standard
    }
  });

  if (!existing) {
    await prisma.tariffRequest.create({
      data: {
        userName: "Анна Петрова",
        phone: "+7 (900) 123-45-67",
        tariffType: TariffType.standard,
        status: TariffRequestStatus.in_queue
      }
    });
  }
}

async function main() {
  const categoryMap = await upsertCategories();
  await upsertUsers();
  await upsertProducts(categoryMap);
  await upsertBlogPosts();
  await seedTariffRequest();

  console.log("Seed-данные Supabase успешно подготовлены.");
}

main()
  .catch((error) => {
    console.error("Не удалось выполнить seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

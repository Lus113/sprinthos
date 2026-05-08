import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";
import { OrderStatus, TariffRequestStatus, TariffType, UserRole } from "@prisma/client";
import { prisma } from "./server/prisma.js";
import {
  ensureStorageBuckets,
  removeFilesByUrls,
  uploadFileToBucket
} from "./server/supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");
const app = express();
const port = Number(process.env.PORT || 3001);
const sessions = new Map();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const orderStatusLabels = {
  [OrderStatus.collecting]: "Собирается",
  [OrderStatus.in_transit]: "В пути",
  [OrderStatus.delivered]: "Доставлен"
};

const tariffStatusLabels = {
  [TariffRequestStatus.not_completed]: "Не выполнен",
  [TariffRequestStatus.in_queue]: "В очереди",
  [TariffRequestStatus.completed]: "Сделан"
};

const tariffTypeLabels = {
  [TariffType.basic]: "Базовый",
  [TariffType.standard]: "Стандарт",
  [TariffType.pro]: "Про"
};

const orderStatusByLabel = {
  Собирается: OrderStatus.collecting,
  "В пути": OrderStatus.in_transit,
  Доставлен: OrderStatus.delivered,
  Оформлен: OrderStatus.collecting
};

const tariffStatusByLabel = {
  "Не выполнен": TariffRequestStatus.not_completed,
  "Не выполнено": TariffRequestStatus.not_completed,
  "В очереди": TariffRequestStatus.in_queue,
  Сделан: TariffRequestStatus.completed,
  Готово: TariffRequestStatus.completed
};

const tariffTypeByLabel = {
  Базовый: TariffType.basic,
  Стандарт: TariffType.standard,
  Про: TariffType.pro,
  "Забота Плюс": TariffType.standard,
  "Профи Стандарт": TariffType.pro
};

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function nowIso() {
  return new Date().toISOString();
}

function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function hashPassword(password) {
  const salt = crypto.randomUUID().replace(/-/g, "");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, savedHash] = String(passwordHash || "").split(":");

  if (!salt || !savedHash) {
    return false;
  }

  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const savedBuffer = Buffer.from(savedHash, "hex");

  if (hashBuffer.length !== savedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, savedBuffer);
}

function readAuthToken(request) {
  const header = request.headers.authorization || "";
  const [type, token] = header.split(" ");
  return type === "Bearer" ? token : null;
}

async function getCurrentUser(request) {
  const token = readAuthToken(request);

  if (!token || !sessions.has(token)) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: sessions.get(token) },
    include: { addresses: true }
  });
}

async function requireAuth(request, response, next) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      response.status(401).json({ message: "Требуется вход в аккаунт." });
      return;
    }

    request.currentUser = currentUser;
    next();
  } catch (error) {
    next(error);
  }
}

async function requireAdmin(request, response, next) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      response.status(401).json({ message: "Требуется вход в аккаунт." });
      return;
    }

    if (currentUser.role !== UserRole.admin) {
      response.status(403).json({ message: "Доступ разрешён только администратору." });
      return;
    }

    request.currentUser = currentUser;
    next();
  } catch (error) {
    next(error);
  }
}

function productToClient(product) {
  const images = [...(product.images || [])]
    .sort((left, right) => {
      if (left.isMain !== right.isMain) {
        return left.isMain ? -1 : 1;
      }

      return left.sortOrder - right.sortOrder;
    })
    .map((image) => image.imageUrl);

  return {
    id: String(product.id),
    slug: slugify(product.name),
    name: product.name,
    category: product.category.slug,
    manufacturer: product.manufacturer || product.name.split(" ")[0],
    price: toNumber(product.price),
    rating: toNumber(product.rating, 4.8),
    stock: product.stockQuantity,
    shortDescription: product.shortDescription,
    description: product.description,
    images,
    specs: product.specsJson || {}
  };
}

function blogPostToClient(post) {
  const extraImages = Array.isArray(post.images) ? post.images.filter(Boolean) : [];
  const content = String(post.fullText || "")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return {
    id: String(post.id),
    slug: slugify(post.title),
    title: post.title,
    excerpt: post.previewText,
    images: [post.coverImageUrl, ...extraImages].filter(Boolean),
    date: post.createdAt,
    readingTime: `${Math.max(2, Math.ceil(String(post.fullText || "").split(/\s+/).filter(Boolean).length / 180))} мин чтения`,
    content
  };
}

function orderToClient(order) {
  const items = (order.items || []).map((item) => ({
    productId: String(item.productId),
    quantity: item.quantity,
    price: toNumber(item.priceAtTime)
  }));
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = toNumber(order.totalAmount);

  return {
    id: String(order.id),
    number: `OPH-${String(order.id).padStart(6, "0")}`,
    userId: order.userId ? String(order.userId) : null,
    recipient: order.recipientName,
    phone: order.recipientPhone,
    address: order.deliveryAddress,
    date: order.createdAt,
    status: orderStatusLabels[order.status],
    subtotal,
    discount: order.discountApplied ? subtotal - total : 0,
    total,
    items
  };
}

function tariffRequestToClient(request) {
  return {
    id: String(request.id),
    name: request.userName,
    phone: request.phone,
    tariff: tariffTypeLabels[request.tariffType],
    status: tariffStatusLabels[request.status],
    date: request.createdAt
  };
}

function userToClient(user) {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    addresses: [...(user.addresses || [])]
      .sort((left, right) => {
        if (left.isDefault !== right.isDefault) {
          return left.isDefault ? -1 : 1;
        }

        return left.id - right.id;
      })
      .map((address) => address.addressText)
  };
}

async function fetchProducts() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      images: true
    },
    orderBy: { createdAt: "desc" }
  });

  return products.map(productToClient);
}

async function fetchBlogPosts() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" }
  });

  return posts.map(blogPostToClient);
}

async function buildCartResponse(userId) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true,
          images: true
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  const detailed = items.map((item) => ({
    productId: String(item.productId),
    quantity: item.quantity,
    product: productToClient(item.product)
  }));
  const subtotal = detailed.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = subtotal > 100000 ? subtotal * 0.24 : 0;
  const total = subtotal - discount;

  return {
    items: detailed,
    subtotal,
    discount,
    total,
    count: detailed.reduce((sum, item) => sum + item.quantity, 0)
  };
}

async function syncGuestCart(userId, items = []) {
  const normalized = Array.isArray(items)
    ? items
        .map((item) => ({
          productId: Number(item.productId),
          quantity: Math.max(1, Number(item.quantity || 1))
        }))
        .filter((item) => Number.isInteger(item.productId))
    : [];

  if (normalized.length) {
    await prisma.$transaction(
      normalized.map((item) =>
        prisma.cartItem.upsert({
          where: {
            userId_productId: {
              userId,
              productId: item.productId
            }
          },
          update: {
            quantity: {
              increment: item.quantity
            }
          },
          create: {
            userId,
            productId: item.productId,
            quantity: item.quantity
          }
        })
      )
    );
  }

  return buildCartResponse(userId);
}

function requireBucket(bucket) {
  if (bucket === "product-images" || bucket === "blog-images") {
    return bucket;
  }

  const error = new Error("Недопустимый бакет загрузки.");
  error.status = 400;
  throw error;
}

function storagePathForUpload(originalName) {
  return `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${String(
    originalName || "image"
  )
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")}`;
}

async function resolveCategoryId(slugOrId) {
  const maybeId = Number(slugOrId);

  if (Number.isInteger(maybeId) && maybeId > 0) {
    return maybeId;
  }

  const category = await prisma.category.findUnique({
    where: { slug: String(slugOrId || "") }
  });

  if (!category) {
    const error = new Error("Категория не найдена.");
    error.status = 400;
    throw error;
  }

  return category.id;
}

async function replaceProductImages(productId, imageUrls = []) {
  const existing = await prisma.productImage.findMany({
    where: { productId }
  });

  await prisma.productImage.deleteMany({
    where: { productId }
  });

  if (imageUrls.length) {
    await prisma.productImage.createMany({
      data: imageUrls.map((imageUrl, index) => ({
        productId,
        imageUrl,
        isMain: index === 0,
        sortOrder: index
      }))
    });
  }

  const removedUrls = existing
    .map((image) => image.imageUrl)
    .filter((url) => !imageUrls.includes(url));

  if (removedUrls.length) {
    await removeFilesByUrls(removedUrls);
  }
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/products", async (_request, response, next) => {
  try {
    response.json(await fetchProducts());
  } catch (error) {
    next(error);
  }
});

app.get("/api/blog-posts", async (_request, response, next) => {
  try {
    response.json(await fetchBlogPosts());
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (request, response, next) => {
  try {
    const email = String(request.body?.email || "").trim().toLowerCase();
    const password = String(request.body?.password || "");

    if (!email || !password) {
      response.status(400).json({ message: "Укажите электронную почту и пароль." });
      return;
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: { addresses: true }
    });
    let created = false;

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashPassword(password),
          name: email.split("@")[0].replace(/[._-]+/g, " "),
          role: UserRole.user
        },
        include: { addresses: true }
      });
      created = true;
    } else if (!verifyPassword(password, user.passwordHash)) {
      response.status(401).json({ message: "Неверный адрес электронной почты или пароль." });
      return;
    }

    const token = crypto.randomUUID();
    sessions.set(token, user.id);

    response.json({
      token,
      created,
      user: userToClient(user)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", requireAuth, async (request, response) => {
  const token = readAuthToken(request);

  if (token) {
    sessions.delete(token);
  }

  response.status(204).end();
});

app.get("/api/auth/me", requireAuth, async (request, response) => {
  response.json(userToClient(request.currentUser));
});

app.get("/api/cart", requireAuth, async (request, response, next) => {
  try {
    response.json(await buildCartResponse(request.currentUser.id));
  } catch (error) {
    next(error);
  }
});

app.post("/api/cart/sync", requireAuth, async (request, response, next) => {
  try {
    response.json(await syncGuestCart(request.currentUser.id, request.body?.items));
  } catch (error) {
    next(error);
  }
});

app.post("/api/cart/items", requireAuth, async (request, response, next) => {
  try {
    const productId = Number(request.body?.productId);
    const quantity = Math.max(1, Number(request.body?.quantity || 1));

    await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: request.currentUser.id,
          productId
        }
      },
      update: { quantity },
      create: {
        userId: request.currentUser.id,
        productId,
        quantity
      }
    });

    response.json(await buildCartResponse(request.currentUser.id));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/cart/items/:productId", requireAuth, async (request, response, next) => {
  try {
    const productId = Number(request.params.productId);
    const quantity = Math.max(1, Number(request.body?.quantity || 1));

    await prisma.cartItem.update({
      where: {
        userId_productId: {
          userId: request.currentUser.id,
          productId
        }
      },
      data: { quantity }
    });

    response.json(await buildCartResponse(request.currentUser.id));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/cart/items/:productId", requireAuth, async (request, response, next) => {
  try {
    const productId = Number(request.params.productId);

    await prisma.cartItem.deleteMany({
      where: {
        userId: request.currentUser.id,
        productId
      }
    });

    response.json(await buildCartResponse(request.currentUser.id));
  } catch (error) {
    next(error);
  }
});

app.get("/api/favorites", requireAuth, async (request, response, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: request.currentUser.id }
    });

    response.json(favorites.map((item) => String(item.productId)));
  } catch (error) {
    next(error);
  }
});

app.post("/api/favorites", requireAuth, async (request, response, next) => {
  try {
    const productId = Number(request.body?.productId);
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: request.currentUser.id,
          productId
        }
      }
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id }
      });
      response.json({ active: false });
      return;
    }

    await prisma.favorite.create({
      data: {
        userId: request.currentUser.id,
        productId
      }
    });

    response.json({ active: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/tariff-requests", async (request, response, next) => {
  try {
    const created = await prisma.tariffRequest.create({
      data: {
        userName: String(request.body?.name || "").trim(),
        phone: String(request.body?.phone || "").trim(),
        tariffType:
          tariffTypeByLabel[String(request.body?.tariff || "").trim()] || TariffType.basic
      }
    });

    response.status(201).json(tariffRequestToClient(created));
  } catch (error) {
    next(error);
  }
});

app.get("/api/orders", requireAuth, async (request, response, next) => {
  try {
    const orders = await prisma.order.findMany({
      where:
        request.currentUser.role === UserRole.admin
          ? undefined
          : { userId: request.currentUser.id },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });

    response.json(orders.map(orderToClient));
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (request, response, next) => {
  try {
    const currentUser = await getCurrentUser(request);
    const cartItems = currentUser
      ? await prisma.cartItem.findMany({
          where: { userId: currentUser.id },
          include: {
            product: true
          }
        })
      : [];

    const providedItems = Array.isArray(request.body?.items) ? request.body.items : [];
    const normalizedItems = currentUser
      ? cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      : providedItems.map((item) => ({
          productId: Number(item.productId),
          quantity: Math.max(1, Number(item.quantity || 1))
        }));

    if (!normalizedItems.length) {
      response.status(400).json({ message: "Корзина пуста." });
      return;
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: normalizedItems.map((item) => item.productId)
        }
      }
    });
    const productById = new Map(products.map((product) => [product.id, product]));

    for (const item of normalizedItems) {
      const product = productById.get(item.productId);

      if (!product) {
        response.status(400).json({ message: "Один из товаров больше не найден." });
        return;
      }

      if (product.stockQuantity < item.quantity) {
        response.status(400).json({
          message: `Недостаточно остатка для товара «${product.name}».`
        });
        return;
      }
    }

    const subtotal = normalizedItems.reduce((sum, item) => {
      const product = productById.get(item.productId);
      return sum + toNumber(product.price) * item.quantity;
    }, 0);
    const discountApplied = subtotal > 100000;
    const totalAmount = discountApplied ? subtotal * 0.76 : subtotal;

    const order = await prisma.$transaction(async (transaction) => {
      const created = await transaction.order.create({
        data: {
          userId: currentUser?.id || null,
          totalAmount,
          discountApplied,
          status: OrderStatus.collecting,
          deliveryAddress: String(request.body?.address || "").trim(),
          recipientName: String(request.body?.fullName || "").trim(),
          recipientPhone: String(request.body?.phone || "").trim()
        }
      });

      await transaction.orderItem.createMany({
        data: normalizedItems.map((item) => {
          const product = productById.get(item.productId);
          return {
            orderId: created.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtTime: product.price
          };
        })
      });

      for (const item of normalizedItems) {
        await transaction.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        });
      }

      if (currentUser) {
        await transaction.cartItem.deleteMany({
          where: { userId: currentUser.id }
        });

        const existingAddress = await transaction.userAddress.findFirst({
          where: {
            userId: currentUser.id,
            addressText: String(request.body?.address || "").trim()
          }
        });

        if (!existingAddress) {
          const hasDefault = await transaction.userAddress.findFirst({
            where: {
              userId: currentUser.id,
              isDefault: true
            }
          });

          await transaction.userAddress.create({
            data: {
              userId: currentUser.id,
              addressText: String(request.body?.address || "").trim(),
              isDefault: !hasDefault
            }
          });
        }
      }

      return transaction.order.findUnique({
        where: { id: created.id },
        include: { items: true }
      });
    });

    response.status(201).json(orderToClient(order));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/orders/:id/status", requireAdmin, async (request, response, next) => {
  try {
    const status =
      orderStatusByLabel[String(request.body?.status || "").trim()] || OrderStatus.collecting;

    const updated = await prisma.order.update({
      where: { id: Number(request.params.id) },
      data: { status },
      include: { items: true }
    });

    response.json(orderToClient(updated));
  } catch (error) {
    next(error);
  }
});

app.get("/api/tariff-requests", requireAdmin, async (_request, response, next) => {
  try {
    const requests = await prisma.tariffRequest.findMany({
      orderBy: { createdAt: "desc" }
    });

    response.json(requests.map(tariffRequestToClient));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/tariff-requests/:id/status", requireAdmin, async (request, response, next) => {
  try {
    const status =
      tariffStatusByLabel[String(request.body?.status || "").trim()] ||
      TariffRequestStatus.not_completed;

    const updated = await prisma.tariffRequest.update({
      where: { id: Number(request.params.id) },
      data: { status }
    });

    response.json(tariffRequestToClient(updated));
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", requireAdmin, async (_request, response, next) => {
  try {
    const users = await prisma.user.findMany({
      include: { addresses: true },
      orderBy: { createdAt: "desc" }
    });

    response.json(users.map(userToClient));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/users/me", requireAuth, async (request, response, next) => {
  try {
    const updated = await prisma.user.update({
      where: { id: request.currentUser.id },
      data: {
        name: String(request.body?.name || request.currentUser.name).trim()
      },
      include: { addresses: true }
    });

    response.json(userToClient(updated));
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/me/addresses", requireAuth, async (request, response, next) => {
  try {
    const address = String(request.body?.address || "").trim();

    if (!address) {
      response.status(400).json({ message: "Укажите адрес доставки." });
      return;
    }

    const existing = await prisma.userAddress.findFirst({
      where: {
        userId: request.currentUser.id,
        addressText: address
      }
    });

    if (!existing) {
      const hasDefault = await prisma.userAddress.findFirst({
        where: {
          userId: request.currentUser.id,
          isDefault: true
        }
      });

      await prisma.userAddress.create({
        data: {
          userId: request.currentUser.id,
          addressText: address,
          isDefault: !hasDefault
        }
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id: request.currentUser.id },
      include: { addresses: true }
    });

    response.json(userToClient(updated));
  } catch (error) {
    next(error);
  }
});

app.post("/api/uploads", requireAdmin, upload.array("images", 5), async (request, response, next) => {
  try {
    const bucket = requireBucket(String(request.query.bucket || "product-images"));
    const files = request.files || [];
    const uploaded = [];

    for (const file of files) {
      uploaded.push(
        await uploadFileToBucket({
          bucket,
          contentType: file.mimetype,
          fileBuffer: file.buffer,
          path: storagePathForUpload(file.originalname)
        })
      );
    }

    response.status(201).json({
      paths: uploaded.map((item) => item.publicUrl)
    });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/uploads", requireAdmin, async (request, response, next) => {
  try {
    const urls = Array.isArray(request.body?.paths) ? request.body.paths : [];
    await removeFilesByUrls(urls);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/products", requireAdmin, async (request, response, next) => {
  try {
    const categoryId = await resolveCategoryId(request.body?.category);

    const created = await prisma.product.create({
      data: {
        name: String(request.body?.name || "").trim(),
        description: String(request.body?.description || "").trim(),
        shortDescription: String(request.body?.shortDescription || "").trim(),
        manufacturer: String(request.body?.manufacturer || "").trim(),
        rating: toNumber(request.body?.rating, 4.7),
        price: toNumber(request.body?.price),
        categoryId,
        stockQuantity: Math.max(0, toNumber(request.body?.stock)),
        specsJson: request.body?.specs || {}
      }
    });

    await replaceProductImages(created.id, Array.isArray(request.body?.images) ? request.body.images : []);

    const product = await prisma.product.findUnique({
      where: { id: created.id },
      include: { category: true, images: true }
    });

    response.status(201).json(productToClient(product));
  } catch (error) {
    next(error);
  }
});

app.put("/api/products/:id", requireAdmin, async (request, response, next) => {
  try {
    const categoryId = await resolveCategoryId(request.body?.category);
    const productId = Number(request.params.id);

    await prisma.product.update({
      where: { id: productId },
      data: {
        name: String(request.body?.name || "").trim(),
        description: String(request.body?.description || "").trim(),
        shortDescription: String(request.body?.shortDescription || "").trim(),
        manufacturer: String(request.body?.manufacturer || "").trim(),
        rating: toNumber(request.body?.rating, 4.7),
        price: toNumber(request.body?.price),
        categoryId,
        stockQuantity: Math.max(0, toNumber(request.body?.stock)),
        specsJson: request.body?.specs || {}
      }
    });

    await replaceProductImages(productId, Array.isArray(request.body?.images) ? request.body.images : []);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, images: true }
    });

    response.json(productToClient(product));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/products/:id", requireAdmin, async (request, response, next) => {
  try {
    const productId = Number(request.params.id);
    const existingImages = await prisma.productImage.findMany({
      where: { productId }
    });

    await prisma.product.delete({
      where: { id: productId }
    });

    await removeFilesByUrls(existingImages.map((image) => image.imageUrl));
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/blog-posts", requireAdmin, async (request, response, next) => {
  try {
    const images = Array.isArray(request.body?.images) ? request.body.images : [];
    const created = await prisma.blogPost.create({
      data: {
        title: String(request.body?.title || "").trim(),
        previewText: String(request.body?.excerpt || "").trim(),
        fullText: String(request.body?.content || "").trim(),
        coverImageUrl: images[0] || null,
        images: images.slice(1)
      }
    });

    response.status(201).json(blogPostToClient(created));
  } catch (error) {
    next(error);
  }
});

app.put("/api/blog-posts/:id", requireAdmin, async (request, response, next) => {
  try {
    const postId = Number(request.params.id);
    const existing = await prisma.blogPost.findUnique({
      where: { id: postId }
    });
    const images = Array.isArray(request.body?.images) ? request.body.images : [];

    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        title: String(request.body?.title || "").trim(),
        previewText: String(request.body?.excerpt || "").trim(),
        fullText: String(request.body?.content || "").trim(),
        coverImageUrl: images[0] || null,
        images: images.slice(1)
      }
    });

    const previousImages = [existing.coverImageUrl, ...(Array.isArray(existing.images) ? existing.images : [])].filter(Boolean);
    const removedImages = previousImages.filter((url) => !images.includes(url));

    if (removedImages.length) {
      await removeFilesByUrls(removedImages);
    }

    const updated = await prisma.blogPost.findUnique({
      where: { id: postId }
    });

    response.json(blogPostToClient(updated));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/blog-posts/:id", requireAdmin, async (request, response, next) => {
  try {
    const postId = Number(request.params.id);
    const existing = await prisma.blogPost.findUnique({
      where: { id: postId }
    });

    await prisma.blogPost.delete({
      where: { id: postId }
    });

    const urls = [existing.coverImageUrl, ...(Array.isArray(existing.images) ? existing.images : [])].filter(Boolean);
    if (urls.length) {
      await removeFilesByUrls(urls);
    }

    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use(express.static(distDir));

app.get("/{*path}", (request, response, next) => {
  if (request.path.startsWith("/api/")) {
    next();
    return;
  }

  response.sendFile(path.join(distDir, "index.html"));
});

app.use((error, _request, response, _next) => {
  const status = Number(error?.status) || 500;
  const message = error?.message || "Внутренняя ошибка сервера.";

  if (status >= 500) {
    console.error(error);
  }

  response.status(status).json({ message });
});

async function start() {
  await prisma.$connect();

  try {
    await ensureStorageBuckets();
  } catch (error) {
    console.warn("Не удалось инициализировать Supabase Storage:", error.message);
  }

  app.listen(port, () => {
    console.log(`API Офелии запущен на http://127.0.0.1:${port}`);
  });
}

start().catch((error) => {
  console.error("Не удалось запустить сервер:", error);
  process.exit(1);
});

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  blogPosts as seedPosts,
  faqs,
  navigationLinks,
  orders as seedOrders,
  partners,
  products as seedProducts,
  siteCopy,
  tariffRequests as seedRequests,
  tariffs,
  users as seedUsers
} from "../data/seed";

const STORAGE_KEY = "ophelia-store-state-v2";

const AppStateContext = createContext(null);

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createInitialState() {
  return {
    products: seedProducts,
    blogPosts: seedPosts,
    users: seedUsers,
    orders: seedOrders,
    tariffRequests: seedRequests,
    cart: [],
    session: { userId: null, token: null },
    favoritesByUser: {}
  };
}

function loadState() {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createInitialState();
    }

    const parsed = JSON.parse(raw);

    return {
      ...createInitialState(),
      ...parsed
    };
  } catch {
    return createInitialState();
  }
}

function normalizeImages(input, fallback = []) {
  if (Array.isArray(input) && input.length > 0) {
    return input.filter(Boolean).slice(0, 5);
  }

  if (typeof input === "string" && input.trim()) {
    return [input.trim()];
  }

  return fallback;
}

export function AppStateProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.session.userId) || null,
    [state.session.userId, state.users]
  );

  const favorites = currentUser
    ? state.favoritesByUser[currentUser.id] || []
    : [];

  const cartDetailed = useMemo(
    () =>
      state.cart
        .map((item) => {
          const product = state.products.find((entry) => entry.id === item.productId);
          return product ? { ...item, product } : null;
        })
        .filter(Boolean),
    [state.cart, state.products]
  );

  const cartSubtotal = cartDetailed.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const cartDiscount = cartSubtotal > 100000 ? cartSubtotal * 0.24 : 0;
  const cartTotal = cartSubtotal - cartDiscount;
  const cartCount = cartDetailed.reduce((sum, item) => sum + item.quantity, 0);

  const categories = useMemo(
    () => Array.from(new Set(state.products.map((product) => product.category))),
    [state.products]
  );

  const login = ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = state.users.find(
      (user) => user.email.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      if (existingUser.password !== password) {
        return { ok: false, message: "Неверный пароль." };
      }

      setState((current) => ({
        ...current,
        session: {
          userId: existingUser.id,
          token: `token-${Date.now()}`
        }
      }));

      return { ok: true, user: existingUser };
    }

    if (password.trim().length < 6) {
      return {
        ok: false,
        message: "Используйте не менее 6 символов для создания аккаунта покупателя."
      };
    }

    const nameFromEmail =
      normalizedEmail.split("@")[0].replace(/[._-]+/g, " ") || "Новый покупатель";
    const createdUser = {
      id: `user-${Date.now()}`,
      role: "user",
      name: nameFromEmail.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      email: normalizedEmail,
      password,
      addresses: []
    };

    setState((current) => ({
      ...current,
      users: [...current.users, createdUser],
      session: {
        userId: createdUser.id,
        token: `token-${Date.now()}`
      }
    }));

    return { ok: true, user: createdUser, created: true };
  };

  const logout = () => {
    setState((current) => ({
      ...current,
      session: { userId: null, token: null }
    }));
  };

  const addToCart = (productId, quantity = 1) => {
    setState((current) => {
      const product = current.products.find((entry) => entry.id === productId);

      if (!product) {
        return current;
      }

      const nextQty = Math.max(1, Math.min(quantity, product.stock));
      const existing = current.cart.find((item) => item.productId === productId);

      if (existing) {
        return {
          ...current,
          cart: current.cart.map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  quantity: Math.min(item.quantity + nextQty, product.stock)
                }
              : item
          )
        };
      }

      return {
        ...current,
        cart: [...current.cart, { productId, quantity: nextQty }]
      };
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    setState((current) => {
      const product = current.products.find((entry) => entry.id === productId);

      if (!product) {
        return current;
      }

      const nextQuantity = Math.max(1, Math.min(quantity, product.stock));

      return {
        ...current,
        cart: current.cart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: nextQuantity }
            : item
        )
      };
    });
  };

  const removeFromCart = (productId) => {
    setState((current) => ({
      ...current,
      cart: current.cart.filter((item) => item.productId !== productId)
    }));
  };

  const toggleFavorite = (productId) => {
    if (!currentUser) {
      return { ok: false, message: "Войдите в аккаунт, чтобы сохранять избранное." };
    }

    setState((current) => {
      const existingFavorites = current.favoritesByUser[currentUser.id] || [];
      const hasProduct = existingFavorites.includes(productId);

      return {
        ...current,
        favoritesByUser: {
          ...current.favoritesByUser,
          [currentUser.id]: hasProduct
            ? existingFavorites.filter((id) => id !== productId)
            : [...existingFavorites, productId]
        }
      };
    });

    return { ok: true };
  };

  const submitTariffRequest = ({ name, phone, tariff }) => {
    const request = {
      id: `request-${Date.now()}`,
      name,
      phone,
      tariff,
      status: "Не выполнено",
      date: new Date().toISOString()
    };

    setState((current) => ({
      ...current,
      tariffRequests: [request, ...current.tariffRequests]
    }));

    return request;
  };

  const submitOrder = ({ fullName, phone, address }) => {
    const order = {
      id: `order-${Date.now()}`,
      number: `OPH-${String(Date.now()).slice(-6)}`,
      userId: currentUser?.id || null,
      recipient: fullName,
      phone,
      address,
      date: new Date().toISOString(),
      status: "Оформлен",
      subtotal: cartSubtotal,
      discount: cartDiscount,
      total: cartTotal,
      items: cartDetailed.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }))
    };

    setState((current) => ({
      ...current,
      orders: [order, ...current.orders],
      cart: [],
      users: currentUser
        ? current.users.map((user) =>
            user.id === currentUser.id
              ? {
                  ...user,
                  addresses: user.addresses.includes(address)
                    ? user.addresses
                    : [address, ...user.addresses]
                }
              : user
          )
        : current.users,
      products: current.products.map((product) => {
        const orderedItem = order.items.find((item) => item.productId === product.id);
        return orderedItem
          ? { ...product, stock: Math.max(0, product.stock - orderedItem.quantity) }
          : product;
      })
    }));

    return order;
  };

  const addAddress = (address) => {
    if (!currentUser || !address.trim()) {
      return;
    }

    setState((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === currentUser.id
          ? {
              ...user,
              addresses: user.addresses.includes(address.trim())
                ? user.addresses
                : [address.trim(), ...user.addresses]
            }
          : user
      )
    }));
  };

  const updateProfile = ({ name }) => {
    if (!currentUser) {
      return;
    }

    setState((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === currentUser.id ? { ...user, name: name.trim() } : user
      )
    }));
  };

  const upsertProduct = (productInput) => {
    setState((current) => {
      const images = normalizeImages(productInput.images, productInput.photoUrl
        ? productInput.photoUrl
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : []);

      const nextProduct = {
        id: productInput.id || `prod-${Date.now()}`,
        slug: productInput.slug || slugify(productInput.name),
        name: productInput.name,
        category: productInput.category,
        manufacturer: productInput.manufacturer,
        price: Number(productInput.price),
        rating: Number(productInput.rating || 4.7),
        stock: Number(productInput.stock),
        shortDescription: productInput.shortDescription,
        description: productInput.description,
        images,
        specs: {
          Особенность: productInput.featureOne || "Премиальное исполнение",
          Гарантия: productInput.featureTwo || "Официальная поддержка",
          Доставка: productInput.featureThree || "Доступно по всей стране",
          Отделка: productInput.featureFour || "Отобрано Ophelia"
        }
      };

      const exists = current.products.some((product) => product.id === nextProduct.id);

      return {
        ...current,
        products: exists
          ? current.products.map((product) =>
              product.id === nextProduct.id ? nextProduct : product
            )
          : [nextProduct, ...current.products]
      };
    });
  };

  const deleteProduct = (productId) => {
    setState((current) => ({
      ...current,
      products: current.products.filter((product) => product.id !== productId),
      cart: current.cart.filter((item) => item.productId !== productId)
    }));
  };

  const upsertBlogPost = (postInput) => {
    setState((current) => {
      const nextPost = {
        id: postInput.id || `post-${Date.now()}`,
        slug: postInput.slug || slugify(postInput.title),
        title: postInput.title,
        excerpt: postInput.excerpt,
        images: normalizeImages(postInput.images, postInput.image ? [postInput.image] : []),
        date: postInput.date || new Date().toISOString().slice(0, 10),
        readingTime: postInput.readingTime || "4 мин чтения",
        content: postInput.content
          .split("\n")
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
      };

      const exists = current.blogPosts.some((post) => post.id === nextPost.id);

      return {
        ...current,
        blogPosts: exists
          ? current.blogPosts.map((post) => (post.id === nextPost.id ? nextPost : post))
          : [nextPost, ...current.blogPosts]
      };
    });
  };

  const deleteBlogPost = (postId) => {
    setState((current) => ({
      ...current,
      blogPosts: current.blogPosts.filter((post) => post.id !== postId)
    }));
  };

  const updateOrderStatus = (orderId, status) => {
    setState((current) => ({
      ...current,
      orders: current.orders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    }));
  };

  const updateRequestStatus = (requestId, status) => {
    setState((current) => ({
      ...current,
      tariffRequests: current.tariffRequests.map((request) =>
        request.id === requestId ? { ...request, status } : request
      )
    }));
  };

  const updateWarehouseStock = (productId, stock) => {
    setState((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId
          ? { ...product, stock: Math.max(0, Number(stock)) }
          : product
      )
    }));
  };

  const value = {
    navigationLinks,
    siteCopy,
    partners,
    faqs,
    tariffs,
    categories,
    currentUser,
    favorites,
    cartDetailed,
    cartSubtotal,
    cartDiscount,
    cartTotal,
    cartCount,
    products: state.products,
    blogPosts: state.blogPosts,
    orders: state.orders,
    tariffRequests: state.tariffRequests,
    users: state.users,
    login,
    logout,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    toggleFavorite,
    submitTariffRequest,
    submitOrder,
    addAddress,
    updateProfile,
    upsertProduct,
    deleteProduct,
    upsertBlogPost,
    deleteBlogPost,
    updateOrderStatus,
    updateRequestStatus,
    updateWarehouseStock,
    isFavorite: (productId) => favorites.includes(productId)
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return context;
}

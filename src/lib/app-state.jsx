import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { faqs, navigationLinks, partners, siteCopy, tariffs } from "../data/seed";
import { apiRequest } from "./api";

const SESSION_KEY = "ophelia-session-v4";
const GUEST_CART_KEY = "ophelia-guest-cart-v1";

const AppStateContext = createContext(null);

const emptyCart = {
  items: [],
  subtotal: 0,
  discount: 0,
  total: 0,
  count: 0
};

function loadSession() {
  if (typeof window === "undefined") {
    return { token: null };
  }

  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) || '{"token":null}');
  } catch {
    return { token: null };
  }
}

function normalizeGuestItems(items) {
  return Array.isArray(items)
    ? items
        .map((item) => ({
          productId: String(item.productId),
          quantity: Math.max(1, Number(item.quantity || 1))
        }))
        .filter((item) => item.productId && Number.isFinite(item.quantity))
    : [];
}

function loadGuestCartItems() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return normalizeGuestItems(JSON.parse(window.localStorage.getItem(GUEST_CART_KEY) || "[]"));
  } catch {
    return [];
  }
}

function buildGuestCart(guestItems, products) {
  const items = normalizeGuestItems(guestItems)
    .map((item) => {
      const product = products.find((entry) => String(entry.id) === String(item.productId));
      return product ? { productId: String(item.productId), quantity: item.quantity, product } : null;
    })
    .filter(Boolean);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = subtotal > 100000 ? subtotal * 0.24 : 0;
  const total = subtotal - discount;

  return {
    items,
    subtotal,
    discount,
    total,
    count: items.reduce((sum, item) => sum + item.quantity, 0)
  };
}

function productPayloadFromForm(productInput) {
  return {
    name: productInput.name,
    category: productInput.category,
    manufacturer: productInput.manufacturer,
    price: Number(productInput.price),
    rating: Number(productInput.rating || 4.7),
    stock: Number(productInput.stock || 0),
    shortDescription: productInput.shortDescription,
    description: productInput.description,
    images: productInput.images || [],
    specs: {
      Особенность: productInput.featureOne || "Премиальное исполнение",
      Гарантия: productInput.featureTwo || "Официальная поддержка",
      Доставка: productInput.featureThree || "Доступно по всей стране",
      Отделка: productInput.featureFour || "Отобрано Офелией"
    }
  };
}

function contentToEditorString(content) {
  return Array.isArray(content) ? content.join("\n") : String(content || "");
}

export function AppStateProvider({ children }) {
  const [session, setSession] = useState(loadSession);
  const [guestCartItems, setGuestCartItems] = useState(loadGuestCartItems);
  const [products, setProducts] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tariffRequests, setTariffRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState(emptyCart);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }, [session]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCartItems));
    }
  }, [guestCartItems]);

  const fetchPublicData = useCallback(async () => {
    const [nextProducts, nextPosts] = await Promise.all([
      apiRequest("/api/products"),
      apiRequest("/api/blog-posts")
    ]);
    setProducts(nextProducts);
    setBlogPosts(nextPosts);
    return nextProducts;
  }, []);

  const fetchAuthenticatedData = useCallback(
    async (tokenOverride = session.token) => {
      if (!tokenOverride) {
        setCurrentUser(null);
        setFavorites([]);
        setOrders([]);
        setTariffRequests([]);
        setUsers([]);
        return null;
      }

      try {
        const me = await apiRequest("/api/auth/me", { token: tokenOverride });
        setCurrentUser(me);

        const [nextFavorites, nextOrders] = await Promise.all([
          apiRequest("/api/favorites", { token: tokenOverride }),
          apiRequest("/api/orders", { token: tokenOverride })
        ]);

        setFavorites(nextFavorites);
        setOrders(nextOrders);

        if (me.role === "admin") {
          const [nextRequests, nextUsers] = await Promise.all([
            apiRequest("/api/tariff-requests", { token: tokenOverride }),
            apiRequest("/api/users", { token: tokenOverride })
          ]);

          setTariffRequests(nextRequests);
          setUsers(nextUsers);
        } else {
          setTariffRequests([]);
          setUsers([]);
        }

        return me;
      } catch (error) {
        if (error.status === 401) {
          setSession({ token: null });
          setCurrentUser(null);
          setFavorites([]);
          setOrders([]);
          setTariffRequests([]);
          setUsers([]);
          return null;
        }

        throw error;
      }
    },
    [session.token]
  );

  const fetchCart = useCallback(
    async (tokenOverride = session.token, productList = products) => {
      if (!tokenOverride) {
        const guestCart = buildGuestCart(guestCartItems, productList);
        setCart(guestCart);
        return guestCart;
      }

      const nextCart = await apiRequest("/api/cart", { token: tokenOverride });
      setCart(nextCart);
      return nextCart;
    },
    [guestCartItems, products, session.token]
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const nextProducts = await fetchPublicData();
        const me = await fetchAuthenticatedData();

        if (session.token && me) {
          await fetchCart(session.token, nextProducts);
        } else {
          setCart(buildGuestCart(loadGuestCartItems(), nextProducts));
        }
      } finally {
        setAuthResolved(true);
      }
    };

    bootstrap();
  }, [fetchAuthenticatedData, fetchCart, fetchPublicData, session.token]);

  useEffect(() => {
    if (!session.token && products.length) {
      setCart(buildGuestCart(guestCartItems, products));
    }
  }, [guestCartItems, products, session.token]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))),
    [products]
  );

  const login = async ({ email, password }) => {
    try {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password }
      });

      setSession({ token: result.token });

      if (guestCartItems.length) {
        await apiRequest("/api/cart/sync", {
          method: "POST",
          token: result.token,
          body: { items: guestCartItems }
        });
        setGuestCartItems([]);
      }

      setCurrentUser(result.user);
      await fetchAuthenticatedData(result.token);
      await fetchCart(result.token, products);
      return { ok: true, user: result.user, created: result.created };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  };

  const logout = async () => {
    if (session.token) {
      try {
        await apiRequest("/api/auth/logout", {
          method: "POST",
          token: session.token
        });
      } catch {}
    }

    setSession({ token: null });
    setCurrentUser(null);
    setFavorites([]);
    setOrders([]);
    setTariffRequests([]);
    setUsers([]);
    setCart(buildGuestCart(guestCartItems, products));
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!session.token) {
      const existing = guestCartItems.find((item) => String(item.productId) === String(productId));
      const nextItems = existing
        ? guestCartItems.map((item) =>
            String(item.productId) === String(productId)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        : [...guestCartItems, { productId: String(productId), quantity }];

      setGuestCartItems(nextItems);
      setCart(buildGuestCart(nextItems, products));
      return;
    }

    const existing = cart.items.find((item) => String(item.productId) === String(productId));
    const nextQuantity = existing ? existing.quantity + quantity : quantity;
    setCart(
      await apiRequest("/api/cart/items", {
        method: "POST",
        token: session.token,
        body: { productId: Number(productId), quantity: nextQuantity }
      })
    );
  };

  const updateCartQuantity = async (productId, quantity) => {
    if (!session.token) {
      const nextItems = guestCartItems.map((item) =>
        String(item.productId) === String(productId)
          ? { ...item, quantity }
          : item
      );
      setGuestCartItems(nextItems);
      setCart(buildGuestCart(nextItems, products));
      return;
    }

    setCart(
      await apiRequest(`/api/cart/items/${productId}`, {
        method: "PATCH",
        token: session.token,
        body: { quantity }
      })
    );
  };

  const removeFromCart = async (productId) => {
    if (!session.token) {
      const nextItems = guestCartItems.filter((item) => String(item.productId) !== String(productId));
      setGuestCartItems(nextItems);
      setCart(buildGuestCart(nextItems, products));
      return;
    }

    setCart(
      await apiRequest(`/api/cart/items/${productId}`, {
        method: "DELETE",
        token: session.token
      })
    );
  };

  const toggleFavorite = async (productId) => {
    if (!currentUser) {
      return { ok: false, message: "Войдите в аккаунт, чтобы сохранять избранное." };
    }

    const result = await apiRequest("/api/favorites", {
      method: "POST",
      token: session.token,
      body: { productId: Number(productId) }
    });

    setFavorites((current) =>
      result.active
        ? [...current, String(productId)]
        : current.filter((id) => String(id) !== String(productId))
    );

    return { ok: true };
  };

  const submitTariffRequest = async ({ name, phone, tariff }) => {
    const request = await apiRequest("/api/tariff-requests", {
      method: "POST",
      body: { name, phone, tariff }
    });

    if (currentUser?.role === "admin") {
      setTariffRequests((current) => [request, ...current]);
    }

    return request;
  };

  const submitOrder = async ({ fullName, phone, address }) => {
    const order = await apiRequest("/api/orders", {
      method: "POST",
      token: session.token,
      body: {
        fullName,
        phone,
        address,
        items: session.token ? undefined : guestCartItems
      }
    });

    if (session.token) {
      setCart(emptyCart);
      await fetchAuthenticatedData(session.token);
    } else {
      setGuestCartItems([]);
      setCart(emptyCart);
    }

    const orderedItems = order.items || [];
    setProducts((current) =>
      current.map((product) => {
        const orderedItem = orderedItems.find(
          (item) => String(item.productId) === String(product.id)
        );
        return orderedItem
          ? { ...product, stock: Math.max(0, product.stock - orderedItem.quantity) }
          : product;
      })
    );

    return order;
  };

  const addAddress = async (address) => {
    if (!currentUser || !address.trim()) {
      return;
    }

    const nextUser = await apiRequest("/api/users/me/addresses", {
      method: "POST",
      token: session.token,
      body: { address }
    });

    setCurrentUser(nextUser);
  };

  const updateProfile = async ({ name }) => {
    if (!currentUser) {
      return;
    }

    const nextUser = await apiRequest("/api/users/me", {
      method: "PATCH",
      token: session.token,
      body: { name }
    });

    setCurrentUser(nextUser);
  };

  const uploadImages = async (files, bucket = "product-images") => {
    const formData = new FormData();

    for (const file of files) {
      formData.append("images", file);
    }

    const result = await apiRequest(`/api/uploads?bucket=${encodeURIComponent(bucket)}`, {
      method: "POST",
      token: session.token,
      body: formData
    });

    return result.paths || [];
  };

  const deleteUploadedImages = async (paths) => {
    if (!paths.length) {
      return;
    }

    await apiRequest("/api/uploads", {
      method: "DELETE",
      token: session.token,
      body: { paths }
    });
  };

  const upsertProduct = async (productInput) => {
    const payload = productPayloadFromForm(productInput);
    const result = productInput.id
      ? await apiRequest(`/api/products/${productInput.id}`, {
          method: "PUT",
          token: session.token,
          body: payload
        })
      : await apiRequest("/api/products", {
          method: "POST",
          token: session.token,
          body: payload
        });

    setProducts((current) =>
      current.some((product) => String(product.id) === String(result.id))
        ? current.map((product) => (String(product.id) === String(result.id) ? result : product))
        : [result, ...current]
    );

    return result;
  };

  const deleteProduct = async (productId) => {
    await apiRequest(`/api/products/${productId}`, {
      method: "DELETE",
      token: session.token
    });

    setProducts((current) => current.filter((product) => String(product.id) !== String(productId)));
    setCart((current) => ({
      ...current,
      items: current.items.filter((item) => String(item.productId) !== String(productId))
    }));
    setGuestCartItems((current) => current.filter((item) => String(item.productId) !== String(productId)));
  };

  const upsertBlogPost = async (postInput) => {
    const payload = {
      title: postInput.title,
      excerpt: postInput.excerpt,
      images: postInput.images || [],
      content: contentToEditorString(postInput.content)
    };

    const result = postInput.id
      ? await apiRequest(`/api/blog-posts/${postInput.id}`, {
          method: "PUT",
          token: session.token,
          body: payload
        })
      : await apiRequest("/api/blog-posts", {
          method: "POST",
          token: session.token,
          body: payload
        });

    setBlogPosts((current) =>
      current.some((post) => String(post.id) === String(result.id))
        ? current.map((post) => (String(post.id) === String(result.id) ? result : post))
        : [result, ...current]
    );
  };

  const deleteBlogPost = async (postId) => {
    await apiRequest(`/api/blog-posts/${postId}`, {
      method: "DELETE",
      token: session.token
    });

    setBlogPosts((current) => current.filter((post) => String(post.id) !== String(postId)));
  };

  const updateOrderStatus = async (orderId, status) => {
    const nextOrder = await apiRequest(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      token: session.token,
      body: { status }
    });

    setOrders((current) =>
      current.map((order) => (String(order.id) === String(nextOrder.id) ? nextOrder : order))
    );
  };

  const updateRequestStatus = async (requestId, status) => {
    const nextRequest = await apiRequest(`/api/tariff-requests/${requestId}/status`, {
      method: "PATCH",
      token: session.token,
      body: { status }
    });

    setTariffRequests((current) =>
      current.map((request) =>
        String(request.id) === String(nextRequest.id) ? nextRequest : request
      )
    );
  };

  const updateWarehouseStock = async (productId, stock) => {
    const product = products.find((entry) => String(entry.id) === String(productId));

    if (!product) {
      return;
    }

    const payload = {
      ...productPayloadFromForm({
        ...product,
        stock,
        featureOne: Object.values(product.specs || {})[0] || "",
        featureTwo: Object.values(product.specs || {})[1] || "",
        featureThree: Object.values(product.specs || {})[2] || "",
        featureFour: Object.values(product.specs || {})[3] || ""
      })
    };

    const nextProduct = await apiRequest(`/api/products/${productId}`, {
      method: "PUT",
      token: session.token,
      body: payload
    });

    setProducts((current) =>
      current.map((entry) => (String(entry.id) === String(nextProduct.id) ? nextProduct : entry))
    );
  };

  const value = {
    navigationLinks,
    siteCopy,
    partners,
    faqs,
    tariffs,
    categories,
    currentUser,
    authResolved,
    favorites,
    cartDetailed: cart.items,
    cartSubtotal: cart.subtotal,
    cartDiscount: cart.discount,
    cartTotal: cart.total,
    cartCount: cart.count,
    products,
    blogPosts,
    orders,
    tariffRequests,
    users,
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
    uploadImages,
    deleteUploadedImages,
    upsertProduct,
    deleteProduct,
    upsertBlogPost,
    deleteBlogPost,
    updateOrderStatus,
    updateRequestStatus,
    updateWarehouseStock,
    isFavorite: (productId) => favorites.includes(String(productId))
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

import { CheckCircle2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import Modal from "../components/Modal";
import QuantitySelector from "../components/QuantitySelector";
import Reveal from "../components/Reveal";
import { useAppState } from "../lib/app-state";
import { clearRussianValidity, handleRussianInvalid } from "../lib/form-validation";
import { formatPrice } from "../lib/format";

const initialForm = {
  address: "",
  fullName: "",
  phone: "",
  consent: false
};

export default function CartPage() {
  const {
    cartDetailed,
    cartDiscount,
    cartSubtotal,
    cartTotal,
    currentUser,
    removeFromCart,
    submitOrder,
    updateCartQuantity
  } = useAppState();
  const [form, setForm] = useState(() => ({
    ...initialForm,
    fullName: currentUser?.name || "",
    address: currentUser?.addresses?.[0] || ""
  }));
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const cartIsEmpty = cartDetailed.length === 0;

  const totalItems = useMemo(
    () => cartDetailed.reduce((sum, item) => sum + item.quantity, 0),
    [cartDetailed]
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    if (cartIsEmpty || !form.consent) {
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      const order = submitOrder({
        fullName: form.fullName,
        phone: form.phone,
        address: form.address
      });
      setCompletedOrder(order);
      setSubmitting(false);
      setForm(initialForm);
    }, 900);
  };

  return (
    <div className="container-shell py-12">
      <Reveal>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-700">
              Корзина
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-stone-900">Оформление заказа без лишней суеты.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
              Меняйте количество, смотрите автоматическую скидку для крупных заказов и проходите
              демо-оплату с подтверждением и отслеживанием в админке.
            </p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-700">
            {totalItems} шт.
          </div>
        </div>
      </Reveal>

      {cartIsEmpty ? (
        <Reveal>
          <div className="soft-card mt-10 rounded-[32px] p-10 text-center">
            <h2 className="text-3xl font-semibold text-stone-900">Корзина пока пуста.</h2>
            <p className="mt-4 text-stone-600">
              Добавьте товары из каталога, чтобы увидеть итоговую сумму, скидки и форму оформления.
            </p>
            <Link to="/catalog" className="mt-8 inline-flex">
              <Button>Открыть каталог</Button>
            </Link>
          </div>
        </Reveal>
      ) : (
        <div className="mt-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="flex flex-col gap-4">
            {cartDetailed.map((item) => (
              <Reveal key={item.product.id}>
                <article className="soft-card grid gap-5 rounded-[28px] p-5 md:grid-cols-[180px_1fr_auto] md:items-center">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="h-40 w-full rounded-[22px] object-cover"
                  />
                  <div>
                    <p className="text-sm text-stone-500">{item.product.manufacturer}</p>
                    <h2 className="mt-1 text-2xl font-semibold text-stone-900">
                      {item.product.name}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      {item.product.shortDescription}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-4">
                      <QuantitySelector
                        value={item.quantity}
                        onChange={(value) => updateCartQuantity(item.product.id, value)}
                        max={item.product.stock}
                      />
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                        Удалить
                      </button>
                    </div>
                  </div>
                  <div className="md:text-right">
                    <p className="text-sm text-stone-500">Сумма</p>
                    <p className="mt-2 text-2xl font-semibold text-stone-900">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </section>

          <Reveal>
            <aside className="soft-card rounded-[32px] p-7 md:p-8">
              <h2 className="text-2xl font-semibold text-stone-900">Сводка по заказу</h2>
              <div className="mt-6 flex flex-col gap-4 rounded-[24px] bg-[var(--surface-muted)] p-5">
                <div className="flex items-center justify-between text-sm text-stone-600">
                  <span>Подытог</span>
                  <span>{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-stone-600">
                  <span>Скидка</span>
                  <span className="text-lime-800">
                    {cartDiscount > 0 ? `− ${formatPrice(cartDiscount)}` : formatPrice(0)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-stone-900/8 pt-4 text-lg font-semibold text-stone-900">
                  <span>Итого</span>
                  <div className="text-right">
                    {cartDiscount > 0 && (
                      <p className="text-sm font-medium text-stone-400 line-through">
                        {formatPrice(cartSubtotal)}
                      </p>
                    )}
                    <p>{formatPrice(cartTotal)}</p>
                  </div>
                </div>
                {cartDiscount > 0 && (
                  <div className="rounded-[18px] bg-lime-100 px-4 py-3 text-sm text-lime-900">
                    Для корзин свыше 100 000 ₽ автоматически применяется скидка 24%.
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
                <input
                  className="input-base"
                  placeholder="Адрес доставки"
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  onInvalid={handleRussianInvalid}
                  onInput={clearRussianValidity}
                  required
                />
                <input
                  className="input-base"
                  placeholder="ФИО получателя"
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  onInvalid={handleRussianInvalid}
                  onInput={clearRussianValidity}
                  required
                />
                <input
                  className="input-base"
                  placeholder="Номер телефона"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  onInvalid={handleRussianInvalid}
                  onInput={clearRussianValidity}
                  required
                />
                <label className="flex items-start gap-3 rounded-[20px] bg-white p-4 text-sm leading-6 text-stone-600">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, consent: event.target.checked }))
                    }
                    onInvalid={handleRussianInvalid}
                    onInput={clearRussianValidity}
                    className="mt-1 size-4 accent-lime-600"
                    required
                  />
                  <span>Я согласен(на) на обработку персональных данных.</span>
                </label>
                <Button type="submit" loading={submitting} className="w-full justify-center py-4">
                  Подтвердить заказ
                </Button>
              </form>
            </aside>
          </Reveal>
        </div>
      )}

      <Modal
        open={Boolean(completedOrder)}
        onClose={() => setCompletedOrder(null)}
        title="Заказ подтверждён"
      >
        {completedOrder && (
          <div className="flex flex-col gap-4">
            <div className="inline-flex size-14 items-center justify-center rounded-full bg-lime-100 text-lime-700">
              <CheckCircle2 className="size-7" />
            </div>
            <p className="text-lg leading-8 text-stone-700">
              Заказ № <span className="font-semibold text-stone-900">{completedOrder.number}</span>{" "}
              успешно оформлен. Спасибо за покупку.
            </p>
            <p className="text-sm leading-7 text-stone-600">
              Заказ уже отображается в админ-панели и, если вы были авторизованы, в истории покупок.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

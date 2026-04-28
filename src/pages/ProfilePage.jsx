import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import Reveal from "../components/Reveal";
import { useAppState } from "../lib/app-state";
import { formatDate, formatPrice } from "../lib/format";

const tabs = ["Профиль", "История покупок", "Адреса доставки"];

export default function ProfilePage() {
  const { addAddress, currentUser, orders, updateProfile } = useAppState();
  const [activeTab, setActiveTab] = useState("Профиль");
  const [profileName, setProfileName] = useState(currentUser?.name || "");
  const [newAddress, setNewAddress] = useState("");

  const userOrders = useMemo(
    () => orders.filter((order) => order.userId === currentUser?.id),
    [currentUser?.id, orders]
  );

  if (!currentUser) {
    return (
      <div className="container-shell py-20">
        <div className="soft-card rounded-[30px] p-10 text-center">
          <h1 className="text-3xl font-semibold text-stone-900">Войдите, чтобы открыть личный кабинет.</h1>
          <p className="mt-4 text-stone-600">
            Здесь доступны профиль, история покупок и сохранённые адреса доставки.
          </p>
          <Link to="/login" className="mt-8 inline-flex">
            <Button>Перейти ко входу</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-shell py-12">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-700">
              Личный кабинет
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-stone-900">{currentUser.name}</h1>
            <p className="mt-4 text-base text-stone-600">{currentUser.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
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

      <Reveal className="mt-8">
        <section className="soft-card rounded-[34px] p-8 md:p-10">
          {activeTab === "Профиль" && (
            <div className="grid gap-4 md:max-w-2xl">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-stone-700">Имя</span>
                <input
                  className="input-base"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-stone-700">Эл. почта</span>
                <input className="input-base" value={currentUser.email} disabled />
              </label>
              <div>
                <Button onClick={() => updateProfile({ name: profileName })}>Сохранить профиль</Button>
              </div>
            </div>
          )}

          {activeTab === "История покупок" && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-stone-700">
                <thead>
                  <tr className="border-b border-stone-900/10 text-stone-500">
                    <th className="pb-4 pr-6 font-medium">Номер</th>
                    <th className="pb-4 pr-6 font-medium">Дата</th>
                    <th className="pb-4 pr-6 font-medium">Сумма</th>
                    <th className="pb-4 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {userOrders.map((order) => (
                    <tr key={order.id} className="border-b border-stone-900/6">
                      <td className="py-4 pr-6 font-semibold text-stone-900">{order.number}</td>
                      <td className="py-4 pr-6">{formatDate(order.date)}</td>
                      <td className="py-4 pr-6">{formatPrice(order.total)}</td>
                      <td className="py-4">{order.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {userOrders.length === 0 && (
                <p className="py-6 text-sm text-stone-500">Покупок пока нет.</p>
              )}
            </div>
          )}

          {activeTab === "Адреса доставки" && (
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="flex flex-col gap-4">
                <input
                  className="input-base"
                  placeholder="Добавить новый адрес"
                  value={newAddress}
                  onChange={(event) => setNewAddress(event.target.value)}
                />
                <div>
                  <Button
                    onClick={() => {
                      addAddress(newAddress);
                      setNewAddress("");
                    }}
                  >
                    Сохранить адрес
                  </Button>
                </div>
              </div>
              <div className="grid gap-4">
                {currentUser.addresses.map((address) => (
                  <div key={address} className="rounded-[22px] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-stone-700">
                    {address}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
}

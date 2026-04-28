import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import { useAppState } from "../lib/app-state";
import { clearRussianValidity, handleRussianInvalid } from "../lib/form-validation";

const blankForm = {
  name: "",
  phone: "",
  tariff: "Базовый"
};

export default function TariffsPage() {
  const { submitTariffRequest, tariffs } = useAppState();
  const [params] = useSearchParams();
  const planFromQuery = params.get("plan");
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);

  const tariffNames = useMemo(() => tariffs.map((tariff) => tariff.name), [tariffs]);

  useEffect(() => {
    if (planFromQuery && tariffNames.includes(planFromQuery)) {
      setForm((current) => ({ ...current, tariff: planFromQuery }));
    }
  }, [planFromQuery, tariffNames]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      const request = submitTariffRequest(form);
      setRequestId(request.id);
      setLoading(false);
      setForm(blankForm);
    }, 850);
  };

  return (
    <div className="container-shell py-12">
      <Reveal>
        <SectionHeading
          eyebrow="Тарифы"
          title="Доставка, гарантия и установка с разным уровнем сопровождения."
          description="Выбор тарифа сразу ведёт к заявке, которая сохраняется в админ-панели в разделе запросов."
        />
      </Reveal>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {tariffs.map((tariff) => (
          <Reveal key={tariff.id}>
            <div className="soft-card flex h-full flex-col rounded-[28px] p-7">
              <p className="text-sm text-stone-500">{tariff.priceLabel}</p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-900">{tariff.name}</h2>
              <p className="mt-4 text-sm leading-7 text-stone-600">{tariff.description}</p>
              <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-stone-700">
                {tariff.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 text-lime-700" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, tariff: tariff.name }))}
                className="mt-8 rounded-full bg-[var(--surface-muted)] px-4 py-3 text-sm font-medium text-stone-900 transition hover:bg-lime-100"
              >
                Выбрать {tariff.name}
              </button>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10">
        <section id="apply" className="soft-card rounded-[34px] p-8 md:p-10">
          <SectionHeading
            eyebrow="Заявка"
            title="Оставьте заявку на тариф"
            description="Эта демо-форма сохраняет заявку локально, поэтому она сразу появляется в админ-панели."
          />
          <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
            <input
              className="input-base"
              placeholder="Имя"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
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
            <select
              className="input-base md:col-span-2"
              value={form.tariff}
              onChange={(event) => setForm((current) => ({ ...current, tariff: event.target.value }))}
            >
              {tariffNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <div className="md:col-span-2">
              <Button type="submit" loading={loading} className="min-w-[220px]">
                Отправить заявку
              </Button>
            </div>
          </form>
        </section>
      </Reveal>

      <Modal open={Boolean(requestId)} onClose={() => setRequestId(null)} title="Заявка сохранена">
        <p className="text-base leading-7 text-stone-700">
          Ваша заявка успешно создана и уже ждёт обработки в админ-панели со статусом{" "}
          <strong>Не выполнено</strong>.
        </p>
      </Modal>
    </div>
  );
}

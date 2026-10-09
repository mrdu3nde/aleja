"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { AvailableDatePicker } from "@/components/booking/AvailableDatePicker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { bookingSchema, type BookingData } from "@/lib/validators";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  DollarSign,
  Smartphone,
  Hash,
  Copy,
  Check,
  Info,
  Phone,
  AtSign,
  Clock,
} from "lucide-react";
import { depositConfig } from "@/lib/deposit";
import { CONTACT } from "@/lib/contact";
import { humanDuration } from "@/lib/time";
import {
  CATEGORIES,
  balanceLabel,
  findItem,
  isBookable,
  itemsOf,
  priceLabel,
  type CatalogItem,
  type CategorySlug,
} from "@/lib/catalog";

type ErrorKind = "network" | "validation" | "server" | "generic" | "slot_taken" | "not_bookable";

type DepositInfo = {
  amount: number;
  zelleName: string;
  zellePhone: string;
};

const contactOptions = ["email", "phone", "whatsapp"] as const;

/** Número y título de cada paso, para que se lea como un camino. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="flex items-center gap-3 mb-3 text-base font-semibold text-cafe">
        <span className="flex-shrink-0 h-7 w-7 rounded-full bg-cafe text-white text-sm flex items-center justify-center">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Llamar o escribir por Instagram: para lo que todavía no se reserva en línea. */
function ContactButtons({ callLabel }: { callLabel: string }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <a
        href={CONTACT.phoneHref}
        className="inline-flex items-center gap-2 rounded-full bg-cafe text-white px-4 py-2 text-sm font-medium"
      >
        <Phone className="h-4 w-4" />
        {callLabel} {CONTACT.phone}
      </a>
      <a
        href={CONTACT.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-cafe text-cafe px-4 py-2 text-sm font-medium"
      >
        <AtSign className="h-4 w-4" />
        {CONTACT.instagramHandle}
      </a>
    </div>
  );
}

export function BookingForm({ initialService }: { initialService?: string }) {
  const t = useTranslations("book_page.form");
  const locale = useLocale();
  const lang = locale === "es" ? "es" : "en";
  // Desde la página de servicios se llega con ?service=<id> ya elegido.
  const preset = initialService ? findItem(initialService) : undefined;
  const [category, setCategory] = useState<CategorySlug | "">(preset?.category ?? "");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind>("generic");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [submittedContact, setSubmittedContact] = useState<{ via: string; phone: string }>({ via: "email", phone: "" });
  const [bookedItem, setBookedItem] = useState<CatalogItem | null>(null);
  const [referenceCode, setReferenceCode] = useState("");
  const [deposit, setDeposit] = useState<DepositInfo>({
    amount: depositConfig.amount,
    zelleName: depositConfig.zelleName,
    zellePhone: depositConfig.zellePhone,
  });
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BookingData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      contactPreference: "email",
      locale,
      service: preset?.id ?? "",
      preferredDate: "",
      preferredTime: "",
    },
  });

  // useWatch rather than watch(): it subscribes per field and is safe to pass
  // into a child, which watch() is not.
  const watchedService = useWatch({ control, name: "service" });
  const watchedDate = useWatch({ control, name: "preferredDate" });
  const watchedTime = useWatch({ control, name: "preferredTime" });

  const item = watchedService ? findItem(watchedService) : undefined;
  const bookable = item ? isBookable(item) : false;

  const pickCategory = (slug: CategorySlug) => {
    setCategory(slug);
    setValue("service", "");
    setValue("preferredDate", "");
    setValue("preferredTime", "");
  };

  const pickItem = (id: string) => {
    setValue("service", id, { shouldValidate: true });
    setValue("preferredTime", "");
  };

  const onSubmit = async (data: BookingData) => {
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.error === "slot_taken") {
          setErrorKind("slot_taken");
          setValue("preferredTime", "");
        } else if (json.error === "not_bookable") setErrorKind("not_bookable");
        else if (res.status === 400 || res.status === 422) setErrorKind("validation");
        else if (res.status >= 500) setErrorKind("server");
        else setErrorKind("generic");
        setStatus("error");
        return;
      }
      const json = await res.json();
      setSubmittedEmail(data.email);
      setSubmittedContact({ via: data.contactPreference, phone: data.phone ?? "" });
      setBookedItem(findItem(data.service) ?? null);
      setReferenceCode(json.referenceCode ?? "");
      if (json.deposit) setDeposit(json.deposit);
      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrorKind("network");
      setStatus("error");
    }
  };

  const handleCopy = async () => {
    const text = `Zelle: ${deposit.zelleName} - ${deposit.zellePhone}\n${t("deposit_amount_label")}: $${deposit.amount}.00 USD\n${t("deposit_reference_label")}: ${referenceCode}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard failed, do nothing
    }
  };

  /** Precio total, depósito y saldo: antes de pagar y en la confirmación. */
  const summary = (it: CatalogItem) => (
    <dl className="divide-y divide-mushroom/30 rounded-xl border border-mushroom/40 bg-white text-sm">
      <div className="flex justify-between gap-4 p-3">
        <dt className="text-text-light">{t("service_summary")}</dt>
        <dd className="text-right font-medium text-text-dark">{it.name[lang]}</dd>
      </div>
      <div className="flex justify-between gap-4 p-3">
        <dt className="text-text-light">{t("summary_total")}</dt>
        <dd className="font-medium text-text-dark">{priceLabel(it.price, lang)}</dd>
      </div>
      <div className="flex justify-between gap-4 p-3">
        <dt className="text-text-light">{t("summary_deposit")}</dt>
        <dd className="font-semibold text-cafe">−${deposit.amount}</dd>
      </div>
      <div className="flex justify-between gap-4 p-3">
        <dt className="text-text-light">{t("summary_balance")}</dt>
        <dd className="font-medium text-text-dark">{balanceLabel(it.price, deposit.amount, lang)}</dd>
      </div>
    </dl>
  );

  const policy = (
    <div className="flex items-start gap-3 bg-champagne-light/60 border border-cafe/20 rounded-xl p-4">
      <Info className="h-5 w-5 text-cafe shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-semibold text-cafe mb-1">{t("policy_title")}</p>
        <p className="text-text-dark leading-relaxed">{t("policy_text")}</p>
      </div>
    </div>
  );

  if (status === "success") {
    return (
      <div className="py-8 px-4 sm:px-8 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-champagne-light mb-5">
            <CheckCircle className="h-12 w-12 text-cafe" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-semibold text-cafe mb-3 font-[family-name:var(--font-heading)]">
            {t("success_title")}
          </h3>
          <p className="text-text-light">{t("success_message")}</p>
        </div>

        {bookedItem && <div className="mb-6">{summary(bookedItem)}</div>}

        {/* Deposit box — the main visual element */}
        <div className="bg-cafe text-white rounded-2xl p-6 sm:p-8 mb-6 shadow-lg">
          <h4 className="text-lg sm:text-xl font-semibold mb-5 text-center">
            {t("deposit_box_title")}
          </h4>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
              <DollarSign className="h-6 w-6 text-champagne shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-champagne uppercase tracking-wide">
                  {t("deposit_amount_label")}
                </p>
                <p className="text-2xl font-bold">${deposit.amount}.00 USD</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
              <Smartphone className="h-6 w-6 text-champagne shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-champagne uppercase tracking-wide">
                  {t("deposit_zelle_label")}
                </p>
                <p className="text-lg font-semibold">{deposit.zelleName}</p>
                <p className="text-base font-mono">{deposit.zellePhone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
              <Hash className="h-6 w-6 text-champagne shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-champagne uppercase tracking-wide">
                  {t("deposit_reference_label")}
                </p>
                <p className="text-xl font-bold font-mono tracking-wider">
                  {referenceCode}
                </p>
                <p className="text-xs text-champagne mt-1">
                  ⚠️ {t("deposit_reference_hint")}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-white text-cafe rounded-xl px-4 py-3 text-sm font-semibold hover:bg-champagne-light transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                {t("deposit_copied")}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {t("deposit_copy")}
              </>
            )}
          </button>
        </div>

        <div className="mb-6">{policy}</div>

        {/* Next steps */}
        <div className="text-left bg-champagne-light/50 border border-mushroom/30 rounded-2xl p-5 sm:p-6 mb-6">
          <h4 className="text-sm font-semibold text-cafe-dark uppercase tracking-wide mb-4">
            {t("success_next_steps_title")}
          </h4>
          <ol className="space-y-3">
            {[
              t("success_next_step_1", { amount: deposit.amount }),
              t("success_next_step_2"),
              t("success_next_step_3"),
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-cafe text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-text-dark">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {submittedEmail && (
          <div className="flex items-start gap-3 text-left text-sm text-text-light bg-white border border-mushroom/30 rounded-xl p-4">
            <Mail className="h-4 w-4 text-cafe shrink-0 mt-0.5" />
            <span>
              {submittedContact.via === "whatsapp" && submittedContact.phone
                ? t("success_contact_whatsapp")
                : submittedContact.via === "phone" && submittedContact.phone
                  ? t("success_contact_phone")
                  : t("success_check_email")}
              <br />
              <span className="text-cafe font-medium">
                {submittedContact.via !== "email" && submittedContact.phone ? submittedContact.phone : submittedEmail}
              </span>
            </span>
          </div>
        )}
      </div>
    );
  }

  const errorMessage = t(`error_${errorKind}`);

  const inputClass =
    "w-full rounded-xl border border-mushroom/40 bg-white px-4 py-3 text-text-dark placeholder:text-text-muted focus:border-cafe focus:ring-1 focus:ring-cafe outline-none transition-colors";

  const fieldError = (show: unknown, key: string) =>
    show ? <p className="mt-1 text-xs text-red-600">{t(key)}</p> : null;

  const groups = CATEGORIES.find((c) => c.slug === category)?.groups;
  const items = category ? itemsOf(category) : [];

  const itemButton = (it: CatalogItem) => {
    const selected = it.id === watchedService;
    const canBook = isBookable(it);
    return (
      <button
        key={it.id}
        type="button"
        onClick={() => pickItem(it.id)}
        aria-pressed={selected}
        className={`w-full text-left rounded-xl border px-4 py-3 transition-colors cursor-pointer ${
          selected ? "border-cafe bg-champagne-light/70 ring-1 ring-cafe" : "border-mushroom/40 bg-white hover:border-cafe/60"
        }`}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-medium text-text-dark">{it.name[lang]}</span>
          <span className="font-semibold text-cafe whitespace-nowrap">{priceLabel(it.price, lang)}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-text-light">
          {canBook ? (
            <>
              <Clock className="h-3.5 w-3.5" />
              {humanDuration(it.durationMinutes!)}
            </>
          ) : (
            <>
              <Phone className="h-3.5 w-3.5" />
              {t("call_to_book").replace(/:$/, "")}
            </>
          )}
        </span>
      </button>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* 1. Categoría */}
      <Step n={1} title={t("step_category")}>
        <div role="tablist" className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = c.slug === category;
            return (
              <button
                key={c.slug}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => pickCategory(c.slug)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  active ? "bg-cafe text-white" : "border border-cafe/40 text-cafe hover:bg-champagne-light"
                }`}
              >
                {c.title[lang]}
              </button>
            );
          })}
        </div>
        {!category && (
          <p className="mt-3 text-sm text-text-light">
            {t("not_sure")}{" "}
            <a href={CONTACT.phoneHref} className="text-cafe font-medium underline">
              {CONTACT.phone}
            </a>
          </p>
        )}
      </Step>

      {/* 2. Servicio */}
      {category && (
        <Step n={2} title={t("step_service")}>
          {groups ? (
            <div className="space-y-5">
              {groups.map((g) => (
                <div key={g.id}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep mb-2">
                    {g.title[lang]}
                  </p>
                  <div className="space-y-2">
                    {items.filter((it) => it.group === g.id).map(itemButton)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">{items.map(itemButton)}</div>
          )}
          {fieldError(errors.service, "field_required")}

          {item && !bookable && (
            <div className="mt-4 rounded-xl border border-cafe/20 bg-champagne-light/50 p-4 text-sm text-text-dark">
              {t("call_to_book")}
              <ContactButtons callLabel={t("call")} />
            </div>
          )}
        </Step>
      )}

      {item && bookable && (
        <>
          {/* 3. Fecha y hora. Salen del horario del estudio menos lo ya
              reservado, así que sólo se puede pedir una hora que existe. */}
          <Step n={3} title={t("step_when")}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1.5">{t("date")}</label>
                <AvailableDatePicker
                  service={item.id}
                  value={watchedDate ?? ""}
                  onChange={(d) => setValue("preferredDate", d, { shouldValidate: !!errors.preferredDate })}
                  lang={lang}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1.5">{t("time")}</label>
                <TimeSlotPicker
                  service={item.id}
                  date={watchedDate ?? ""}
                  value={watchedTime ?? ""}
                  onChange={(time) => setValue("preferredTime", time, { shouldValidate: !!errors.preferredTime })}
                  lang={lang}
                />
              </div>
              {fieldError(errors.preferredDate || errors.preferredTime, "pick_time")}
            </div>
          </Step>

          {/* 4. Datos */}
          <Step n={4} title={t("step_details")}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1.5">{t("name")}</label>
                <input {...register("name")} placeholder={t("name_placeholder")} className={inputClass} />
                {fieldError(errors.name, "field_required")}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">{t("email")}</label>
                  <input {...register("email")} type="email" placeholder={t("email_placeholder")} className={inputClass} />
                  {fieldError(errors.email, "invalid_email")}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">{t("phone")}</label>
                  <input {...register("phone")} type="tel" placeholder={t("phone_placeholder")} className={inputClass} />
                  {fieldError(errors.phone, "invalid_phone")}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-dark mb-1.5">{t("contact_preference")}</label>
                <div className="flex flex-wrap gap-4">
                  {contactOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input {...register("contactPreference")} type="radio" value={option} className="accent-cafe" />
                      <span className="text-sm text-text-dark">{t(`contact_options.${option}`)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-dark mb-1.5">{t("message")}</label>
                <textarea {...register("message")} rows={3} placeholder={t("message_placeholder")} className={inputClass} />
              </div>
            </div>
          </Step>

          {/* 5. Depósito: total, depósito y saldo, y la política antes de pagar. */}
          <Step n={5} title={t("step_deposit")}>
            <div className="space-y-4">
              {summary(item)}
              {policy}
              <p className="text-sm text-text-light">
                {t("deposit_notice_text", { amount: depositConfig.amount })}
              </p>

              {status === "error" && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("submitting")}
                  </span>
                ) : (
                  t("submit")
                )}
              </Button>
            </div>
          </Step>
        </>
      )}
    </form>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
} from "lucide-react";
import { depositConfig } from "@/lib/deposit";

type ErrorKind = "network" | "validation" | "server" | "generic";

type DepositInfo = {
  amount: number;
  zelleName: string;
  zellePhone: string;
};

const serviceKeys = [
  "hair",
  "nails",
  "brows",
  "lashes",
  "facial",
  "special",
  "not_sure",
] as const;

const contactOptions = ["email", "phone", "whatsapp"] as const;

export function BookingForm() {
  const t = useTranslations("book_page.form");
  const locale = useLocale();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind>("generic");
  const [submittedEmail, setSubmittedEmail] = useState("");
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
    formState: { errors, isSubmitting },
  } = useForm<BookingData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { contactPreference: "email", locale },
  });

  const onSubmit = async (data: BookingData) => {
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });
      if (!res.ok) {
        if (res.status === 400 || res.status === 422) setErrorKind("validation");
        else if (res.status >= 500) setErrorKind("server");
        else setErrorKind("generic");
        setStatus("error");
        return;
      }
      const json = await res.json();
      setSubmittedEmail(data.email);
      setReferenceCode(json.referenceCode ?? "");
      if (json.deposit) setDeposit(json.deposit);
      setStatus("success");
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
              {t("success_check_email")}
              <br />
              <span className="text-cafe font-medium">{submittedEmail}</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  const errorMessage = t(`error_${errorKind}`);

  const inputClass =
    "w-full rounded-xl border border-mushroom/40 bg-white px-4 py-3 text-text-dark placeholder:text-text-muted focus:border-cafe focus:ring-1 focus:ring-cafe outline-none transition-colors";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {status === "error" && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-dark mb-1.5">
          {t("name")}
        </label>
        <input
          {...register("name")}
          placeholder={t("name_placeholder")}
          className={inputClass}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1.5">
            {t("email")}
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder={t("email_placeholder")}
            className={inputClass}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1.5">
            {t("phone")}
          </label>
          <input
            {...register("phone")}
            type="tel"
            placeholder={t("phone_placeholder")}
            className={inputClass}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1.5">
            {t("service")}
          </label>
          <select {...register("service")} className={inputClass}>
            <option value="">{t("service_placeholder")}</option>
            {serviceKeys.map((key) => (
              <option key={key} value={key}>
                {t(`service_options.${key}`)}
              </option>
            ))}
          </select>
          {errors.service && (
            <p className="mt-1 text-xs text-red-600">
              {errors.service.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1.5">
            {t("date")}
          </label>
          <input
            {...register("preferredDate")}
            type="date"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-dark mb-1.5">
          {t("contact_preference")}
        </label>
        <div className="flex gap-4">
          {contactOptions.map((option) => (
            <label key={option} className="flex items-center gap-2 cursor-pointer">
              <input
                {...register("contactPreference")}
                type="radio"
                value={option}
                className="accent-cafe"
              />
              <span className="text-sm text-text-dark">
                {t(`contact_options.${option}`)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-dark mb-1.5">
          {t("message")}
        </label>
        <textarea
          {...register("message")}
          rows={4}
          placeholder={t("message_placeholder")}
          className={inputClass}
        />
      </div>

      {/* Deposit notice — shown before submit */}
      <div className="flex items-start gap-3 bg-champagne-light/60 border border-cafe/20 rounded-xl p-4">
        <Info className="h-5 w-5 text-cafe shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-cafe mb-1">
            {t("deposit_notice_title")}
          </p>
          <p className="text-text-dark leading-relaxed">
            {t("deposit_notice_text", { amount: depositConfig.amount })}
          </p>
        </div>
      </div>

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
    </form>
  );
}

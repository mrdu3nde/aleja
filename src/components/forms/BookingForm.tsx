"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { bookingSchema, type BookingData } from "@/lib/validators";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle } from "lucide-react";

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
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-cafe mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-cafe mb-2">
          {t("success_title")}
        </h3>
        <p className="text-text-light">{t("success_message")}</p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-mushroom/40 bg-white px-4 py-3 text-text-dark placeholder:text-text-muted focus:border-cafe focus:ring-1 focus:ring-cafe outline-none transition-colors";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {status === "error" && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {t("error_message")}
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

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

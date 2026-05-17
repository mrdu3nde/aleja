"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { leadSchema, type LeadData } from "@/lib/validators";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Loader2, Mail } from "lucide-react";

type ErrorKind = "network" | "validation" | "server" | "generic";

export function ContactForm() {
  const t = useTranslations("contact_page.form");
  const locale = useLocale();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind>("generic");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { source: "contact_form", locale },
  });

  const onSubmit = async (data: LeadData) => {
    try {
      const res = await fetch("/api/lead", {
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
      setSubmittedEmail(data.email);
      setStatus("success");
    } catch {
      setErrorKind("network");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="py-10 px-6 sm:px-10 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-champagne-light mb-5">
          <CheckCircle className="h-12 w-12 text-cafe" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-semibold text-cafe mb-3 font-[family-name:var(--font-heading)]">
          {t("success_title")}
        </h3>
        <p className="text-text-light mb-6">{t("success_message")}</p>

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
      </div>

      <div>
        <label className="block text-sm font-medium text-text-dark mb-1.5">
          {t("message")}
        </label>
        <textarea
          {...register("message")}
          rows={5}
          placeholder={t("message_placeholder")}
          className={inputClass}
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
        )}
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

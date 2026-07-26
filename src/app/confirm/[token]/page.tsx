"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { copyText } from "@/lib/clipboard";

type ConfirmData = {
  clientName: string;
  service: string;
  preferredDate: string | null;
  preferredTime: string | null;
  alreadyConfirmed: boolean;
  confirmed: boolean;
  missing: { phone: boolean; email: boolean };
  deposit: {
    amount: number;
    zelleName: string;
    zellePhone: string;
    referenceCode: string;
  } | null;
};

type Lang = "es" | "en";

const MONTHS: Record<Lang, string[]> = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
const DAYS: Record<Lang, string[]> = {
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

const T = {
  es: {
    invalidTitle: "Enlace no válido",
    invalidBody: "Este enlace ya no está disponible. Escríbenos y te enviamos uno nuevo.",
    loading: "Cargando...",
    greeting: (n: string) => `¡Listo, ${n}!`,
    intro: "Hemos creado tu cita. Solo completa un par de datos para continuar.",
    service: "Servicio",
    day: "Día",
    time: "Hora",
    depositRow: "Depósito",
    copy: "Copiar",
    copied: "¡Copiado!",
    phoneLabel: "Tu teléfono",
    phoneHint: "Para confirmarte por WhatsApp",
    emailLabel: "Tu correo",
    emailHint: "Te enviaremos la confirmación aquí",
    nothingMissing: "Ya tenemos todos tus datos. Solo falta que confirmes.",
    submit: "Confirmar mi cita",
    saving: "Guardando...",
    badPhone: "Escribe un teléfono válido para poder contactarte.",
    saveError: "No pudimos guardar tus datos. Inténtalo de nuevo.",
    thanks: (n: string) => `¡Gracias, ${n}!`,
    registeredConfirmed: "Tu cita quedó confirmada. ¡Te esperamos!",
    registeredPending: "Tu cita quedó registrada. Falta un último paso.",
    depositTitle: "Cómo enviar tu depósito",
    depositTitleAfter: "Último paso: el depósito",
    depositBody: (a: number) => `Para dejar tu cita apartada, envía $${a} USD por Zelle.`,
    sendTo: "Enviar a",
    zelle: "Zelle",
    reference: "Código de referencia",
    warning: "⚠️ Escribe el código de referencia en el concepto del Zelle.",
    afterNote: "En cuanto recibamos tu depósito te confirmamos y tu cita queda apartada.",
  },
  en: {
    invalidTitle: "Link not valid",
    invalidBody: "This link is no longer available. Message us and we'll send you a new one.",
    loading: "Loading...",
    greeting: (n: string) => `All set, ${n}!`,
    intro: "We've created your appointment. Just fill in a couple of details to continue.",
    service: "Service",
    day: "Day",
    time: "Time",
    depositRow: "Deposit",
    copy: "Copy",
    copied: "Copied!",
    phoneLabel: "Your phone",
    phoneHint: "So we can confirm over WhatsApp",
    emailLabel: "Your email",
    emailHint: "We'll send your confirmation here",
    nothingMissing: "We already have all your details. Just confirm below.",
    submit: "Confirm my appointment",
    saving: "Saving...",
    badPhone: "Please enter a valid phone number so we can reach you.",
    saveError: "We couldn't save your details. Please try again.",
    thanks: (n: string) => `Thank you, ${n}!`,
    registeredConfirmed: "Your appointment is confirmed. See you then!",
    registeredPending: "Your appointment is saved. One last step.",
    depositTitle: "How to send your deposit",
    depositTitleAfter: "Last step: the deposit",
    depositBody: (a: number) => `To hold your spot, send $${a} USD via Zelle.`,
    sendTo: "Send to",
    zelle: "Zelle",
    reference: "Reference code",
    warning: "⚠️ Write the reference code in the Zelle memo.",
    afterNote: "As soon as we receive your deposit we'll confirm and your spot is held.",
  },
} as const;

function formatDate(iso: string | null, lang: Lang) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const weekday = DAYS[lang][new Date(y, m - 1, d).getDay()];
  return lang === "es"
    ? `${weekday} ${d} de ${MONTHS.es[m - 1]}`
    : `${weekday}, ${MONTHS.en[m - 1]} ${d}`;
}

function formatTime(hhmm: string | null) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${period}`;
}

function ConfirmPageInner() {
  const { token } = useParams();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "en" ? "en" : "es";
  const t = T[lang];

  const [data, setData] = useState<ConfirmData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (value: string, field: string) => {
    if (await copyText(value)) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  useEffect(() => {
    fetch(`/api/confirm/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        const d: ConfirmData = await r.json();
        setData(d);
        setDone(d.alreadyConfirmed);
      })
      .catch(() => setNotFound(true));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    if (data.missing.phone && phone.replace(/\D/g, "").length < 7) {
      setError(t.badPhone);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/confirm/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email }),
      });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setDone(true);
    } catch {
      setError(t.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <Shell lang={lang}>
        <h1 className="text-xl font-bold text-[#3A2E26] mb-2">{t.invalidTitle}</h1>
        <p className="text-[#8A7B6E]">{t.invalidBody}</p>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell lang={lang}>
        <p className="text-[#8A7B6E]">{t.loading}</p>
      </Shell>
    );
  }

  const date = formatDate(data.preferredDate, lang);
  const time = formatTime(data.preferredTime);
  const first = data.clientName.split(" ")[0];

  const summary = (
    <div className="rounded-2xl bg-[#F5E6D3] p-5 mb-6">
      <Row label={t.service} value={data.service} />
      {date && <Row label={t.day} value={date} />}
      {time && <Row label={t.time} value={time} />}
      {data.deposit && (
        <Row label={t.depositRow} value={`$${data.deposit.amount} USD`} />
      )}
    </div>
  );

  // How to pay lives here rather than in the shared message, so there is one
  // place she reads it from — and it shows before confirming too, otherwise
  // she has no idea what she is agreeing to until it is already done.
  const depositBlock = (after: boolean) =>
    data.deposit && (
    <div className="rounded-2xl border-2 border-[#6B4E3D] p-5">
      <h2 className="font-bold text-[#6B4E3D] mb-1">{after ? t.depositTitleAfter : t.depositTitle}</h2>
      <p className="text-sm text-[#8A7B6E] leading-relaxed mb-4">
        {t.depositBody(data.deposit.amount)}
      </p>
      <div className="space-y-3">
        <Row label={t.sendTo} value={data.deposit.zelleName} />
        <CopyField
          label={t.zelle}
          value={data.deposit.zellePhone}
          copied={copiedField === "zelle"}
          copyLabel={t.copy}
          copiedLabel={t.copied}
          onCopy={() => handleCopy(data.deposit!.zellePhone, "zelle")}
        />
        <CopyField
          label={t.reference}
          value={data.deposit.referenceCode}
          mono
          copied={copiedField === "ref"}
          copyLabel={t.copy}
          copiedLabel={t.copied}
          onCopy={() => handleCopy(data.deposit!.referenceCode, "ref")}
        />
      </div>
      <p className="text-sm text-[#6B4E3D] mt-4 font-medium">{t.warning}</p>
      <p className="text-xs text-[#8A7B6E] mt-3 leading-relaxed">{t.afterNote}</p>
    </div>
  );

  return (
    <Shell lang={lang}>
      {!done ? (
        <>
          <h1 className="text-2xl font-bold text-[#3A2E26] mb-2">{t.greeting(first)}</h1>
          <p className="text-[#8A7B6E] leading-relaxed mb-6">{t.intro}</p>

          {summary}

          <form onSubmit={submit} className="space-y-4">
            {data.missing.phone && (
              <Field label={t.phoneLabel} hint={t.phoneHint}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(747) 240-1036"
                  className="w-full rounded-xl border border-[#e5ddd4] px-4 py-3 outline-none focus:border-[#6B4E3D]"
                />
              </Field>
            )}
            {data.missing.email && (
              <Field label={t.emailLabel} hint={t.emailHint}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lang === "es" ? "tucorreo@ejemplo.com" : "you@example.com"}
                  className="w-full rounded-xl border border-[#e5ddd4] px-4 py-3 outline-none focus:border-[#6B4E3D]"
                />
              </Field>
            )}

            {!data.missing.phone && !data.missing.email && (
              <p className="text-sm text-[#8A7B6E]">{t.nothingMissing}</p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Payment details come before the button on purpose: she reads how
                to pay, then confirms. */}
            {data.deposit && <div className="pt-2">{depositBlock(false)}</div>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[#6B4E3D] text-white px-6 py-4 font-semibold hover:bg-[#553D2F] transition-colors disabled:opacity-40"
            >
              {saving ? t.saving : t.submit}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-[#dcfce7] text-[#166534] text-3xl flex items-center justify-center mx-auto mb-3">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-[#3A2E26] mb-1">{t.thanks(first)}</h1>
            <p className="text-[#8A7B6E]">
              {data.deposit ? t.registeredPending : t.registeredConfirmed}
            </p>
          </div>

          {summary}

          {depositBlock(true)}
        </>
      )}
    </Shell>
  );
}

function Shell({ children, lang }: { children: React.ReactNode; lang: Lang }) {
  return (
    <div className="min-h-screen bg-[#FEFCFA] px-4 py-10" lang={lang}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <p className="text-2xl font-bold tracking-widest text-[#6B4E3D]">ALUH</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#8A7B6E]">Beauty Studio</p>
        </div>
        <div className="bg-white rounded-3xl border border-[#e5ddd4] p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-sm text-[#8A7B6E] shrink-0">{label}</span>
      <span className="text-sm font-medium text-[#3A2E26] text-right">{value}</span>
    </div>
  );
}

function CopyField({
  label,
  value,
  mono,
  copied,
  copyLabel,
  copiedLabel,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  onCopy: () => void;
}) {
  return (
    <div>
      <p className="text-xs text-[#8A7B6E] mb-1">{label}</p>
      <div className="flex gap-2">
        <p
          className={`flex-1 min-w-0 bg-white rounded-lg px-3 py-2.5 text-[#3A2E26] select-all break-all ${
            mono ? "font-mono font-bold text-lg tracking-wider text-center" : "font-medium"
          }`}
        >
          {value}
        </p>
        {/* Icon only — the label ate room the value needs on a phone. The
            accessible name still carries the meaning. */}
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? copiedLabel : copyLabel}
          title={copied ? copiedLabel : copyLabel}
          className="shrink-0 flex items-center justify-center rounded-lg text-white transition-colors"
          style={{ backgroundColor: copied ? "#166534" : "#6B4E3D", width: 46 }}
        >
          {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#3A2E26] mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#8A7B6E] mt-1">{hint}</p>}
    </div>
  );
}

/**
 * useSearchParams() opts a page out of static prerendering unless it sits under
 * a Suspense boundary — without this the production build fails outright.
 */
export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmPageInner />
    </Suspense>
  );
}

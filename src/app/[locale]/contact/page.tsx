"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ContactForm } from "@/components/forms/ContactForm";
import { Mail, Phone, Clock, AtSign } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactPage() {
  const t = useTranslations("contact_page");
  const ft = useTranslations("footer");

  return (
    <>
      <section className="bg-gradient-to-br from-champagne-light to-warm-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-cafe mb-4"
          >
            {t("title")}
          </motion.h1>
          <p className="text-text-light text-lg max-w-2xl">{t("subtitle")}</p>
        </div>
      </section>

      <Section bg="white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <ContactForm />
            </Card>
          </div>

          {/* Contact info */}
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-cafe mb-6">
              {t("info_title")}
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-cafe mt-0.5" />
                <div>
                  <p className="font-medium text-text-dark text-sm">
                    {t("email_label")}
                  </p>
                  <a
                    href="mailto:contact.aluh@gmail.com"
                    className="text-text-light text-sm hover:text-cafe transition-colors"
                  >
                    contact.aluh@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-cafe mt-0.5" />
                <div>
                  <p className="font-medium text-text-dark text-sm">
                    {t("phone_label")}
                  </p>
                  <a
                    href="tel:+15550000000"
                    className="text-text-light text-sm hover:text-cafe transition-colors"
                  >
                    +1 (555) 000-0000
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-cafe mt-0.5" />
                <div>
                  <p className="font-medium text-text-dark text-sm">
                    {t("hours_label")}
                  </p>
                  <div className="text-text-light text-sm space-y-0.5">
                    <p>{ft("hours.mon_fri")}</p>
                    <p>{ft("hours.saturday")}</p>
                    <p>{ft("hours.sunday")}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AtSign className="h-5 w-5 text-cafe mt-0.5" />
                <div>
                  <p className="font-medium text-text-dark text-sm">
                    {t("social_label")}
                  </p>
                  <a
                    href="#"
                    className="text-text-light text-sm hover:text-cafe transition-colors"
                  >
                    @aluh
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

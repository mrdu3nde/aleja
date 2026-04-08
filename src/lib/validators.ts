import { z } from "zod";

export const bookingSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  service: z.string().min(1),
  preferredDate: z.string().optional(),
  message: z.string().optional(),
  contactPreference: z.enum(["email", "phone", "whatsapp"]),
  locale: z.string().optional(),
});

export const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(1),
  source: z.string().optional(),
  locale: z.string().optional(),
});

export type BookingData = z.infer<typeof bookingSchema>;
export type LeadData = z.infer<typeof leadSchema>;

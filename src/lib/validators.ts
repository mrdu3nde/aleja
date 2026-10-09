import { z } from "zod";

export const bookingSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  service: z.string().min(1),
  // La web siempre reserva una hora concreta, para poder cuidar que no se cruce.
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/),
  message: z.string().optional(),
  contactPreference: z.enum(["email", "phone", "whatsapp"]),
  locale: z.string().optional(),
});

export type BookingData = z.infer<typeof bookingSchema>;

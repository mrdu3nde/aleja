import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  contactPreference: z
    .enum(["email", "phone", "whatsapp"])
    .optional(),
  notes: z.string().optional(),
});

export const clientUpdateSchema = clientSchema.partial();

export const appointmentSchema = z.object({
  clientId: z.string().uuid().optional(),
  clientName: z.string().min(2),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional(),
  service: z.string().min(1),
  preferredDate: z.string().optional(),
  message: z.string().optional(),
  status: z
    .enum(["pending", "confirmed", "cancelled", "completed"])
    .optional(),
});

export const appointmentUpdateSchema = appointmentSchema.partial();

export const leadUpdateSchema = z.object({
  status: z.enum(["new", "contacted", "converted", "archived"]).optional(),
});

export type ClientData = z.infer<typeof clientSchema>;
export type AppointmentData = z.infer<typeof appointmentSchema>;

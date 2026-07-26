import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2),
  // optional: the owner often only has a phone number
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  // The select offers an empty "Select..." option, so "" has to be accepted —
  // otherwise submitting without choosing fails validation on a field that
  // shows no error, and the form just appears to do nothing.
  contactPreference: z
    .enum(["email", "phone", "whatsapp"])
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});

export const clientUpdateSchema = clientSchema.partial();

export const appointmentSchema = z.object({
  clientId: z.string().uuid().nullable().optional(),
  clientName: z.string().min(2),
  // may be empty when the owner books someone she only has a phone for —
  // the share flow asks the client for it later
  clientEmail: z.string().email().or(z.literal("")),
  clientPhone: z.string().optional(),
  service: z.string().min(1),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  message: z.string().optional(),
  servicePrice: z.number().min(0).max(100000).optional(),
  depositRequired: z.boolean().optional(),
  depositAmount: z.number().min(0).max(10000).optional(),
  status: z
    .enum(["pending", "confirmed", "cancelled", "completed"])
    .optional(),
});

export const appointmentUpdateSchema = appointmentSchema.partial();

export type ClientData = z.infer<typeof clientSchema>;
export type AppointmentData = z.infer<typeof appointmentSchema>;

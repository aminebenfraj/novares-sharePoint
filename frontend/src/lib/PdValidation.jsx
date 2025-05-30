import { z } from "zod"

export const productSchema = z.object({
  id: z.string().min(1, "ID is required"),
  part_name: z.string().min(1, "Part name is required"),
  reference: z.string().nullable(),
})

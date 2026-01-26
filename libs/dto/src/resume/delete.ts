import { idSchema } from "@my-saas/schema";
import { createZodDto } from "nestjs-zod/dto";
import { z } from "zod";

export const deleteResumeSchema = z.object({
  id: idSchema,
});

export class DeleteResumeDto extends createZodDto(deleteResumeSchema) {}

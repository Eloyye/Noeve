import { z } from "zod";

export const identityZodType = z.union([z.string(), z.number()]);

export type Identity = z.infer<typeof identityZodType>;

import { createEnumObject } from "@/backend/utils/enum.utils";

export const typeScoreIndicatif = ['fait', 'programme'] as const;
export const typeScoreIndicatifEnum = createEnumObject(typeScoreIndicatif);

export type TypeScoreIndicatif = (typeof typeScoreIndicatif)[number];

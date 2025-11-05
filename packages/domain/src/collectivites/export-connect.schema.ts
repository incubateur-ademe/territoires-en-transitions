import * as z from 'zod/mini';

export const exportConnectSchema = z.object({
  userId: z.uuid(),
  exportId: z.string(),
  checksum: z.string(),
  modifiedAt: z.iso.datetime(),
});

export type ExportConnect = z.infer<typeof exportConnectSchema>;

export const exportConnectCreateSchema = z.pick(exportConnectSchema, {
  userId: true,
  exportId: true,
  checksum: true,
});

export type ExportConnectCreate = z.infer<typeof exportConnectCreateSchema>;

import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';

export const buildInMemoryDocumentStorage = (): DocumentStorageService => {
  const store = new Map<string, { buffer: Buffer; mimeType: string }>();
  const locationKey = (input: { bucketId: string; key: string }): string =>
    `${input.bucketId}/${input.key}`;

  return {
    storeDocument: async (input: {
      bucketId: string;
      key: string;
      content: Buffer;
      contentType: string;
    }) => {
      store.set(locationKey(input), {
        buffer: input.content,
        mimeType: input.contentType,
      });
      return { success: true, data: { key: input.key } };
    },
    downloadDocument: async (input: { bucketId: string; key: string }) => {
      const stored = store.get(locationKey(input));
      if (stored === undefined) {
        return { success: false, error: 'READ_DOCUMENT_ERROR' };
      }
      return { success: true, data: stored };
    },
    removeDocument: async (input: { bucketId: string; key: string }) => {
      store.delete(locationKey(input));
      return { success: true, data: undefined };
    },
  } as unknown as DocumentStorageService;
};

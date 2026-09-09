import { ENV } from '@tet/api/environmentVariables';
import { DetailedError, Upload } from 'tus-js-client';

const RESUMABLE_SIGNED_ENDPOINT = `${ENV.supabase_url}/storage/v1/upload/resumable/sign`;
const SUPABASE_IMPOSED_CHUNK_SIZE_BYTES = 6 * 1024 * 1024;
const RETRY_DELAYS_MS = [0, 3000, 5000, 10000, 20000];
const OBJECT_ALREADY_EXISTS_STATUS = 409;

type UploadToStorageArgs = {
  token: string;
  bucketId: string;
  path: string;
  file: File;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
};

const toAbortError = (): DOMException =>
  new DOMException('Upload aborted', 'AbortError');

const isObjectAlreadyStored = (error: Error | DetailedError): boolean =>
  'originalResponse' in error &&
  error.originalResponse?.getStatus() === OBJECT_ALREADY_EXISTS_STATUS;

export const uploadToStorage = ({
  token,
  bucketId,
  path,
  file,
  signal,
  onProgress,
}: UploadToStorageArgs): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(toAbortError());
      return;
    }

    const uploadSettled = new AbortController();

    const upload = new Upload(file, {
      endpoint: RESUMABLE_SIGNED_ENDPOINT,
      headers: { 'x-signature': token },
      metadata: {
        bucketName: bucketId,
        objectName: path,
        contentType: file.type || 'application/octet-stream',
      },
      chunkSize: SUPABASE_IMPOSED_CHUNK_SIZE_BYTES,
      retryDelays: RETRY_DELAYS_MS,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      onShouldRetry: (error) => !isObjectAlreadyStored(error),
      onProgress: (bytesSent, bytesTotal) => {
        if (bytesTotal) {
          onProgress?.((bytesSent / bytesTotal) * 100);
        }
      },
      onSuccess: () => {
        uploadSettled.abort();
        resolve();
      },
      onError: (error) => {
        uploadSettled.abort();
        reject(error);
      },
    });

    signal?.addEventListener(
      'abort',
      () => {
        void upload
          .abort(true)
          .catch(() => undefined)
          .then(() => reject(toAbortError()));
      },
      { signal: uploadSettled.signal, once: true }
    );

    upload.start();
  });

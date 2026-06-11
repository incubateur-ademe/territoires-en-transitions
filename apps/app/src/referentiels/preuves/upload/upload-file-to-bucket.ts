import { shasum256 } from '@/app/utils/shasum256';
import { ENV } from '@tet/api/environmentVariables';

type UploadFileToBucketArgs = {
  bucketId: string;
  file: File;
  authHeaders: { authorization: string; apikey: string };
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
  // si fourni, évite un second calcul de hash (l'appelant peut l'avoir déjà
  // calculé pour vérifier la déduplication en amont).
  precomputedHash?: string;
};

type UploadFileToBucketResult = {
  hash: string;
  filename: string;
};

// XHR plutôt que fetch : nécessaire pour `xhr.upload.onprogress`.
// Ref: https://github.com/supabase/storage-api/issues/23#issuecomment-973277262
const abortedError = (): DOMException =>
  new DOMException('Upload aborted', 'AbortError');

export const uploadFileToBucket = async ({
  bucketId,
  file,
  authHeaders,
  signal,
  onProgress,
  precomputedHash,
}: UploadFileToBucketArgs): Promise<UploadFileToBucketResult> => {
  // `addEventListener('abort')` plus bas ne re-déclenche pas si le signal a
  // déjà été aborté avant son attachement ; on vérifie donc explicitement
  // autour de l'étape de hash, qui est asynchrone et peut prendre 100 ms+.
  if (signal?.aborted) throw abortedError();
  // le hash sert de nom unique dans le bucket ; le nom original est conservé
  // dans `bibliotheque_fichier` lors de l'étape suivante du pipeline.
  const hash = precomputedHash ?? (await shasum256(file));
  if (signal?.aborted) throw abortedError();

  return new Promise<UploadFileToBucketResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${ENV.supabase_url}/storage/v1/object/${bucketId}/${hash}`;

    xhr.upload.onprogress = (e: ProgressEvent<EventTarget>) => {
      if (onProgress && e.lengthComputable && e.total > 0) {
        onProgress((e.loaded / e.total) * 100);
      }
    };

    xhr.onreadystatechange = function () {
      if (this.readyState !== XMLHttpRequest.DONE) return;
      if (this.status === 200) {
        resolve({ hash, filename: file.name });
      } else {
        reject(new Error(`Upload failed with status ${this.status}`));
      }
    };

    xhr.upload.onabort = () => reject(abortedError());
    const handleError = (): void => reject(new Error('Upload error'));
    xhr.upload.onerror = handleError;
    xhr.upload.ontimeout = handleError;

    signal?.addEventListener('abort', () => xhr.abort(), { once: true });

    xhr.open('POST', url);
    Object.entries(authHeaders).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    xhr.send(file);
  });
};

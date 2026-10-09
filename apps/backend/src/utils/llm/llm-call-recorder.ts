import { AsyncLocalStorage } from 'node:async_hooks';
import { LlmCallEvent } from './llm-observer';

type LlmCallRecorder = { calls: LlmCallEvent[] };

const storage = new AsyncLocalStorage<LlmCallRecorder>();

/**
 * Les appels au modèle faits pendant `run`, tentatives en échec comprises :
 * de quoi attribuer jetons et durées à une étape sans que l'étape les remonte.
 * Les enregistrements imbriqués ne voient que leurs propres appels.
 */
export const recordLlmCalls = async <T>(
  run: () => Promise<T>
): Promise<{ result: T; calls: LlmCallEvent[] }> => {
  const recorder: LlmCallRecorder = { calls: [] };
  const result = await storage.run(recorder, run);
  return { result, calls: recorder.calls };
};

/**
 * À lire dans le contexte de l'appelant, avant toute file d'attente : un
 * appel mis en attente peut reprendre dans le contexte d'un autre.
 */
export const currentLlmCallRecorder = (): LlmCallRecorder | undefined =>
  storage.getStore();

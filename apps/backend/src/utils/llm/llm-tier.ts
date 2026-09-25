/**
 * Palier de modèle demandé par un appel : `strong` pour extraire et
 * structurer, `light` pour trier, `ocr` pour transcrire une image de page.
 */
export type LlmTier = 'strong' | 'light' | 'ocr';

export const LLM_TIERS: readonly LlmTier[] = ['strong', 'light', 'ocr'];

export type LlmStrategy = 'whole-document' | 'segmented';

/** Ce que le fournisseur sait faire : c'est lui qui oriente le pipeline. */
export type LlmCapabilities = {
  ocr: boolean;
  strategy: LlmStrategy;
};

export type LlmImage = {
  mimeType: 'image/png' | 'image/jpeg';
  base64: string;
};

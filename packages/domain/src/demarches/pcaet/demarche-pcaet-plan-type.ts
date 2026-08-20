/**
 * Clé fonctionnelle du type de plan PCAET dans le référentiel
 * `plan_action_type` — unique (categorie, type) en base. L'id n'étant pas
 * stable d'un environnement à l'autre, front et back résolvent le type par
 * cette clé, jamais par un id en dur.
 */
export const PCAET_PLAN_TYPE_KEY = {
  categorie: 'Plans transverses',
  type: 'Plan Climat Air Énergie Territorial',
} as const;

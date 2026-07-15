/**
 * Correspondances figées depuis import-referentiel/samples/referentiel-te-structure.csv
 * + action_origine. À mettre à jour si le CSV TE change.
 */
export const SWITCH_TE_CORRESPONDANCES_FIXTURE = {
  teMesureCae1to1: {
    teMesureId: 'te_1.1.1',
    caeMesureSourceId: 'cae_1.1.2',
    caeOrigineActionId: 'cae_1.1.2.2.1',
  },
  teMesureCaeAndEci: {
    teMesureId: 'te_6.1.4',
    caeMesureSourceId: 'cae_6.1.3',
    caeOrigineTacheId: 'cae_6.1.3.4.3',
    eciMesureSourceId: 'eci_3.3',
    eciOrigineTacheId: 'eci_3.3.1.3',
  },
  /** sous-action native — absente de cibles.mesures */
  teMesureNative: 'te_1.1.1.3',
  /** régression builder PR12/13 */
  teSousActionRegression: 'te_1.1.1.2',
  /** liens fiches — correspondance directe sous-mesure → sous-action TE */
  teSousActionDirect: {
    teSousActionId: 'te_2.2.2.1',
    caeSousMesureSourceId: 'cae_2.2.2.1',
  },
  /** liens fiches — sous-mesure sans direct → fallback mesure TE */
  teMesureFallback: {
    teMesureId: 'te_6.1.4',
    caeSousMesureSourceId: 'cae_6.1.3.4',
    caeMesureSourceId: 'cae_6.1.3',
  },
} as const;

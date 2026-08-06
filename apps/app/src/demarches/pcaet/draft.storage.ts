'use client';

import {
  defaultTopicsCompletion,
  defaultVulnerabiliteState,
  DEMARCHE_PCAET_VULNERABILITE_NIVEAUX,
} from './constants';
import type {
  DemarchePcaetDraftState,
  DemarchePcaetVulnerabiliteLigne,
  DemarchePcaetVulnerabiliteNiveau,
  DemarchePcaetVulnerabiliteState,
} from '../types';

/**
 * Brouillon sessionStorage des parties de la démarche non persistées côté API
 * (topics, vulnérabilité, états de grille).
 */
const STORAGE_KEY_PREFIX = 'tet-demarche-pcaet-draft';

const storageKey = (collectiviteId: number, demarcheId: number) =>
  `${STORAGE_KEY_PREFIX}:${collectiviteId}:${demarcheId}`;

const isVulnerabiliteNiveau = (
  value: unknown
): value is DemarchePcaetVulnerabiliteNiveau =>
  typeof value === 'string' &&
  (DEMARCHE_PCAET_VULNERABILITE_NIVEAUX as ReadonlyArray<string>).includes(
    value
  );

const normalizeLigne = (
  l: DemarchePcaetVulnerabiliteLigne
): DemarchePcaetVulnerabiliteLigne => ({
  domaineId: l.domaineId,
  ...(l.label !== undefined ? { label: l.label } : {}),
  diagMaintenant: isVulnerabiliteNiveau(l.diagMaintenant)
    ? l.diagMaintenant
    : 'non_renseigne',
  diag2050: isVulnerabiliteNiveau(l.diag2050) ? l.diag2050 : 'non_renseigne',
  diag2100: isVulnerabiliteNiveau(l.diag2100) ? l.diag2100 : 'non_renseigne',
  description2050:
    typeof l.description2050 === 'string' ? l.description2050 : '',
  description2100:
    typeof l.description2100 === 'string' ? l.description2100 : '',
});

const normalizeVulnerabilite = (
  raw: DemarchePcaetVulnerabiliteState | undefined
): DemarchePcaetVulnerabiliteState => {
  if (!raw || !Array.isArray(raw.lignes)) {
    return defaultVulnerabiliteState();
  }

  const validLignes = raw.lignes.filter(
    (l): l is DemarchePcaetVulnerabiliteLigne =>
      typeof l === 'object' && l !== null && 'domaineId' in l
  );

  return { lignes: validLignes.map(normalizeLigne) };
};

export const defaultDemarchePcaetDraftState = (): DemarchePcaetDraftState => ({
  topics: defaultTopicsCompletion(),
  vulnerabilite: defaultVulnerabiliteState(),
  vulnerabiliteValideeLe: null,
  gridStates: {},
});

const normalizeDraft = (
  raw: Partial<DemarchePcaetDraftState> | undefined
): DemarchePcaetDraftState => ({
  topics: raw?.topics ?? defaultTopicsCompletion(),
  vulnerabilite: normalizeVulnerabilite(raw?.vulnerabilite),
  vulnerabiliteValideeLe:
    typeof raw?.vulnerabiliteValideeLe === 'string'
      ? raw.vulnerabiliteValideeLe
      : null,
  gridStates: raw?.gridStates ?? {},
});

export const getDemarchePcaetDraft = (
  collectiviteId: number,
  demarcheId: number
): DemarchePcaetDraftState => {
  if (typeof window === 'undefined') {
    return defaultDemarchePcaetDraftState();
  }
  try {
    const raw = window.sessionStorage.getItem(
      storageKey(collectiviteId, demarcheId)
    );
    if (!raw) {
      return defaultDemarchePcaetDraftState();
    }
    return normalizeDraft(JSON.parse(raw) as Partial<DemarchePcaetDraftState>);
  } catch {
    return defaultDemarchePcaetDraftState();
  }
};

export const updateDemarchePcaetDraft = (
  collectiviteId: number,
  demarcheId: number,
  patch:
    | Partial<DemarchePcaetDraftState>
    | ((current: DemarchePcaetDraftState) => Partial<DemarchePcaetDraftState>)
): DemarchePcaetDraftState => {
  const current = getDemarchePcaetDraft(collectiviteId, demarcheId);
  const resolvedPatch = typeof patch === 'function' ? patch(current) : patch;
  const updated = normalizeDraft({ ...current, ...resolvedPatch });
  window.sessionStorage.setItem(
    storageKey(collectiviteId, demarcheId),
    JSON.stringify(updated)
  );
  return updated;
};

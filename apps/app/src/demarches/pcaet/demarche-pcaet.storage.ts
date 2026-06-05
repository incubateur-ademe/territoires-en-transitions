'use client';

import type { PersonneTagOrUser } from '@tet/domain/collectivites';
import {
  DEMARCHE_PCAET_VULNERABILITE_DOMAINES,
  DEMARCHE_PCAET_VULNERABILITE_NIVEAUX,
  defaultVoletsCompletion,
  defaultVulnerabiliteLigne,
  defaultVulnerabiliteState,
  DEMARCHE_PCAET_STATUT_LABELS,
} from './demarche-pcaet.constants';
import type {
  DemarchePcaet,
  DemarchePcaetStatut,
  DemarchePcaetStatutPublication,
  DemarchePcaetVulnerabiliteDomaineId,
  DemarchePcaetVulnerabiliteLigne,
  DemarchePcaetVulnerabiliteNiveau,
  DemarchePcaetVulnerabiliteState,
} from './demarche-pcaet.types';
import {
  defaultPcaetDocumentsState,
  PCAET_DOCUMENT_SECTIONS,
  type PcaetDocumentSectionState,
  type PcaetDocumentsState,
  type PcaetDocumentValidationStatus,
} from './pcaet-documents.constants';

const STORAGE_KEY_PREFIX = 'tet-demarche-pcaet';

const storageKey = (collectiviteId: number) =>
  `${STORAGE_KEY_PREFIX}:${collectiviteId}`;

const isPersonneTagOrUser = (value: unknown): value is PersonneTagOrUser =>
  typeof value === 'object' &&
  value !== null &&
  'nom' in value &&
  typeof (value as PersonneTagOrUser).nom === 'string';

const isPcaetFile = (value: unknown): value is { id: string; name: string } =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { id?: unknown }).id === 'string' &&
  typeof (value as { name?: unknown }).name === 'string';

const normalizeDocuments = (
  raw: DemarchePcaet['documents'] | undefined
): PcaetDocumentsState => {
  if (!raw) {
    return defaultPcaetDocumentsState();
  }

  const sectionById = new Map(
    Array.isArray(raw.sections)
      ? raw.sections.map((section) => [section.sectionId, section])
      : []
  );

  const sections: PcaetDocumentSectionState[] = PCAET_DOCUMENT_SECTIONS.map(
    (section) => {
      const current = sectionById.get(section.id);
      const statut: PcaetDocumentValidationStatus =
        current?.statut === 'valide' ? 'valide' : 'pas_valide';
      return {
        sectionId: section.id,
        statut,
        couvertSansFichier: Boolean(current?.couvertSansFichier),
        file: isPcaetFile(current?.file) ? current.file : null,
      };
    }
  );

  return { sections };
};

const isVulnerabiliteNiveau = (
  value: unknown
): value is DemarchePcaetVulnerabiliteNiveau =>
  typeof value === 'string' &&
  (DEMARCHE_PCAET_VULNERABILITE_NIVEAUX as ReadonlyArray<string>).includes(
    value
  );

const normalizeVulnerabilite = (
  raw: DemarchePcaet['vulnerabilite'] | undefined
): DemarchePcaetVulnerabiliteState => {
  if (!raw || !Array.isArray(raw.lignes)) {
    return defaultVulnerabiliteState();
  }

  const ligneById = new Map<
    DemarchePcaetVulnerabiliteDomaineId,
    DemarchePcaetVulnerabiliteLigne
  >(
    raw.lignes
      .filter(
        (l): l is DemarchePcaetVulnerabiliteLigne =>
          typeof l === 'object' && l !== null && 'domaineId' in l
      )
      .map((l) => [l.domaineId, l])
  );

  return {
    lignes: DEMARCHE_PCAET_VULNERABILITE_DOMAINES.map((domaine) => {
      const current = ligneById.get(domaine.id);
      if (!current) {
        return defaultVulnerabiliteLigne(domaine.id);
      }
      return {
        domaineId: domaine.id,
        diagMaintenant: isVulnerabiliteNiveau(current.diagMaintenant)
          ? current.diagMaintenant
          : 'faible',
        diag2050: isVulnerabiliteNiveau(current.diag2050)
          ? current.diag2050
          : 'faible',
        diag2100: isVulnerabiliteNiveau(current.diag2100)
          ? current.diag2100
          : 'faible',
        description2050:
          typeof current.description2050 === 'string'
            ? current.description2050
            : '',
        description2100:
          typeof current.description2100 === 'string'
            ? current.description2100
            : '',
      };
    }),
  };
};

const normalizeDemarche = (raw: DemarchePcaet): DemarchePcaet => {
  const pilotesRaw = raw.pilotes as unknown;
  const pilotes = Array.isArray(pilotesRaw)
    ? pilotesRaw.filter(isPersonneTagOrUser)
    : [];

  const statutPublication: DemarchePcaetStatutPublication =
    raw.statutPublication ?? (raw.statut === 'publie' ? 'publie' : 'brouillon');

  return {
    ...raw,
    statutPublication,
    pilotes,
    dateLancement: raw.dateLancement ?? null,
    dateModification: raw.dateModification ?? raw.dateCreation,
    datePublication: raw.datePublication ?? null,
    volets: raw.volets ?? defaultVoletsCompletion(),
    documents: normalizeDocuments(raw.documents),
    vulnerabilite: normalizeVulnerabilite(raw.vulnerabilite),
    vulnerabiliteValideeLe:
      typeof raw.vulnerabiliteValideeLe === 'string'
        ? raw.vulnerabiliteValideeLe
        : null,
  };
};

const readAll = (collectiviteId: number): DemarchePcaet[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.sessionStorage.getItem(storageKey(collectiviteId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as DemarchePcaet[];
    return parsed.map(normalizeDemarche);
  } catch {
    return [];
  }
};

const writeAll = (collectiviteId: number, demarches: DemarchePcaet[]) => {
  window.sessionStorage.setItem(
    storageKey(collectiviteId),
    JSON.stringify(demarches)
  );
};

export const listDemarchesPcaet = (collectiviteId: number): DemarchePcaet[] =>
  readAll(collectiviteId).sort(
    (a, b) =>
      new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
  );

export const getDemarchePcaet = (
  collectiviteId: number,
  demarcheId: string
): DemarchePcaet | undefined =>
  readAll(collectiviteId).find((d) => d.id === demarcheId);

export const createDemarchePcaet = (input: {
  collectiviteId: number;
  titre?: string;
  description?: string;
  obligation?: DemarchePcaet['obligation'];
  pilotes?: PersonneTagOrUser[];
}): DemarchePcaet => {
  const demarche: DemarchePcaet = {
    id: crypto.randomUUID(),
    collectiviteId: input.collectiviteId,
    titre: input.titre?.trim() || 'PCAET réglementaire',
    description: input.description?.trim() ?? '',
    statutPublication: 'brouillon',
    statut: 'en_elaboration',
    obligation: input.obligation ?? 'obligatoire',
    dateCreation: new Date().toISOString(),
    dateModification: null,
    dateLancement: null,
    datePublication: null,
    pilotes: input.pilotes ?? [],
    planActionId: null,
    volets: defaultVoletsCompletion(),
    vulnerabilite: defaultVulnerabiliteState(),
    vulnerabiliteValideeLe: null,
    documents: defaultPcaetDocumentsState(),
  };

  const demarches = readAll(input.collectiviteId);
  writeAll(input.collectiviteId, [demarche, ...demarches]);
  return demarche;
};

export type DemarchePcaetUpdatePatch = Partial<
  Pick<
    DemarchePcaet,
    | 'titre'
    | 'description'
    | 'statut'
    | 'statutPublication'
    | 'datePublication'
    | 'dateLancement'
    | 'planActionId'
    | 'volets'
    | 'pilotes'
    | 'vulnerabilite'
    | 'vulnerabiliteValideeLe'
    | 'documents'
  >
>;

export const updateDemarchePcaet = (
  collectiviteId: number,
  demarcheId: string,
  patch: DemarchePcaetUpdatePatch
): DemarchePcaet | undefined => {
  const demarches = readAll(collectiviteId);
  const index = demarches.findIndex((d) => d.id === demarcheId);
  if (index === -1) {
    return undefined;
  }
  const updated = normalizeDemarche({
    ...demarches[index],
    ...patch,
    dateModification: new Date().toISOString(),
  });
  demarches[index] = updated;
  writeAll(collectiviteId, demarches);
  return updated;
};

export const setDemarchePcaetStatutPublication = (
  collectiviteId: number,
  demarcheId: string,
  statutPublication: DemarchePcaetStatutPublication
): DemarchePcaet | undefined => {
  const isPublished = statutPublication === 'publie';
  return updateDemarchePcaet(collectiviteId, demarcheId, {
    statutPublication,
    statut: isPublished ? 'publie' : 'en_elaboration',
    datePublication: isPublished ? new Date().toISOString() : null,
  });
};

export const formatDemarcheStatut = (statut: DemarchePcaetStatut) =>
  DEMARCHE_PCAET_STATUT_LABELS[statut];

import type { BadgeProps, IconValue } from '@tet/ui';

/**
 * Données mockées pour le proto « Vue DREAL » (service déconcentré instructeur).
 * La DREAL est rattachée à une région et suit automatiquement les EPCI de cette
 * région en lecture seule, avec le droit de déposer un avis réglementaire.
 */

export const DREAL_REGION = 'Bourgogne-Franche-Comté';

/** Statuts de dépôt d'un PCAET (alignés sur le parcours réglementaire). */
export type DrealDepotStatut =
  | 'elaboration'
  | 'transmis'
  | 'adopte'
  | 'archive';

/** Libellé affiché pour chaque statut (cohérent entre les 2 écrans). */
export const DREAL_STATUT_LABEL: Record<DrealDepotStatut, string> = {
  elaboration: 'Élaboration',
  transmis: 'Transmis pour avis',
  adopte: 'Adopté',
  archive: 'Archivé',
};

/**
 * Mapping statut → variant de Badge DS. UNIQUE source de vérité, partagée par
 * le tableau (écran 1) et le header du dossier (écran 2).
 * - Élaboration → gris clair (default)
 * - Transmis pour avis → bleu (info)
 * - Adopté → vert (success)
 * - Archivé → gris foncé/neutre (grey)
 */
export const DREAL_STATUT_BADGE_VARIANT: Record<
  DrealDepotStatut,
  NonNullable<BadgeProps['variant']>
> = {
  elaboration: 'default',
  transmis: 'info',
  adopte: 'success',
  archive: 'grey',
};

/** Un avis ne peut être déposé que si le dépôt est « Transmis pour avis ». */
export const canDeposerAvis = (statut: DrealDepotStatut): boolean =>
  statut === 'transmis';

export type DrealCollectivite = {
  id: string;
  nom: string;
  /** Population formatée, ex. « 195 000 hab. ». */
  population: string;
  contactNom: string;
  contactEmail: string;
  statut: DrealDepotStatut;
  /** Date d'échéance de l'avis (uniquement si statut = transmis), sinon null. */
  echeanceAvis: string | null;
};

export const drealCollectivites: DrealCollectivite[] = [
  {
    id: 'grand-besancon',
    nom: 'CA Grand Besançon Métropole',
    population: '195 000 hab.',
    contactNom: 'Camille Berthier',
    contactEmail: 'c.berthier@grandbesancon.fr',
    statut: 'transmis',
    echeanceAvis: '15/09/2026',
  },
  {
    id: 'pays-montbeliard',
    nom: 'CA Pays de Montbéliard Agglomération',
    population: '142 000 hab.',
    contactNom: 'Julien Marchand',
    contactEmail: 'j.marchand@agglo-montbeliard.fr',
    statut: 'transmis',
    echeanceAvis: '28/08/2026',
  },
  {
    id: 'dijon-metropole',
    nom: 'CA Dijon Métropole',
    population: '257 000 hab.',
    contactNom: 'Sophie Lemoine',
    contactEmail: 's.lemoine@metropole-dijon.fr',
    statut: 'transmis',
    echeanceAvis: '02/10/2026',
  },
  {
    id: 'grand-dole',
    nom: 'CA du Grand Dole',
    population: '54 000 hab.',
    contactNom: 'Antoine Roussel',
    contactEmail: 'a.roussel@grand-dole.fr',
    statut: 'transmis',
    echeanceAvis: '19/09/2026',
  },
  {
    id: 'val-morteau',
    nom: 'CC du Val de Morteau',
    population: '22 000 hab.',
    contactNom: 'Marie Faivre',
    contactEmail: 'm.faivre@cc-valdemorteau.fr',
    statut: 'adopte',
    echeanceAvis: null,
  },
  {
    id: 'creusot-montceau',
    nom: 'CU Le Creusot Montceau-les-Mines',
    population: '96 000 hab.',
    contactNom: 'Pierre Gauthier',
    contactEmail: 'p.gauthier@creusot-montceau.org',
    statut: 'adopte',
    echeanceAvis: null,
  },
  {
    id: 'beaune-cote-sud',
    nom: 'CA Beaune Côte et Sud',
    population: '53 000 hab.',
    contactNom: 'Élodie Renaud',
    contactEmail: 'e.renaud@beaunecoteetsud.com',
    statut: 'elaboration',
    echeanceAvis: null,
  },
  {
    id: 'grand-vesoul',
    nom: 'CA de Vesoul',
    population: '33 000 hab.',
    contactNom: 'Thomas Vernet',
    contactEmail: 't.vernet@agglo-vesoul.fr',
    statut: 'elaboration',
    echeanceAvis: null,
  },
  {
    id: 'bresse-haute-seille',
    nom: 'CC Bresse Haute Seille',
    population: '24 000 hab.',
    contactNom: 'Nathalie Perrin',
    contactEmail: 'n.perrin@bresse-hauteseille.fr',
    statut: 'archive',
    echeanceAvis: null,
  },
];

export const getDrealCollectivite = (
  id: string
): DrealCollectivite | undefined =>
  drealCollectivites.find((c) => c.id === id);

/** Type visuel d'une notification → icône + couleur du featured-icon. */
export type DrealNotificationTone = 'transmis' | 'adopte' | 'document' | 'archive';

export type DrealNotification = {
  id: string;
  tone: DrealNotificationTone;
  message: string;
  /** Timestamp relatif déjà formaté (proto). */
  timestamp: string;
};

export const DREAL_NOTIFICATION_ICON: Record<DrealNotificationTone, IconValue> = {
  transmis: 'send-plane-line',
  adopte: 'checkbox-circle-line',
  document: 'file-text-line',
  archive: 'archive-line',
};

export const drealNotifications: DrealNotification[] = [
  {
    id: 'n1',
    tone: 'transmis',
    message: 'CA Pays de Montbéliard a transmis son PCAET pour avis.',
    timestamp: 'il y a 2 h',
  },
  {
    id: 'n2',
    tone: 'adopte',
    message: 'CC du Val de Morteau a adopté son PCAET.',
    timestamp: 'hier',
  },
  {
    id: 'n3',
    tone: 'document',
    message:
      'CA Grand Besançon a déposé un nouveau document (stratégie territoriale).',
    timestamp: 'il y a 3 j',
  },
  {
    id: 'n4',
    tone: 'transmis',
    message: 'CA du Grand Dole a transmis son PCAET pour avis.',
    timestamp: 'il y a 4 j',
  },
  {
    id: 'n5',
    tone: 'archive',
    message: 'CC Bresse Haute Seille a archivé sa démarche PCAET.',
    timestamp: 'il y a 1 sem.',
  },
];

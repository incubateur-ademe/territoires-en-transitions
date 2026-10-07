import { appLabels } from '@/app/labels/catalog';
import {
  peutRecevoirSousThematique,
  type DemarchePcaetVulnerabilite,
  type DemarchePcaetVulnerabiliteThematique,
  type DemarchePcaetVulnerabiliteHorizon,
  type DemarchePcaetVulnerabiliteLigne,
} from '@tet/domain/demarches';
import { groupBy } from 'es-toolkit';

export type NiveauColumn = {
  horizon: DemarchePcaetVulnerabiliteHorizon;
  key: 'niveauMaintenant' | 'niveau2050' | 'niveau2100';
  label: string;
};

export const NIVEAU_COLUMNS: readonly NiveauColumn[] = [
  {
    horizon: 'maintenant',
    key: 'niveauMaintenant',
    label: appLabels.demarcheVulnerabiliteDiagMaintenant,
  },
  {
    horizon: '2050',
    key: 'niveau2050',
    label: appLabels.demarcheVulnerabiliteDiag2050,
  },
  {
    horizon: '2100',
    key: 'niveau2100',
    label: appLabels.demarcheVulnerabiliteDiag2100,
  },
];

export type ObjectifColumn = {
  key: 'objectifs2050' | 'objectifs2100';
  horizon: string;
  label: string;
};

export const OBJECTIF_COLUMNS: readonly ObjectifColumn[] = [
  {
    key: 'objectifs2050',
    horizon: '2050',
    label: appLabels.demarcheVulnerabiliteObjectifs2050,
  },
  {
    key: 'objectifs2100',
    horizon: '2100',
    label: appLabels.demarcheVulnerabiliteObjectifs2100,
  },
];

export type VulnerabiliteRow = {
  thematique: DemarchePcaetVulnerabiliteThematique;
  ligne: DemarchePcaetVulnerabiliteLigne;
  /** Une sous-thématique se rend en retrait, sous sa parente. */
  isEnfant: boolean;
  /**
   * Dernière sous-thématique de sa fratrie : son coude referme le trait
   * vertical de l'arborescence, qui filerait sinon jusqu'à la racine suivante.
   */
  isDernierEnfant: boolean;
  /** Voir `peutRecevoirSousThematique`, l'énoncé de référence de la règle. */
  peutRecevoirEnfant: boolean;
  /** Sous-thématiques de cette thématique. Toujours 0 sur une sous-thématique. */
  nombreEnfants: number;
  /** Grappe repliée : ses sous-thématiques ne sont pas dans les lignes. */
  isReplie: boolean;
  /**
   * Libellé de la parente, pour nommer la sous-thématique au lecteur d'écran :
   * les traits d'arborescence sont décoratifs, lui ne les voit pas.
   */
  parentLabel: string | null;
};

const ligneVierge = (
  thematiqueId: number
): DemarchePcaetVulnerabiliteLigne => ({
  thematiqueId,
  niveauMaintenant: null,
  niveau2050: null,
  niveau2100: null,
  objectifs2050: null,
  objectifs2100: null,
});

/**
 * Lignes du tableau : l'ordre des thématiques fait foi, chaque sous-thématique
 * étant ramenée derrière sa parente. Une thématique sans saisie reçoit une
 * ligne vierge — le serveur en sert déjà une, mais une photo figée par une
 * version antérieure peut ne pas la porter, et le tableau ne doit pas perdre
 * une ligne pour autant.
 */
export const toVulnerabiliteRows = (
  vulnerabilite: DemarchePcaetVulnerabilite,
  /** Thématiques dont la grappe est repliée. Tout est déplié par défaut. */
  repliees: ReadonlySet<number> = new Set()
): VulnerabiliteRow[] => {
  const { thematiques } = vulnerabilite;
  const parThematique = new Map(
    vulnerabilite.lignes.map((ligne) => [ligne.thematiqueId, ligne])
  );
  const ids = new Set(thematiques.map(({ id }) => id));

  // Une sous-thématique dont la parente n'est pas servie remonte à la racine :
  // la masquer la ferait disparaître du tableau avec sa saisie.
  const estRattachee = (thematique: DemarchePcaetVulnerabiliteThematique) =>
    thematique.parentId !== null && ids.has(thematique.parentId);

  const { racines = [], enfants = [] } = groupBy(thematiques, (thematique) =>
    estRattachee(thematique) ? 'enfants' : 'racines'
  );
  const parParent = groupBy(enfants, (enfant) => enfant.parentId as number);

  const toRow = (
    thematique: DemarchePcaetVulnerabiliteThematique,
    reste: Omit<VulnerabiliteRow, 'thematique' | 'ligne'>
  ): VulnerabiliteRow => ({
    thematique,
    ligne: parThematique.get(thematique.id) ?? ligneVierge(thematique.id),
    ...reste,
  });

  return racines.flatMap((racine) => {
    const fratrie = parParent[racine.id] ?? [];
    const isReplie = fratrie.length > 0 && repliees.has(racine.id);
    const row = toRow(racine, {
      isEnfant: false,
      isDernierEnfant: false,
      peutRecevoirEnfant: peutRecevoirSousThematique(racine),
      nombreEnfants: fratrie.length,
      isReplie,
      parentLabel: null,
    });

    // Les lignes d'une grappe repliée ne sont pas construites : à quoi bon les
    // fabriquer pour les jeter.
    if (isReplie) {
      return [row];
    }

    return [
      row,
      ...fratrie.map((enfant, index) =>
        toRow(enfant, {
          isEnfant: true,
          isDernierEnfant: index === fratrie.length - 1,
          peutRecevoirEnfant: false,
          nombreEnfants: 0,
          isReplie: false,
          parentLabel: racine.label,
        })
      ),
    ];
  });
};

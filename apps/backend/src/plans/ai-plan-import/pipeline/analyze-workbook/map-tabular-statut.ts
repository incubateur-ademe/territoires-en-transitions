import { Statut, StatutEnum, statutEnumValues } from '@tet/domain/plans';
import Fuse from 'fuse.js';

/**
 * Les avancements que les tableurs de suivi écrivent, et le statut qu'ils
 * donnent. Partagée avec le prompt : le modèle et le code lisent un tableur
 * de la même façon.
 */
export const TABULAR_STATUT_TABLE: ReadonlyArray<
  readonly [label: string, statut: Statut]
> = [
  ['Non engagée', StatutEnum.A_VENIR],
  ['En projet', StatutEnum.A_VENIR],
  ['Non démarrée', StatutEnum.A_VENIR],
  ['Non commencée', StatutEnum.A_VENIR],
  ['Pas commencée', StatutEnum.A_VENIR],
  ['À faire', StatutEnum.A_VENIR],
  ['À lancer', StatutEnum.A_VENIR],
  ['Prévue', StatutEnum.A_VENIR],
  ['Planifiée', StatutEnum.A_VENIR],
  ['Programmée', StatutEnum.A_VENIR],
  ['En cours', StatutEnum.EN_COURS],
  ['Démarrée', StatutEnum.EN_COURS],
  ['Engagée', StatutEnum.EN_COURS],
  ['Lancée', StatutEnum.EN_COURS],
  ['Terminée', StatutEnum.REALISE],
  ['Achevée', StatutEnum.REALISE],
  ['Faite', StatutEnum.REALISE],
  ['Close', StatutEnum.REALISE],
  ['Clôturée', StatutEnum.REALISE],
  ['Finalisée', StatutEnum.REALISE],
  ['Suspendue', StatutEnum.EN_PAUSE],
  ['En attente', StatutEnum.EN_PAUSE],
  ['Reportée', StatutEnum.EN_PAUSE],
  ['Annulée', StatutEnum.ABANDONNE],
];

const normalizeLabel = (label: string): string =>
  label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word !== '')
    // « Terminé », « Terminées », « Clos » : le genre et le nombre ne
    // changent rien.
    .map((word) => word.replace(/s$/, '').replace(/e+$/, '').replace(/s$/, ''))
    .join(' ');

const STATUT_BY_LABEL = new Map(
  TABULAR_STATUT_TABLE.map(([label, statut]) => [normalizeLabel(label), statut])
);

// Comme l'import Excel classique, mais à seuil strict : Fuse rapproche sinon
// « En projet » de « En retard ».
const FUZZY_MAX_SCORE = 0.3;
const FUZZY_MAX_LENGTH =
  2 * Math.max(...statutEnumValues.map((statut) => statut.length));
const fuzzyStatuts = new Fuse(statutEnumValues.map(normalizeLabel), {
  includeScore: true,
});

/**
 * Le statut d'une case d'avancement : la table du tableur, puis un statut de
 * la plateforme à une faute de frappe près. Une case vide ou inconnue n'en
 * donne aucun.
 */
export const mapTabularStatut = (value: string): Statut | null => {
  const label = normalizeLabel(value);
  if (label === '') {
    return null;
  }
  const known = STATUT_BY_LABEL.get(label);
  if (known) {
    return known;
  }
  // Le profil des colonnes interroge chaque valeur de la feuille : un
  // intitulé long n'est jamais un statut.
  if (label.length > FUZZY_MAX_LENGTH) {
    return null;
  }
  const [best] = fuzzyStatuts.search(label);
  return best && (best.score ?? 1) <= FUZZY_MAX_SCORE
    ? statutEnumValues[best.refIndex]
    : null;
};

/** Un statut écrit tel quel, dans la table ou parmi ceux de la plateforme. */
export const isKnownStatutLabel = (value: string): boolean => {
  const label = normalizeLabel(value);
  return (
    label !== '' && (STATUT_BY_LABEL.has(label) || PLATFORM_LABELS.has(label))
  );
};

const PLATFORM_LABELS = new Set(statutEnumValues.map(normalizeLabel));

const PROGRESS = /^(\d{1,3}(?:[.,]\d+)?)\s*(%?)$/;

/**
 * Un avancement chiffré (« 0,5 », « 100 % ») : rien de fait, à venir ; tout,
 * réalisé ; entre les deux, en cours. Sans « % », au-delà de 1 se lit en
 * pourcentage.
 */
export const mapProgressValue = (value: string): Statut | null => {
  const match = PROGRESS.exec(value.trim());
  if (!match) {
    return null;
  }
  const number = Number(match[1].replace(',', '.'));
  const share = match[2] || number > 1 ? number / 100 : number;
  if (share > 1) {
    return null;
  }
  return share === 0
    ? StatutEnum.A_VENIR
    : share === 1
    ? StatutEnum.REALISE
    : StatutEnum.EN_COURS;
};

/** Le statut d'une case d'une colonne d'avancement : un libellé, ou un taux. */
export const mapStatutCell = (value: string): Statut | null =>
  mapTabularStatut(value) ?? mapProgressValue(value);

/**
 * Le statut d'une fiche d'après ceux de ses sous-actions : réalisée quand
 * tout est réalisé ou abandonné, en cours dès qu'une a commencé, à venir
 * sinon. Les sous-actions sans statut ne comptent pas.
 */
export const aggregateFicheStatut = (
  statuts: (Statut | null)[]
): Statut | null => {
  const known = statuts.filter((statut): statut is Statut => statut !== null);
  if (known.length === 0) {
    return null;
  }
  if (known.every((statut) => statut === known[0])) {
    return known[0];
  }
  if (
    known.every(
      (statut) =>
        statut === StatutEnum.REALISE || statut === StatutEnum.ABANDONNE
    )
  ) {
    return StatutEnum.REALISE;
  }
  if (
    known.some(
      (statut) =>
        statut === StatutEnum.EN_COURS || statut === StatutEnum.REALISE
    )
  ) {
    return StatutEnum.EN_COURS;
  }
  return StatutEnum.A_VENIR;
};

/** La table en clair, pour le prompt : « "Non engagée", "En projet" donnent "À venir" ». */
export const describeTabularStatutTable = (): string =>
  [...groupLabelsByStatut()]
    .map(
      ([statut, labels]) =>
        `${labels.map((label) => `"${label}"`).join(', ')} ${
          labels.length > 1 ? 'donnent' : 'donne'
        } "${statut}"`
    )
    .join(' ; ');

const groupLabelsByStatut = (): Map<Statut, string[]> => {
  const groups = new Map<Statut, string[]>();
  for (const [label, statut] of TABULAR_STATUT_TABLE) {
    groups.set(statut, [...(groups.get(statut) ?? []), label]);
  }
  return groups;
};

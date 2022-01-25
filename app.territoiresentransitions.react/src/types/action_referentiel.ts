import {Referentiel} from 'types/litterals';

/**
 * @deprecated use actions types from referentiels procedures
 */
export interface ActionReferentielInterface {
  id: string;
  id_nomenclature: string;
  nom: string;
  thematique_id: string;
  description: string | undefined;
  contexte: string | undefined;
  exemples: string | undefined;
  ressources: string | undefined;
  points: number;
  actions: ActionReferentiel[];
}

/**
 * @deprecated use actions types from referentiels procedures
 */
export class ActionReferentiel {
  public static pathname = 'action_referentiel';
  get pathname(): string {
    return ActionReferentiel.pathname;
  }

  id: string;
  id_nomenclature: string;
  nom: string;
  thematique_id: string;
  description: string | undefined;
  contexte: string | undefined;
  exemples: string | undefined;
  ressources: string | undefined;
  points: number;
  actions: ActionReferentiel[];

  /**
   * Creates a ActionReferentiel instance.
   */
  constructor({
    id,
    id_nomenclature,
    nom,
    thematique_id,
    description,
    contexte,
    exemples,
    ressources,
    points,
    actions,
  }: {
    id: string;
    id_nomenclature: string;
    nom: string;
    thematique_id: string;
    description: string | undefined;
    contexte: string | undefined;
    exemples: string | undefined;
    ressources: string | undefined;
    points: number;
    actions: ActionReferentiel[];
  }) {
    this.id = id;
    this.id_nomenclature = id_nomenclature;
    this.nom = nom;
    this.thematique_id = thematique_id;
    this.description = description;
    this.contexte = contexte;
    this.exemples = exemples;
    this.ressources = ressources;
    this.points = points;
    this.actions = actions;
  }

  equals(other: ActionReferentielInterface | null): boolean {
    if (!other) return false;
    return (
      other.id === this.id &&
      other.id_nomenclature === this.id_nomenclature &&
      other.nom === this.nom &&
      other.thematique_id === this.thematique_id &&
      other.description === this.description &&
      other.contexte === this.contexte &&
      other.exemples === this.exemples &&
      other.ressources === this.ressources &&
      other.points === this.points &&
      other.actions === this.actions
    );
  }

  get referentiel(): Referentiel {
    return this.id.startsWith('cae') ? 'cae' : 'eci';
  }

  get referentielDisplayName(): string {
    return this.referentiel === 'cae'
      ? 'Climat Air Energie'
      : 'Économie Circulaire';
  }

  get displayName(): string {
    return `${this.identifiant} - ${this.nom}`;
  }

  /**
   * Identifiant as in the markdown.
   */
  get identifiant(): string {
    return this.id_nomenclature;
  }

  /**
   * Identifiant number count.
   */
  get level(): number {
    return this.identifiant.split('.').length;
  }

  /**
   * The type of action.
   */
  get type(): ActionType {
    return this.referentiel === 'cae'
      ? caeHierarchy[this.level - 1]
      : eciHierarchy[this.level - 1];
  }
}

const caeHierarchy: ActionType[] = [
  'axe',
  'sous-axe',
  'action',
  'sous-action',
  'tache',
];
const eciHierarchy: ActionType[] = ['axe', 'action', 'sous-action', 'tache'];
export type ActionType =
  | 'referentiel'
  | 'axe'
  | 'sous-axe'
  | 'action'
  | 'sous-action'
  | 'tache';

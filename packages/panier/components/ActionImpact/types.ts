import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactTempsMiseEnOeuvre,
  ActionImpactThematique,
} from '@tet/api';

export type ActionImpactProps = {
  /** Titre de l'action à impact */
  titre: string;
  /** Thématiques de l'action à impact */
  thematiques: ActionImpactThematique[];
  /** Budget de la mise en place de l'action : petit, moyen ou élevé */
  budget?: ActionImpactFourchetteBudgetaire;
  /** Description de l'action à impact */
  description: string;
  /** Temps de mise en oeuvre */
  miseEnOeuvre?: ActionImpactTempsMiseEnOeuvre;
  /** Lien vers les ressources externes */
  ressources?: string | null;
  /** Lien vers les retours d'expérience */
  rex?: string | null;
  /** Lien vers les subventions mobilisables */
  subventions?: string | null;
  /** Statut de l'action */
  statut?: 'non_pertinent' | 'en_cours' | 'realise' | null;
  /** Indique si l'action est mise dans le panier */
  panier: boolean;
  /** Initialisation de l'état sélectionné de la carte */
  isSelected?: boolean;
  /** Détecte le changement de statut sélectionné ou non */
  onToggleSelected: (value: boolean) => void;
  /** Détecte le changement de statut de l'action : en cours, réalisé */
  onUpdateStatus?: (status: string) => void;
};

export type ModaleActionImpactProps = {
  /** Composant enfant (carte action) */
  children: JSX.Element;
} & ActionImpactProps;

export type CarteActionImpactProps = Pick<
  ActionImpactProps,
  | 'titre'
  | 'thematiques'
  | 'budget'
  | 'statut'
  | 'panier'
  | 'isSelected'
  | 'onToggleSelected'
  | 'onUpdateStatus'
>;

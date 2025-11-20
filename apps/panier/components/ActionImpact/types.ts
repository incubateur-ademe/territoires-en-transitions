import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactStatut,
  ActionImpactTempsMiseEnOeuvre,
  ActionImpactThematique,
  ActionImpactTypologie,
  ActionReferentiel,
} from '@tet/api';

type LinkType = {
  url: string;
  label: string;
};

export type ActionImpactProps = {
  /** Titre de l'action à impact */
  titre: string;
  /** Thématiques de l'action à impact */
  thematiques: ActionImpactThematique[];
  /** Typologie */
  typologie: ActionImpactTypologie | null;
  /** Budget de la mise en place de l'action : petit, moyen ou élevé */
  budget?: ActionImpactFourchetteBudgetaire;
  /** Description de l'action à impact */
  description: string;
  /** Temps de mise en oeuvre */
  miseEnOeuvre?: ActionImpactTempsMiseEnOeuvre;
  /** Lien vers les ressources externes */
  ressources?: LinkType[] | null;
  /** Lien vers les retours d'expérience */
  rex?: LinkType[] | null;
  /** Lien vers les subventions mobilisables */
  subventions?: LinkType[] | null;
  /** Statut de l'action */
  statut?: ActionImpactStatut;
  /** Mesures des référentiels liées */
  actionsLiees?: ActionReferentiel[] | null;
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
  | 'typologie'
  | 'budget'
  | 'statut'
  | 'panier'
  | 'isSelected'
  | 'onToggleSelected'
  | 'onUpdateStatus'
>;

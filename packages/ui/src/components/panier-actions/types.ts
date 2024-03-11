import {ActionImpactThematique} from '@tet/api';

export type ActionImpactProps = {
  /** Titre de l'action à impact */
  titre: string;
  /** Thématiques de l'action à impact */
  thematiques: ActionImpactThematique[];
  /** Budget de la mise en place de l'action : petit, moyen ou élevé */
  budget: 0 | 1 | 2 | 3;
  /** Description de l'action à impact */
  description: string;
  /** Lien vers les ressources externes */
  ressources?: string;
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

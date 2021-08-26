import {IndicateurPersonnaliseInterface} from 'generated/models/indicateur_personnalise';

interface MetaCommentaire {
  meta: {commentaire: string};
}

export type IndicateurPersonnaliseTypedInterface =
  IndicateurPersonnaliseInterface & MetaCommentaire;

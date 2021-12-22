import {indicateurCommentaireReadEndpoint} from 'core-logic/api/endpoints/IndicateurCommentaireReadEndpoint';
import {indicateurCommentaireWriteEndpoint} from 'core-logic/api/endpoints/IndicateurCommentaireWriteEndpoint';
import {IndicateurCommentaireRead} from 'generated/dataLayer/indicateur_commentaire_read';
import {IndicateurCommentaireWrite} from 'generated/dataLayer/indicateur_commentaire_write';

class IndicateurCommentaireRepository {
  save(
    commentaire: IndicateurCommentaireWrite
  ): Promise<IndicateurCommentaireWrite | null> {
    return indicateurCommentaireWriteEndpoint.save(commentaire);
  }

  async fetchCommentaireForId(args: {
    collectiviteId: number;
    indicateurId: string;
  }): Promise<IndicateurCommentaireRead | null> {
    const results = await indicateurCommentaireReadEndpoint.getBy({
      collectivite_id: args.collectiviteId,
      indicateur_id: args.indicateurId,
    });
    return results[0] || null;
  }
}

export const indicateurCommentaireRepository =
  new IndicateurCommentaireRepository();

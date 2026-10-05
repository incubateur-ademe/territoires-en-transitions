import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ReponseSecteursCommuns } from '@tet/domain/plans';
import {
  ActionCommunsLookup,
  CommunsSecteursClient,
  CommunsSecteursClientError,
  SecteursCommunsLookup,
} from './communs-secteurs.client';

type FakeReponse =
  | { type: 'parts'; parts: Record<string, number> }
  | { type: 'pas-encore-calculee' }
  | { type: 'muette' }
  | { type: 'inconnue' }
  | { type: 'echec' };

const toReponseCommuns = (
  ficheId: number,
  parts: Record<string, number> | null
): ReponseSecteursCommuns => {
  const repartition = parts && {
    dominant: null,
    nonAttribuable: Math.max(
      0,
      1 - Object.values(parts).reduce((sum, part) => sum + part, 0)
    ),
    parts,
  };
  return {
    id: `communs-${ficheId}`,
    secteursDirect: repartition,
    secteursContribution: repartition,
    methode: 'mapping-test/agregation-test',
  };
};

/** Une fiche non programmée est inconnue de Communs (404) */
export class FakeCommunsSecteursClient
  implements Pick<CommunsSecteursClient, 'getSecteurs' | 'getAction'>
{
  private readonly reponses = new Map<number, FakeReponse>();
  private readonly appels = new Map<number, number>();
  private readonly appelsAction = new Map<number, number>();

  repondParts(ficheId: number, parts: Record<string, number>) {
    this.reponses.set(ficheId, { type: 'parts', parts });
  }

  repondPasEncoreCalculee(ficheId: number) {
    this.reponses.set(ficheId, { type: 'pas-encore-calculee' });
  }

  repondMuette(ficheId: number) {
    this.reponses.set(ficheId, { type: 'muette' });
  }

  repondInconnue(ficheId: number) {
    this.reponses.set(ficheId, { type: 'inconnue' });
  }

  echoue(ficheId: number) {
    this.reponses.set(ficheId, { type: 'echec' });
  }

  getNombreAppels(ficheId: number): number {
    return this.appels.get(ficheId) ?? 0;
  }

  getNombreAppelsAction(ficheId: number): number {
    return this.appelsAction.get(ficheId) ?? 0;
  }

  async getSecteurs(
    ficheId: number
  ): Promise<Result<SecteursCommunsLookup, CommunsSecteursClientError>> {
    this.appels.set(ficheId, this.getNombreAppels(ficheId) + 1);

    const reponse = this.reponses.get(ficheId) ?? { type: 'inconnue' };
    switch (reponse.type) {
      case 'echec':
        return failure('COMMUNS_INJOIGNABLE');
      case 'inconnue':
        return success({ statut: 'inconnue' });
      case 'pas-encore-calculee':
      case 'muette':
      case 'parts': {
        const reponseCommuns = toReponseCommuns(
          ficheId,
          reponse.type === 'parts' ? reponse.parts : null
        );
        return success({
          statut: 'trouvee',
          reponse: reponseCommuns,
          reponseBrute: reponseCommuns,
        });
      }
    }
  }

  async getAction(
    ficheId: number
  ): Promise<Result<ActionCommunsLookup, CommunsSecteursClientError>> {
    this.appelsAction.set(ficheId, this.getNombreAppelsAction(ficheId) + 1);
    return success({ classee: this.reponses.get(ficheId)?.type === 'muette' });
  }
}

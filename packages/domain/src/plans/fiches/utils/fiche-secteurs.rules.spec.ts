import { describe, expect, it } from 'vitest';
import {
  RepartitionSecteursCommuns,
  ReponseSecteursCommuns,
} from '../fiche-secteurs.schema';
import { getSecteursRetenus } from './fiche-secteurs.rules';

const reponse = ({
  direct,
  contribution = null,
}: {
  direct: RepartitionSecteursCommuns | null;
  contribution?: RepartitionSecteursCommuns | null;
}): ReponseSecteursCommuns => ({
  id: 'uuid-communs',
  secteursDirect: direct,
  secteursContribution: contribution,
  methode: 'mapping-v1.1/agregation-v1',
});

const repartition = (
  parts: RepartitionSecteursCommuns['parts']
): RepartitionSecteursCommuns => ({
  dominant: null,
  nonAttribuable: 0,
  parts,
});

describe('secteurs retenus d’une fiche', () => {
  it('retient un secteur dont la part atteint 0,2', () => {
    expect(
      getSecteursRetenus(
        reponse({ direct: repartition({ dechets: 0.75, tertiaire: 0.06 }) })
      )
    ).toEqual(['dechets']);
  });

  it('retient le secteur dont la part vaut exactement 0,2', () => {
    expect(
      getSecteursRetenus(reponse({ direct: repartition({ agriculture: 0.2 }) }))
    ).toEqual(['agriculture']);
  });

  it('retient plusieurs secteurs, dans l’ordre de la liste réglementaire', () => {
    expect(
      getSecteursRetenus(
        reponse({
          direct: repartition({ branche_energie: 0.3, residentiel: 0.5 }),
        })
      )
    ).toEqual(['residentiel', 'branche_energie']);
  });

  it('renvoie une liste vide quand aucune part n’atteint 0,2 : fiche non attribuable', () => {
    expect(
      getSecteursRetenus(
        reponse({
          direct: {
            dominant: null,
            nonAttribuable: 0.96,
            parts: { dechets: 0.04 },
          },
        })
      )
    ).toEqual([]);
  });

  it('ignore un code de secteur inconnu', () => {
    expect(
      getSecteursRetenus(
        reponse({ direct: repartition({ inconnu: 0.9, tertiaire: 0.4 }) })
      )
    ).toEqual(['tertiaire']);
  });

  it('ne lit que la sémantique « direct », jamais « contribution »', () => {
    expect(
      getSecteursRetenus(
        reponse({
          direct: repartition({ autres_transports: 0.8 }),
          contribution: repartition({ transport_routier: 0.8 }),
        })
      )
    ).toEqual(['autres_transports']);
  });

  it('renvoie null quand Communs n’a pas encore classé la fiche', () => {
    expect(
      getSecteursRetenus(
        reponse({
          direct: null,
          contribution: repartition({ transport_routier: 0.8 }),
        })
      )
    ).toBeNull();
  });
});

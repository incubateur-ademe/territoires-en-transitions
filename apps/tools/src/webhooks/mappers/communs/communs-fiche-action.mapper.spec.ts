import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { CommunsFicheActionMapper } from './communs-fiche-action.mapper';

const collectiviteId = 4708;

describe('CommunsFicheActionMapper', () => {
  test('Standard mapping', async () => {
    const ficheAction: FicheWithRelationsAndCollectivite = {
      id: 10108,
      parentId: null,
      createdBy: {
        id: '3fb7dbe4-6af2-4f8d-a199-fe381014d85e',
        prenom: 'Caroline',
        nom: 'Cordary',
      },
      axes: [
        {
          id: 10820,
          nom: 'Axe 4: Aménager un territoire durable : bien vivre au Bassin de Pompey',
          parentId: null,
          planId: null,
          collectiviteId,
          axeLevel: 1,
        },
      ],
      libreTags: null,
      plans: [{ id: 8017, nom: 'PCAET 2022-2028', collectiviteId }],
      titre:
        "Fiche 12: Prévenir les conséquences du changement climatique : Consolidation et mise en œuvre d'une stratégie d’atténuation et d'adaptation au changement climatique ambitieuse",
      cibles: [
        'Grand public',
        'Associations',
        'Acteurs économiques',
        'Public Scolaire',
        'Autres collectivités du territoire',
        'Agents',
      ],
      statut: 'En retard',
      dateFin: '2021-07-01 00:00:00+00',
      pilotes: [
        {
          nom: 'Carine ALIF',
          tagId: 56940,
          userId: null,
        },
      ],
      priorite: null,
      services: [{ id: 9475, nom: 'Environnement', collectiviteId }],
      createdAt: '2023-09-19 14:05:42.168359+00',
      dateDebut: '2019-11-01 00:00:00+00',
      objectifs: "Texte d'objectif",
      referents: [
        {
          nom: 'Caroline Cordary',
          tagId: 18507,
          userId: null,
        },
      ],
      restreint: false,
      calendrier: null,
      financeurs: [
        {
          ficheId: 10108,
          montantTtc: null,
          financeurTagId: 2193,
          financeurTag: { id: 2193, nom: 'ADEME', collectiviteId },
        },
      ],
      majTermine: null,
      modifiedAt: '2025-04-02 16:00:19.987446+00',
      modifiedBy: {
        id: '3fb7dbe4-6af2-4f8d-a199-fe381014d85e',
        prenom: 'Caroline',
        nom: 'Cordary',
      },
      piliersEci: null,
      ressources:
        'Un chargée de projet "accélérateur de transitions environnementales"',
      structures: null,
      description: 'Texte de description',
      indicateurs: null,
      partenaires: null,
      thematiques: [{ id: 5, nom: 'Énergie et climat' }],
      collectivite: {
        id: 4708,
        nom: 'CC du Bassin de Pompey',
        type: 'epci',
        siren: '245400601',
        createdAt: '2022-02-09 16:28:30.974096+00',
        modifiedAt: '2022-02-09 16:28:30.974096+00',
        population: 40384,
        regionCode: '44',
        communeCode: null,
        natureInsee: 'CC',
        accesRestreint: false,
        departementCode: '54',
        nic: null,
        dansAireUrbaine: null,
      },
      financements: null,
      collectiviteId: 4708,
      effetsAttendus: [
        { id: 1, nom: 'Adaptation au changement climatique', notice: null },
        { id: 5, nom: 'Préservation de la biodiversité', notice: null },
      ],
      sousThematiques: [
        { id: 36, nom: 'Adaptation au changement climatique', thematiqueId: 5 },
      ],
      budgetPrevisionnel: '12000',
      instanceGouvernance: null,
      tempsDeMiseEnOeuvre: null,
      ameliorationContinue: false,
      notes: null,
      participationCitoyenne: null,
      participationCitoyenneType: null,
      etapes: null,
      docs: null,
      fichesLiees: null,
      mesures: null,
      collectiviteNom: 'CC du Bassin de Pompey',
      sharedWithCollectivites: null,
      budgets: null,
      completion: {
        ficheId: 10108,
        fields: [],
        isCompleted: false,
      },
    };

    const mapper = new CommunsFicheActionMapper();
    const communProjet = mapper.map(ficheAction);

    expect(communProjet).toMatchObject({
      budgetPrevisionnel: 12000,
      collectivites: [
        {
          code: '245400601',
          type: 'EPCI',
        },
      ],
      competences: [],
      dateDebutPrevisionnelle: expect.toBeOneOf([
        '2019-11-01T01:00:00.000+01:00',
        '2019-11-01T00:00:00.000+00:00',
      ]),
      description: 'Texte de description',
      externalId: '10108',
      nom: "Fiche 12: Prévenir les conséquences du changement climatique : Consolidation et mise en œuvre d'une stratégie d’atténuation et d'adaptation au changement climatique ambitieuse",
      phase: 'Opération',
      phaseStatut: 'En retard',
      porteur: {
        referentNom: 'Caroline Cordary',
      },
    });
  });
});

import { FicheWithRelationsAndCollectivite } from '@/domain/plans/fiches';
import { CreateProjetRequest } from './client/types.gen';
import { CommunsFicheActionMapper } from './communs-fiche-action.mapper';

describe('CommunsFicheActionMapper', () => {
  test('Standard mapping', async () => {
    const ficheAction: FicheWithRelationsAndCollectivite = {
      id: 10108,
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
        },
      ],
      tags: null,
      plans: [{ id: 8017, nom: 'PCAET 2022-2028' }],
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
      services: [{ id: 9475, nom: 'Environnement' }],
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
      financeurs: [{ id: 2193, nom: 'ADEME' }],
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
        accessRestreint: false,
        departementCode: '54',
      },
      financements: null,
      collectiviteId: 4708,
      effetsAttendus: [
        { id: 1, nom: 'Adaptation au changement climatique', notice: null },
        { id: 5, nom: 'Préservation de la biodiversité', notice: null },
      ],
      sousThematiques: [{ id: 36, nom: 'Adaptation au changement climatique' }],
      budgetPrevisionnel: '12000',
      instanceGouvernance: null,
      tempsDeMiseEnOeuvre: null,
      ameliorationContinue: false,
      notesComplementaires: null,
      participationCitoyenne: null,
      participationCitoyenneType: null,
      etapes: null,
      notes: null,
      docs: null,
      fichesLiees: null,
      mesures: null,
    };

    const mapper = new CommunsFicheActionMapper();
    const communProjet = mapper.map(ficheAction);

    const expectedCommunProjet: CreateProjetRequest = {
      budgetPrevisionnel: 12000,
      collectivites: [
        {
          code: '245400601',
          type: 'EPCI',
        },
      ],
      competences: [],
      dateDebutPrevisionnelle: '2019-11-01T01:00:00.000+01:00',
      description: 'Texte de description',
      externalId: '10108',
      nom: "Fiche 12: Prévenir les conséquences du changement climatique : Consolidation et mise en œuvre d'une stratégie d’atténuation et d'adaptation au changement climatique ambitieuse",
      phase: 'Opération',
      phaseStatut: 'En retard',
      porteur: {
        referentNom: 'Caroline Cordary',
        referentEmail: null,
        referentPrenom: null,
        referentTelephone: null,
      },
    };

    expect(communProjet).toEqual(expectedCommunProjet);
  });
});

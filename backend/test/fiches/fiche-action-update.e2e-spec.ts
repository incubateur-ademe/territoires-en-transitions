import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { default as request } from 'supertest';
import { describe, expect, it } from 'vitest';
import DatabaseService from '../../src/common/services/database.service';
import { ficheActionActionTable } from '../../src/fiches/models/fiche-action-action.table';
import { ficheActionAxeTable } from '../../src/fiches/models/fiche-action-axe.table';
import { ficheActionEffetAttenduTable } from '../../src/fiches/models/fiche-action-effet-attendu.table';
import { ficheActionFinanceurTagTable } from '../../src/fiches/models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from '../../src/fiches/models/fiche-action-indicateur.table';
import { ficheActionLienTable } from '../../src/fiches/models/fiche-action-lien.table';
import { ficheActionPartenaireTagTable } from '../../src/fiches/models/fiche-action-partenaire-tag.table';
import { ficheActionPiloteTable } from '../../src/fiches/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '../../src/fiches/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from '../../src/fiches/models/fiche-action-service.table';
import { ficheActionSousThematiqueTable } from '../../src/fiches/models/fiche-action-sous-thematique.table';
import { ficheActionStructureTagTable } from '../../src/fiches/models/fiche-action-structure-tag.table';
import { ficheActionThematiqueTable } from '../../src/fiches/models/fiche-action-thematique.table';
import { ficheActionTable } from '../../src/fiches/models/fiche-action.table';
import { getYoloDodoToken } from '../auth/auth-utils';
import { getTestApp } from '../common/app-utils';
import {
  actionsFixture,
  axesFixture,
  fichesLieesFixture,
  financeursFixture,
  indicateursFixture,
  partenairesFixture,
  pilotesFixture,
  referentsFixture,
  resultatAttenduFixture,
  servicesFixture,
  sousThematiquesFixture,
  structuresFixture,
  thematiquesFixture,
} from './fixtures/fiche-action-relations.fixture';
import { ficheActionFixture } from './fixtures/fiche-action.fixture';

const collectiviteId = 1;
const ficheActionId = 9999;

describe('FichesActionUpdateService', () => {
  let app: INestApplication;
  let yoloDodoToken: string;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    yoloDodoToken = await getYoloDodoToken();

    databaseService = app.get<DatabaseService>(DatabaseService);

    await databaseService.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheActionId));

    await databaseService.db
      .insert(ficheActionTable)
      .values(ficheActionFixture);

    await insertFixtures(databaseService, ficheActionId);
  });

  afterAll(async () => {
    await databaseService.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheActionId));

    await app.close();
  });

  describe('Update fiche action fields', () => {
    it('should strip irrelevant fiche action fields data', async () => {
      const data = {
        titre: 'Construire des pistes cyclables',
        description:
          'Un objectif à long terme sera de construire de nombreuses pistes cyclables dans le centre-ville.',
        niveau_priorite: 'Bas',
        plat: 'macaroni', // irrelevant data to be stripped
      };

      const response = await request(app.getHttpServer())
        .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
        .send(data)
        .set('Authorization', `Bearer ${yoloDodoToken}`)
        .set('Content-Type', 'application/json')
        .expect(200);

      const body = response.body;

      expect(body.plat).toBeUndefined();
    });

    it('should update fiche action fields', async () => {
      const data = {
        collectiviteId: 1,
        titre: 'Construire des pistes cyclables',
        description:
          'Un objectif à long terme sera de construire de nombreuses pistes cyclables dans le centre-ville.',
        niveau_priorite: 'Bas',
        piliersEci: ['Approvisionnement durable', 'Écoconception'],
        objectifs:
          'Diminution de 15% de la consommation de feuilles de papier / Indicateurs : Nombre de papiers',
        cibles: ['Grand public et associations', 'Agents'],
        ressources: 'Service numérique',
        financements: 'De 40 000€ à 100 000€',
        budgetPrevisionnel: '35000',
        statut: 'En pause',
        niveauPriorite: 'Bas',
        ameliorationContinue: false,
        calendrier: 'Calendrier prévisionnel',
        notesComplementaires: 'Vive le vélo !',
        majTermine: true,
        tempsDeMiseEnOeuvre: 1,
        participationCitoyenne:
          'La participation citoyenne a été approuvée en réunion plénière',
        participationCitoyenneType: 'Information',
        restreint: false,
      };

      const response = await request(app.getHttpServer())
        .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
        .send(data)
        .set('Authorization', `Bearer ${yoloDodoToken}`)
        .set('Content-Type', 'application/json')
        .expect(200);

      const body = response.body;

      expect(body.titre).toBe('Construire des pistes cyclables');
      expect(body.description).toBe(
        'Un objectif à long terme sera de construire de nombreuses pistes cyclables dans le centre-ville.'
      );
      expect(body.niveauPriorite).toBe('Bas');
      expect(body.piliersEci).toEqual([
        'Approvisionnement durable',
        'Écoconception',
      ]);
      expect(body.objectifs).toBe(
        'Diminution de 15% de la consommation de feuilles de papier / Indicateurs : Nombre de papiers'
      );
      expect(body.cibles).toEqual(['Grand public et associations', 'Agents']);
      expect(body.ressources).toBe('Service numérique');
      expect(body.financements).toBe('De 40 000€ à 100 000€');
      expect(body.budgetPrevisionnel).toBe('35000');
      expect(body.statut).toBe('En pause');
      expect(body.ameliorationContinue).toBe(false);
      expect(body.calendrier).toBe('Calendrier prévisionnel');
      expect(body.notesComplementaires).toBe('Vive le vélo !');
      expect(body.majTermine).toBe(true);
      expect(body.collectiviteId).toBe(1);
      expect(body.restreint).toBe(false);
      expect(body.tempsDeMiseEnOeuvre).toBe(1);
      expect(body.participationCitoyenne).toBe(
        'La participation citoyenne a été approuvée en réunion plénière'
      );
      expect(body.participationCitoyenneType).toBe('Information');
    });

    it('should return 400 when invalid numeric type are provided', async () => {
      const data = {
        budgetPrevisionnel: 'invalid_number',
      };

      await request(app.getHttpServer())
        .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
        .send(data)
        .set('Authorization', `Bearer ${yoloDodoToken}`)
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should return 400 for invalid date format in dateDebut', async () => {
      const data = { dateDebut: 'not-a-date' };

      await request(app.getHttpServer())
        .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
        .send(data)
        .set('Authorization', `Bearer ${yoloDodoToken}`)
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should return 400 for non-array type in resultatsAttendus', async () => {
      const data = { resultatsAttendus: 'this-should-be-an-array' };

      await request(app.getHttpServer())
        .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
        .send(data)
        .set('Authorization', `Bearer ${yoloDodoToken}`)
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should return 400 for invalid boolean type in ameliorationContinue', async () => {
      const data = { ameliorationContinue: 'not-a-boolean' };

      await request(app.getHttpServer())
        .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
        .send(data)
        .set('Authorization', `Bearer ${yoloDodoToken}`)
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should return 404 when updating a non-existent ficheAction', async () => {
      const nonExistentFicheActionId = 121212;
      const data = {
        titre: 'New Titre',
      };

      await request(app.getHttpServer())
        .put(
          `/collectivites/${collectiviteId}/fiches-action/${nonExistentFicheActionId}`
        )
        .send(data)
        .set('Authorization', `Bearer ${yoloDodoToken}`)
        .set('Content-Type', 'application/json')
        .expect(404);
    });

    it('should return 400 if the body is empty', async () => {
      const data = {};
      const response = await putRequest(data);

      expect(response.status).toBe(400);
      expect(response.body.message[0]).toMatch(/cannot be empty/);
    });
  });

  describe('Update relations', () => {
    it('should update the axes relations in the database', async () => {
      const data = {
        axes: [{ id: 1 }, { id: 2 }],
      };

      const response = await putRequest(data);

      const body = response.body;

      expect(body.axes).toStrictEqual([
        {
          ficheId: ficheActionId,
          axeId: 1,
        },
        {
          ficheId: ficheActionId,
          axeId: 2,
        },
      ]);
    });

    it('should update the thematiques relations in the database', async () => {
      const data = {
        thematiques: [{ id: 1 }, { id: 2 }],
      };

      const response = await putRequest(data);

      const body = response.body;

      expect(body.thematiques).toStrictEqual([
        {
          ficheId: ficheActionId,
          thematiqueId: 1,
        },
        {
          ficheId: ficheActionId,
          thematiqueId: 2,
        },
      ]);
    });

    it('should update the sousThematiques relations in the database', async () => {
      const data = {
        sousThematiques: [{ id: 3 }, { id: 4 }],
      };

      const response = await putRequest(data);

      const body = response.body;

      expect(body.sousThematiques).toStrictEqual([
        {
          ficheId: ficheActionId,
          thematiqueId: 3,
        },
        {
          ficheId: ficheActionId,
          thematiqueId: 4,
        },
      ]);
    });

    it('should update the partenaires relations in the database', async () => {
      const data = {
        partenaires: [{ id: 1 }, { id: 2 }],
      };

      const response = await putRequest(data);

      const body = response.body;

      expect(body.partenaires).toStrictEqual([
        {
          ficheId: ficheActionId,
          partenaireTagId: 1,
        },
        {
          ficheId: ficheActionId,
          partenaireTagId: 2,
        },
      ]);
    });

    it('should update the structures relations in the database', async () => {
      const data = {
        structures: [{ id: 1 }, { id: 2 }],
      };

      const response = await putRequest(data);

      const body = response.body;

      expect(body.structures).toStrictEqual([
        {
          ficheId: ficheActionId,
          structureTagId: 1,
        },
        {
          ficheId: ficheActionId,
          structureTagId: 2,
        },
      ]);
    });

    it('should update the pilotes relations in the database', async () => {
      const data = {
        pilotes: [
          {
            nom: 'Donald Duck',
            collectiviteId: 5460,
            tagId: 1,
            userId: '3f407fc6-3634-45ff-a988-301e9088096a',
          },
          {
            nom: 'Mickey Mouse',
            collectiviteId: 5460,
            tagId: 9,
            userId: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561',
          },
        ],
      };

      const response = await putRequest(data);

      const body = response.body;

      expect(body.pilotes).toStrictEqual([
        {
          ficheId: ficheActionId,
          tagId: 1,
          userId: '3f407fc6-3634-45ff-a988-301e9088096a',
        },
        {
          ficheId: ficheActionId,
          tagId: 9,
          userId: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561',
        },
      ]);
    });

    it('should update the financeurs relations in the database', async () => {
      const data = {
        financeurs: [
          {
            financeurTag: {
              id: 1,
            },
            montantTtc: 999,
          },
          {
            financeurTag: {
              id: 2,
            },
            montantTtc: 666,
          },
        ],
      };

      const response = await putRequest(data);

      const body = response.body;

      expect(body.financeurs[0].ficheId).toEqual(ficheActionId);
      expect(body.financeurs[0].financeurTagId).toEqual(1);
      expect(body.financeurs[0].montantTtc).toEqual(999);
      expect(body.financeurs[1].ficheId).toEqual(ficheActionId);
      expect(body.financeurs[1].financeurTagId).toEqual(2);
      expect(body.financeurs[1].montantTtc).toEqual(666);
    });

    it('should update the actions relations in the database', async () => {
      const data = {
        actions: [{ id: 'cae_1.1.1' }, { id: 'cae_1.1.2' }],
      };

      const response = await putRequest(data);

      const body = response.body;

      expect(body.actions).toStrictEqual([
        { ficheId: ficheActionId, actionId: 'cae_1.1.1' },
        { ficheId: ficheActionId, actionId: 'cae_1.1.2' },
      ]);
    });

    it('should update the indicateurs relations in the database', async () => {
      const data = {
        indicateurs: [{ id: 13 }, { id: 14 }],
      };

      const response = await putRequest(data);

      const body = response.body;

      expect(body.indicateurs).toStrictEqual([
        { ficheId: ficheActionId, indicateurId: 13 },
        { ficheId: ficheActionId, indicateurId: 14 },
      ]);
    });

    it('should update the services relations in the database', async () => {
      const data = {
        services: [{ id: 1 }, { id: 2 }],
      };

      const response = await putRequest(data);

      const body = response.body;

      expect(body.services).toStrictEqual([
        { ficheId: ficheActionId, serviceTagId: 1 },
        { ficheId: ficheActionId, serviceTagId: 2 },
      ]);
    });

    it('should update the fichesLiees relations in the database', async () => {
      const data = {
        fichesLiees: [{ id: 1 }, { id: 2 }],
      };

      const response = await putRequest(data);

      const body = response.body;

      expect(body.fichesLiees).toStrictEqual([
        { ficheUne: ficheActionId, ficheDeux: 1 },
        { ficheUne: ficheActionId, ficheDeux: 2 },
      ]);
    });

    it('should update the resultatAttendu relations in the database', async () => {
      const data = {
        resultatsAttendus: [
          {
            id: 21,
          },
          {
            id: 22,
          },
        ],
      };

      const response = await putRequest(data);

      const body = response.body;

      expect(body.resultatAttendu).toStrictEqual([
        { ficheId: ficheActionId, effetAttenduId: 21 },
        { ficheId: ficheActionId, effetAttenduId: 22 },
      ]);
    });
  });

  describe('Access Rights', () => {
    it('should return 401 if an unauthorized user tries to update a fiche action', async () => {
      const data = {
        titre: 'Tentative de mise à jour sans droits',
      };

      await request(app.getHttpServer())
        .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
        .send(data)
        .set('Authorization', 'Bearer invalid_or_missing_token')
        .set('Content-Type', 'application/json')
        .expect(401);
    });

    it('should allow authorized user to update fiche action', async () => {
      const data = {
        titre: 'Titre mis à jour par une utilisatrice autorisée',
      };

      const response = await request(app.getHttpServer())
        .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
        .send(data)
        .set('Authorization', `Bearer ${yoloDodoToken}`)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body.titre).toBe(
        'Titre mis à jour par une utilisatrice autorisée'
      );
    });
  });

  async function insertFixtures(
    databaseService: DatabaseService,
    ficheId: number
  ) {
    await databaseService.db.insert(ficheActionAxeTable).values({
      ficheId,
      axeId: axesFixture.id,
    });

    await databaseService.db.insert(ficheActionThematiqueTable).values({
      ficheId,
      thematiqueId: thematiquesFixture.id,
    });

    await databaseService.db.insert(ficheActionSousThematiqueTable).values({
      ficheId,
      thematiqueId: sousThematiquesFixture.thematiqueId,
    });

    await databaseService.db.insert(ficheActionPartenaireTagTable).values({
      ficheId,
      partenaireTagId: partenairesFixture.id,
    });

    await databaseService.db.insert(ficheActionStructureTagTable).values({
      ficheId,
      structureTagId: structuresFixture.id,
    });

    await databaseService.db.insert(ficheActionPiloteTable).values({
      ficheId,
      tagId: pilotesFixture.tagId,
      userId: pilotesFixture.userId,
    });

    await databaseService.db.insert(ficheActionReferentTable).values({
      ficheId,
      tagId: referentsFixture.tagId,
      userId: referentsFixture.userId,
    });

    await databaseService.db.insert(ficheActionActionTable).values({
      ficheId,
      actionId: actionsFixture.id,
    });

    await databaseService.db.insert(ficheActionIndicateurTable).values({
      ficheId,
      indicateurId: indicateursFixture.id,
    });

    await databaseService.db.insert(ficheActionServiceTagTable).values({
      ficheId,
      serviceTagId: servicesFixture.id,
    });

    await databaseService.db.insert(ficheActionFinanceurTagTable).values({
      ficheId,
      financeurTagId: financeursFixture.financeurTag.id,
      montantTtc: financeursFixture.montantTtc,
    });

    await databaseService.db.insert(ficheActionLienTable).values({
      ficheUne: ficheId,
      ficheDeux: fichesLieesFixture.id,
    });

    await databaseService.db.insert(ficheActionEffetAttenduTable).values({
      ficheId,
      effetAttenduId: resultatAttenduFixture.id,
    });
  }

  const putRequest = async (data: object) => {
    return await request(app.getHttpServer())
      .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
      .send(data)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .set('Content-Type', 'application/json');
  };
});

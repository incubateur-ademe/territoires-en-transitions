import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { describe, expect, it } from 'vitest';
import { default as request } from 'supertest';
import { ZodValidationPipe } from '@anatine/zod-nestjs/src/lib/zod-validation-pipe';
import { eq } from 'drizzle-orm';
import DatabaseService from '../../src/common/services/database.service';
import { ficheActionTable } from '../../src/fiches/models/fiche-action.table';

let collectiviteId: number;
let ficheActionId: number;
let originalFicheAction: any;

describe('FichesActionUpdateService', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();

    databaseService = app.get<DatabaseService>(DatabaseService);

    collectiviteId = 1;
    ficheActionId = 1;
  });

  beforeEach(async () => {
    originalFicheAction = await databaseService.db
      .select()
      .from(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheActionId));
  });

  afterEach(async () => {
    await databaseService.db
      .update(ficheActionTable)
      .set(originalFicheAction[0])
      .where(eq(ficheActionTable.id, 1));
  });

  afterAll(async () => {
    await app.close();
  });

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
      resultatsAttendus: [
        'Allongement de la durée d’usage',
        'Préservation de la biodiversité',
      ],
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
    };

    const response = await request(app.getHttpServer())
      .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
      .send(data)
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
    expect(body.resultatsAttendus).toEqual([
      'Allongement de la durée d’usage',
      'Préservation de la biodiversité',
    ]);
    expect(body.cibles).toEqual(['Grand public et associations', 'Agents']);
    expect(body.ressources).toBe('Service numérique');
    expect(body.financements).toBe('De 40 000€ à 100 000€');
    expect(body.budgetPrevisionnel).toBe('35000');
    expect(body.statut).toBe('En pause');
    expect(body.ameliorationContinue).toBe(false);
    expect(body.calendrier).toBe('Calendrier prévisionnel');
    expect(body.notesComplementaires).toBe('Vive le vélo !');
    expect(body.majTermine).toBe(true);
  });

  it('should return 400 when no fields are provided for update', async () => {
    const data = {}; //

    await request(app.getHttpServer())
      .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
      .send(data)
      .set('Content-Type', 'application/json')
      .expect(400);
  });

  it('should allow partial fiche action fields update and retain unchanged fields', async () => {
    const data = {
      titre: 'Updated Titre',
    };

    const response = await request(app.getHttpServer())
      .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
      .send(data)
      .set('Content-Type', 'application/json')
      .expect(200);

    const body = response.body;

    expect(body.titre).toBe('Updated Titre');
    expect(body.description).toBe(
      'Un objectif à long terme sera de construire de nombreuses pistes cyclables dans le centre-ville.'
    );
  });

  it('should return 400 when invalid numeric type are provided', async () => {
    const data = {
      budgetPrevisionnel: 'invalid_number',
    };
    await request(app.getHttpServer())
      .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
      .send(data)
      .set('Content-Type', 'application/json')
      .expect(400);
  });

  it('should return 400 for invalid date format in dateDebut', async () => {
    const data = { dateDebut: 'not-a-date' };
    await request(app.getHttpServer())
      .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
      .send(data)
      .set('Content-Type', 'application/json')
      .expect(400);
  });

  it('should return 400 for non-array type in resultatsAttendus', async () => {
    const data = { resultatsAttendus: 'this-should-be-an-array' };
    await request(app.getHttpServer())
      .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
      .send(data)
      .set('Content-Type', 'application/json')
      .expect(400);
  });

  it('should return 400 for invalid boolean type in ameliorationContinue', async () => {
    const data = { ameliorationContinue: 'not-a-boolean' };
    await request(app.getHttpServer())
      .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
      .send(data)
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
      .set('Content-Type', 'application/json')
      .expect(404);
  });

  it('should update the axes relations in the database', async () => {
    const data = {
      axes: [{ id: 1 }, { id: 2 }],
    };

    const response = await request(app.getHttpServer())
      .put(`/collectivites/${collectiviteId}/fiches-action/${ficheActionId}`)
      .send(data)
      .set('Content-Type', 'application/json');

    const body = response.body;

    expect(body.axes).toBe([
      {
        ficheId: 1,
        axeId: 1,
      },
      {
        ficheId: 1,
        axeId: 2,
      },
    ]);
  });
});

import { ParcoursLabellisation } from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { parcoursToChecklist } from './parcours-to-checklist';

const makeParcours = (
  overrides: Partial<ParcoursLabellisation> = {}
): ParcoursLabellisation =>
  ({
    collectiviteId: 1,
    referentiel: 'cae',
    status: 'non_demandee',
    etoiles: 1,
    completudeOk: false,
    critereScore: {
      scoreARealiser: 0,
      scoreFait: 0,
      atteint: false,
      etoiles: 1,
    },
    criteresAction: [],
    labellisation: null,
    demande: null,
    audit: null,
    isCot: false,
    conditionFichiers: {
      referentiel: 'cae',
      preuveNombre: 0,
    },
    score: undefined,
    auditeurs: [],
    referentRolesDefined: { eluReferent: false, referentTechnique: false },
    ...overrides,
  } as unknown as ParcoursLabellisation);

describe('parcoursToChecklist', () => {
  it('renvoie completude.done depuis completudeOk', () => {
    const view = parcoursToChecklist(makeParcours({ completudeOk: true }), false);
    expect(view.completude).toEqual({ done: true });
  });

  it('affiche minimumScore au seuil 35 % (2e étoile, non atteint) quand la CT est sans étoile (etoiles === 1)', () => {
    const view = parcoursToChecklist(makeParcours({ etoiles: 1 }), false);
    expect(view.minimumScore).toEqual({ done: false, seuilPercent: 35 });
  });

  it('inclut minimumScore avec seuil en % quand etoileObjectif > 1', () => {
    const view = parcoursToChecklist(
      makeParcours({
        etoiles: 2,
        critereScore: {
          scoreARealiser: 0.35,
          scoreFait: 0.4,
          atteint: true,
          etoiles: 2,
        },
      }),
      false
    );
    expect(view.minimumScore).toEqual({ done: true, seuilPercent: 35 });
  });

  it('renvoie scoreFait depuis critereScore.scoreFait', () => {
    const view = parcoursToChecklist(
      makeParcours({
        critereScore: {
          scoreARealiser: 0.35,
          scoreFait: 0.42,
          atteint: true,
          etoiles: 2,
        },
      }),
      false
    );
    expect(view.scoreFait).toBe(0.42);
  });

  it('mappe chaque critere_action en camelCase avec identifiant extrait', () => {
    const view = parcoursToChecklist(
      makeParcours({
        criteresAction: [
          {
            actionId: 'cae_5.1.1.3.2',
            formulation: 'Mettre en place une équipe projet',
            priorite: 3,
            atteint: false,
            minRealisePercentage: 100,
            minProgrammePercentage: 100,
            etoile: 1,
            referentielId: 'cae',
            proportionFait: 0,
            proportionProgramme: 0,
            statutOuScore: '',
          },
        ],
      }),
      false
    );
    expect(view.mesures).toEqual([
      {
        actionId: 'cae_5.1.1.3.2',
        identifiant: '5.1.1.3.2',
        formulation: 'Mettre en place une équipe projet',
        done: false,
        minRealisePercentage: 100,
        minProgrammePercentage: 100,
      },
    ]);
  });

  it('trie les mesures par priorite croissante du critere action', () => {
    const view = parcoursToChecklist(
      makeParcours({
        criteresAction: [
          {
            actionId: 'cae_3',
            formulation: 'Troisième',
            priorite: 3,
            atteint: false,
            minRealisePercentage: 100,
            minProgrammePercentage: null,
            etoile: 1,
            referentielId: 'cae',
            proportionFait: 0,
            proportionProgramme: 0,
            statutOuScore: '',
          },
          {
            actionId: 'cae_1',
            formulation: 'Premier',
            priorite: 1,
            atteint: false,
            minRealisePercentage: 100,
            minProgrammePercentage: null,
            etoile: 1,
            referentielId: 'cae',
            proportionFait: 0,
            proportionProgramme: 0,
            statutOuScore: '',
          },
          {
            actionId: 'cae_2',
            formulation: 'Second',
            priorite: 2,
            atteint: false,
            minRealisePercentage: 100,
            minProgrammePercentage: null,
            etoile: 1,
            referentielId: 'cae',
            proportionFait: 0,
            proportionProgramme: 0,
            statutOuScore: '',
          },
        ],
      }),
      false
    );
    expect(view.mesures.map((m) => m.actionId)).toEqual([
      'cae_1',
      'cae_2',
      'cae_3',
    ]);
  });

  it('renvoie acteEngagement.demandeId null quand pas de demande', () => {
    const view = parcoursToChecklist(makeParcours({ demande: null }), false);
    expect(view.acteEngagement).toEqual({ demandeId: null });
  });

  it('renvoie acteEngagement.demandeId quand la demande existe', () => {
    const view = parcoursToChecklist(
      makeParcours({
        demande: { id: 42 } as ParcoursLabellisation['demande'],
      }),
      false
    );
    expect(view.acteEngagement).toEqual({ demandeId: 42 });
  });

  describe('canModifyCandidatureDocuments', () => {
    it('true quand aucun audit', () => {
      const view = parcoursToChecklist(makeParcours({ audit: null }), false);
      expect(view.canModifyCandidatureDocuments).toBe(true);
    });

    it("true quand l'audit n'est pas validé", () => {
      const view = parcoursToChecklist(
        makeParcours({
          audit: { valide: false } as ParcoursLabellisation['audit'],
        }),
        false
      );
      expect(view.canModifyCandidatureDocuments).toBe(true);
    });

    it("false quand l'audit est validé", () => {
      const view = parcoursToChecklist(
        makeParcours({
          audit: { valide: true } as ParcoursLabellisation['audit'],
        }),
        false
      );
      expect(view.canModifyCandidatureDocuments).toBe(false);
    });

    it("true quand l'audit est validé mais que l'utilisateur porte la permission", () => {
      const view = parcoursToChecklist(
        makeParcours({
          audit: { valide: true } as ParcoursLabellisation['audit'],
        }),
        true
      );
      expect(view.canModifyCandidatureDocuments).toBe(true);
    });
  });

  describe('roleMesures', () => {
    const makeCritereAction = (
      actionId: string,
      atteint: boolean,
      priorite: number,
      formulation = ''
    ): ParcoursLabellisation['criteresAction'][number] =>
      ({
        actionId,
        formulation,
        priorite,
        atteint,
        minRealisePercentage: 100,
        minProgrammePercentage: null,
        etoile: 1,
        referentielId: 'cae',
        proportionFait: 0,
        proportionProgramme: 0,
        statutOuScore: '',
      });

    it('mappe les 2 rôles CAE quand les 2 mesures sont présentes et pilotes désignés', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentRolesDefined: { eluReferent: true, referentTechnique: true },
          referentiel: 'cae',
          criteresAction: [
            makeCritereAction('cae_5.1.2.1.1', true, 1),
            makeCritereAction('cae_5.1.1.1.3', false, 2),
          ],
        }),
        false
      );
      expect(view.roleMesures).toEqual({
        eluReferent: { actionId: 'cae_5.1.2.1.1', done: true },
        referentTechnique: { actionId: 'cae_5.1.1.1.3', done: false },
      });
    });

    it('mappe les 2 rôles ECI quand les 2 mesures sont présentes et pilotes désignés', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentRolesDefined: { eluReferent: true, referentTechnique: true },
          referentiel: 'eci',
          criteresAction: [
            makeCritereAction('eci_1.1.1.1', true, 1),
            makeCritereAction('eci_1.1.1.3', true, 2),
          ],
        }),
        false
      );
      expect(view.roleMesures).toEqual({
        eluReferent: { actionId: 'eci_1.1.1.1', done: true },
        referentTechnique: { actionId: 'eci_1.1.1.3', done: true },
      });
    });

    it("renvoie null pour un rôle dont la mesure n'est pas dans criteresAction", () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'cae',
          criteresAction: [
            makeCritereAction('cae_5.1.2.1.1', false, 1),
          ],
        }),
        false
      );
      expect(view.roleMesures).toEqual({
        eluReferent: { actionId: 'cae_5.1.2.1.1', done: false },
        referentTechnique: null,
      });
    });

    it('renvoie les 2 rôles à null pour un référentiel hors cae/eci', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'te',
          criteresAction: [
            makeCritereAction('te_5.1.2.1.1', true, 1),
          ],
        }),
        false
      );
      expect(view.roleMesures).toEqual({
        eluReferent: null,
        referentTechnique: null,
      });
    });

    it('done=false sur le rôle quand atteint=true mais aucun pilote désigné', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'cae',
          criteresAction: [
            makeCritereAction('cae_5.1.2.1.1', true, 1),
            makeCritereAction('cae_5.1.1.1.3', true, 2),
          ],
        }),
        false
      );
      expect(view.roleMesures).toEqual({
        eluReferent: { actionId: 'cae_5.1.2.1.1', done: false },
        referentTechnique: { actionId: 'cae_5.1.1.1.3', done: false },
      });
    });

    it('done=true uniquement sur le rôle dont le pilote est désigné', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentRolesDefined: { eluReferent: false, referentTechnique: true },
          referentiel: 'cae',
          criteresAction: [
            makeCritereAction('cae_5.1.2.1.1', true, 1),
            makeCritereAction('cae_5.1.1.1.3', true, 2),
          ],
        }),
        false
      );
      expect(view.roleMesures).toEqual({
        eluReferent: { actionId: 'cae_5.1.2.1.1', done: false },
        referentTechnique: { actionId: 'cae_5.1.1.1.3', done: true },
      });
    });
  });

  describe('mesures rows pour actions de rôle', () => {
    const makeRoleCritere = (
      actionId: string,
      atteint: boolean
    ): ParcoursLabellisation['criteresAction'][number] =>
      ({
        actionId,
        formulation: '',
        priorite: 1,
        atteint,
        minRealisePercentage: 100,
        minProgrammePercentage: null,
        etoile: 1,
        referentielId: 'cae',
        proportionFait: 1,
        proportionProgramme: 0,
        statutOuScore: 'Fait',
      });

    it('row done=false sur action de rôle atteinte mais sans pilote', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'cae',
          criteresAction: [
            makeRoleCritere('cae_5.1.1.1.3', true),
          ],
        }),
        false
      );
      const row = view.mesures.find((m) => m.actionId === 'cae_5.1.1.1.3');
      expect(row?.done).toBe(false);
    });

    it('row done=true sur action de rôle atteinte avec pilote', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentRolesDefined: { eluReferent: true, referentTechnique: true },
          referentiel: 'cae',
          criteresAction: [
            makeRoleCritere('cae_5.1.1.1.3', true),
          ],
        }),
        false
      );
      const row = view.mesures.find((m) => m.actionId === 'cae_5.1.1.1.3');
      expect(row?.done).toBe(true);
    });

    it('row done=false sur action de rôle non atteinte même avec pilote', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'cae',
          criteresAction: [
            makeRoleCritere('cae_5.1.1.1.3', false),
          ],
        }),
        false
      );
      const row = view.mesures.find((m) => m.actionId === 'cae_5.1.1.1.3');
      expect(row?.done).toBe(false);
    });

    it('row done suit atteint pour une action non-rôle peu importe la presence pilote', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'cae',
          criteresAction: [
            makeRoleCritere('cae_5.1.1.3.2', true),
          ],
        }),
        false
      );
      const row = view.mesures.find((m) => m.actionId === 'cae_5.1.1.3.2');
      expect(row?.done).toBe(true);
    });
  });
});

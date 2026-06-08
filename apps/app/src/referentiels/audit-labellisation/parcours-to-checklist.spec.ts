import {
  ParcoursLabellisation,
  RolePilotesPresence,
} from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { parcoursToChecklist } from './parcours-to-checklist';

const makeParcours = (
  overrides: Partial<ParcoursLabellisation> = {}
): ParcoursLabellisation =>
  ({
    collectivite_id: 1,
    referentiel: 'cae',
    status: 'non_demandee',
    etoiles: 1,
    completude_ok: false,
    critere_score: {
      score_a_realiser: 0,
      score_fait: 0,
      atteint: false,
      etoiles: 1,
    },
    criteres_action: [],
    rempli: false,
    labellisation: null,
    demande: null,
    audit: null,
    isCot: false,
    conditionFichiers: {
      referentiel: 'cae',
      preuve_nombre: 0,
      atteint: false,
    },
    score: undefined,
    auditeurs: [],
    ...overrides,
  } as unknown as ParcoursLabellisation);

const noRolePilotes: RolePilotesPresence = {
  eluReferent: false,
  referentTechnique: false,
};

const bothRolePilotes: RolePilotesPresence = {
  eluReferent: true,
  referentTechnique: true,
};

describe('parcoursToChecklist', () => {
  it('renvoie completude.done depuis completude_ok', () => {
    const view = parcoursToChecklist(
      makeParcours({ completude_ok: true }),
      noRolePilotes
    );
    expect(view.completude).toEqual({ done: true });
  });

  it('omet scoreMinimum quand maximumRequestableStar === 1', () => {
    const view = parcoursToChecklist(
      makeParcours({ etoiles: 1 }),
      noRolePilotes
    );
    expect(view.scoreMinimum).toBeNull();
  });

  it('inclut scoreMinimum avec seuil en % quand maximumRequestableStar > 1', () => {
    const view = parcoursToChecklist(
      makeParcours({
        etoiles: 2,
        critere_score: {
          score_a_realiser: 0.35,
          score_fait: 0.4,
          atteint: true,
          etoiles: 2,
        },
      }),
      noRolePilotes
    );
    expect(view.scoreMinimum).toEqual({ done: true, seuilPercent: 35 });
  });

  it('renvoie scoreFait depuis critere_score.score_fait', () => {
    const view = parcoursToChecklist(
      makeParcours({
        critere_score: {
          score_a_realiser: 0.35,
          score_fait: 0.42,
          atteint: true,
          etoiles: 2,
        },
      }),
      noRolePilotes
    );
    expect(view.scoreFait).toBe(0.42);
  });

  it('mappe chaque critere_action en camelCase avec identifiant extrait', () => {
    const view = parcoursToChecklist(
      makeParcours({
        criteres_action: [
          {
            action_id: 'cae_5.1.1.3.2',
            formulation: 'Mettre en place une équipe projet',
            priorite: 3,
            atteint: false,
            rempli: false,
            min_realise_percentage: 100,
            min_programme_percentage: 100,
            etoile: 1,
            referentiel_id: 'cae',
            proportion_fait: 0,
            proportion_programme: 0,
            statut_ou_score: '',
          },
        ] as unknown as ParcoursLabellisation['criteres_action'],
      }),
      noRolePilotes
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
        criteres_action: [
          {
            action_id: 'cae_3',
            formulation: 'Troisième',
            priorite: 3,
            atteint: false,
            rempli: false,
            min_realise_percentage: 100,
            min_programme_percentage: null,
            etoile: 1,
            referentiel_id: 'cae',
            proportion_fait: 0,
            proportion_programme: 0,
            statut_ou_score: '',
          },
          {
            action_id: 'cae_1',
            formulation: 'Premier',
            priorite: 1,
            atteint: false,
            rempli: false,
            min_realise_percentage: 100,
            min_programme_percentage: null,
            etoile: 1,
            referentiel_id: 'cae',
            proportion_fait: 0,
            proportion_programme: 0,
            statut_ou_score: '',
          },
          {
            action_id: 'cae_2',
            formulation: 'Second',
            priorite: 2,
            atteint: false,
            rempli: false,
            min_realise_percentage: 100,
            min_programme_percentage: null,
            etoile: 1,
            referentiel_id: 'cae',
            proportion_fait: 0,
            proportion_programme: 0,
            statut_ou_score: '',
          },
        ] as unknown as ParcoursLabellisation['criteres_action'],
      }),
      noRolePilotes
    );
    expect(view.mesures.map((m) => m.actionId)).toEqual([
      'cae_1',
      'cae_2',
      'cae_3',
    ]);
  });

  it('renvoie acteEngagement.signed et demandeId null quand pas de demande', () => {
    const view = parcoursToChecklist(
      makeParcours({ demande: null }),
      noRolePilotes
    );
    expect(view.acteEngagement).toEqual({ signed: false, demandeId: null });
  });

  it('renvoie acteEngagement.demandeId quand la demande existe', () => {
    const view = parcoursToChecklist(
      makeParcours({
        demande: { id: 42 } as ParcoursLabellisation['demande'],
        conditionFichiers: {
          referentiel: 'cae',
          preuve_nombre: 1,
          atteint: true,
        },
      }),
      noRolePilotes
    );
    expect(view.acteEngagement).toEqual({ signed: true, demandeId: 42 });
  });

  describe('peutModifierDocumentsCandidature', () => {
    it('true quand aucun audit', () => {
      const view = parcoursToChecklist(
        makeParcours({ audit: null }),
        noRolePilotes
      );
      expect(view.peutModifierDocumentsCandidature).toBe(true);
    });

    it("true quand l'audit n'est pas validé", () => {
      const view = parcoursToChecklist(
        makeParcours({
          audit: { valide: false } as ParcoursLabellisation['audit'],
        }),
        noRolePilotes
      );
      expect(view.peutModifierDocumentsCandidature).toBe(true);
    });

    it("false quand l'audit est validé", () => {
      const view = parcoursToChecklist(
        makeParcours({
          audit: { valide: true } as ParcoursLabellisation['audit'],
        }),
        noRolePilotes
      );
      expect(view.peutModifierDocumentsCandidature).toBe(false);
    });
  });

  describe('roleMesures', () => {
    const makeCritereAction = (
      action_id: string,
      atteint: boolean,
      priorite: number,
      formulation = ''
    ): ParcoursLabellisation['criteres_action'][number] =>
      ({
        action_id,
        formulation,
        priorite,
        atteint,
        rempli: false,
        min_realise_percentage: 100,
        min_programme_percentage: null,
        etoile: 1,
        referentiel_id: 'cae',
        proportion_fait: 0,
        proportion_programme: 0,
        statut_ou_score: '',
      } as unknown as ParcoursLabellisation['criteres_action'][number]);

    it('mappe les 2 rôles CAE quand les 2 mesures sont présentes et pilotes désignés', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'cae',
          criteres_action: [
            makeCritereAction('cae_5.1.2.1.1', true, 1),
            makeCritereAction('cae_5.1.1.1.3', false, 2),
          ] as ParcoursLabellisation['criteres_action'],
        }),
        bothRolePilotes
      );
      expect(view.roleMesures).toEqual({
        eluReferent: { actionId: 'cae_5.1.2.1.1', done: true },
        referentTechnique: { actionId: 'cae_5.1.1.1.3', done: false },
      });
    });

    it('mappe les 2 rôles ECI quand les 2 mesures sont présentes et pilotes désignés', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'eci',
          criteres_action: [
            makeCritereAction('eci_1.1.1.1', true, 1),
            makeCritereAction('eci_1.1.1.3', true, 2),
          ] as ParcoursLabellisation['criteres_action'],
        }),
        bothRolePilotes
      );
      expect(view.roleMesures).toEqual({
        eluReferent: { actionId: 'eci_1.1.1.1', done: true },
        referentTechnique: { actionId: 'eci_1.1.1.3', done: true },
      });
    });

    it("renvoie null pour un rôle dont la mesure n'est pas dans criteres_action", () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'cae',
          criteres_action: [
            makeCritereAction('cae_5.1.2.1.1', false, 1),
          ] as ParcoursLabellisation['criteres_action'],
        }),
        bothRolePilotes
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
          criteres_action: [
            makeCritereAction('te_5.1.2.1.1', true, 1),
          ] as ParcoursLabellisation['criteres_action'],
        }),
        bothRolePilotes
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
          criteres_action: [
            makeCritereAction('cae_5.1.2.1.1', true, 1),
            makeCritereAction('cae_5.1.1.1.3', true, 2),
          ] as ParcoursLabellisation['criteres_action'],
        }),
        noRolePilotes
      );
      expect(view.roleMesures).toEqual({
        eluReferent: { actionId: 'cae_5.1.2.1.1', done: false },
        referentTechnique: { actionId: 'cae_5.1.1.1.3', done: false },
      });
    });

    it('done=true uniquement sur le rôle dont le pilote est désigné', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'cae',
          criteres_action: [
            makeCritereAction('cae_5.1.2.1.1', true, 1),
            makeCritereAction('cae_5.1.1.1.3', true, 2),
          ] as ParcoursLabellisation['criteres_action'],
        }),
        { eluReferent: false, referentTechnique: true }
      );
      expect(view.roleMesures).toEqual({
        eluReferent: { actionId: 'cae_5.1.2.1.1', done: false },
        referentTechnique: { actionId: 'cae_5.1.1.1.3', done: true },
      });
    });
  });

  describe('mesures rows pour actions de rôle', () => {
    const makeRoleCritere = (
      action_id: string,
      atteint: boolean
    ): ParcoursLabellisation['criteres_action'][number] =>
      ({
        action_id,
        formulation: '',
        priorite: 1,
        atteint,
        rempli: false,
        min_realise_percentage: 100,
        min_programme_percentage: null,
        etoile: 1,
        referentiel_id: 'cae',
        proportion_fait: 1,
        proportion_programme: 0,
        statut_ou_score: 'Fait',
      } as unknown as ParcoursLabellisation['criteres_action'][number]);

    it('row done=false sur action de rôle atteinte mais sans pilote', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'cae',
          criteres_action: [
            makeRoleCritere('cae_5.1.1.1.3', true),
          ] as ParcoursLabellisation['criteres_action'],
        }),
        noRolePilotes
      );
      const row = view.mesures.find(
        (m) => m.actionId === 'cae_5.1.1.1.3'
      );
      expect(row?.done).toBe(false);
    });

    it('row done=true sur action de rôle atteinte avec pilote', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'cae',
          criteres_action: [
            makeRoleCritere('cae_5.1.1.1.3', true),
          ] as ParcoursLabellisation['criteres_action'],
        }),
        { eluReferent: false, referentTechnique: true }
      );
      const row = view.mesures.find(
        (m) => m.actionId === 'cae_5.1.1.1.3'
      );
      expect(row?.done).toBe(true);
    });

    it("row done=false sur action de rôle non atteinte même avec pilote", () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'cae',
          criteres_action: [
            makeRoleCritere('cae_5.1.1.1.3', false),
          ] as ParcoursLabellisation['criteres_action'],
        }),
        bothRolePilotes
      );
      const row = view.mesures.find(
        (m) => m.actionId === 'cae_5.1.1.1.3'
      );
      expect(row?.done).toBe(false);
    });

    it("row done suit atteint pour une action non-rôle peu importe la presence pilote", () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'cae',
          criteres_action: [
            makeRoleCritere('cae_5.1.1.3.2', true),
          ] as ParcoursLabellisation['criteres_action'],
        }),
        noRolePilotes
      );
      const row = view.mesures.find(
        (m) => m.actionId === 'cae_5.1.1.3.2'
      );
      expect(row?.done).toBe(true);
    });
  });
});

import { ParcoursLabellisation } from '@tet/domain/referentiels';
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

describe('parcoursToChecklist', () => {
  it('renvoie completude.done depuis completude_ok', () => {
    const view = parcoursToChecklist(makeParcours({ completude_ok: true }));
    expect(view.completude).toEqual({ done: true });
  });

  it('omet scoreMinimum quand etoiles === 1', () => {
    const view = parcoursToChecklist(makeParcours({ etoiles: 1 }));
    expect(view.scoreMinimum).toBeNull();
  });

  it('inclut scoreMinimum avec seuil en % quand etoiles > 1', () => {
    const view = parcoursToChecklist(
      makeParcours({
        etoiles: 2,
        critere_score: {
          score_a_realiser: 0.35,
          score_fait: 0.4,
          atteint: true,
          etoiles: 2,
        },
      })
    );
    expect(view.scoreMinimum).toEqual({ done: true, seuilPercent: 35 });
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
      })
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
      })
    );
    expect(view.mesures.map((m) => m.actionId)).toEqual([
      'cae_1',
      'cae_2',
      'cae_3',
    ]);
  });

  it('renvoie acteEngagement.signed et demandeId null quand pas de demande', () => {
    const view = parcoursToChecklist(makeParcours({ demande: null }));
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
      })
    );
    expect(view.acteEngagement).toEqual({ signed: true, demandeId: 42 });
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

    it('mappe les 3 rôles CAE quand les 3 mesures sont présentes', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'cae',
          criteres_action: [
            makeCritereAction('cae_5.1.1.3.2', false, 3),
            makeCritereAction('cae_5.1.2.1.1', true, 1),
            makeCritereAction('cae_5.1.1.1.3', false, 2),
          ] as ParcoursLabellisation['criteres_action'],
        })
      );
      expect(view.roleMesures).toEqual({
        equipeProjet: { actionId: 'cae_5.1.1.3.2', done: false },
        eluReferent: { actionId: 'cae_5.1.2.1.1', done: true },
        referentTechnique: { actionId: 'cae_5.1.1.1.3', done: false },
      });
    });

    it('mappe les 3 rôles ECI quand les 3 mesures sont présentes', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'eci',
          criteres_action: [
            makeCritereAction('eci_1.1.3.1', false, 3),
            makeCritereAction('eci_1.1.1.1', true, 1),
            makeCritereAction('eci_1.1.1.3', true, 2),
          ] as ParcoursLabellisation['criteres_action'],
        })
      );
      expect(view.roleMesures).toEqual({
        equipeProjet: { actionId: 'eci_1.1.3.1', done: false },
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
        })
      );
      expect(view.roleMesures).toEqual({
        equipeProjet: null,
        eluReferent: { actionId: 'cae_5.1.2.1.1', done: false },
        referentTechnique: null,
      });
    });

    it('renvoie les 3 rôles à null pour un référentiel hors cae/eci', () => {
      const view = parcoursToChecklist(
        makeParcours({
          referentiel: 'te',
          criteres_action: [
            makeCritereAction('te_5.1.1.3.2', true, 1),
          ] as ParcoursLabellisation['criteres_action'],
        })
      );
      expect(view.roleMesures).toEqual({
        equipeProjet: null,
        eluReferent: null,
        referentTechnique: null,
      });
    });
  });
});

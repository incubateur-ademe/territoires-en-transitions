import { TCycleLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { describe, expect, it } from 'vitest';
import { isAuditActif } from './is-audit-actif';

function makeCycle(
  overrides: Partial<TCycleLabellisation> & {
    parcoursOverrides?: Partial<NonNullable<TCycleLabellisation['parcours']>>;
  } = {}
): TCycleLabellisation {
  const { parcoursOverrides, ...rest } = overrides;
  const audit = {
    id: 42,
    collectivite_id: 1,
    referentiel_id: 'cae',
    demande_id: null,
    date_debut: null,
    date_fin: null,
    date_cnl: null,
    valide: false,
    valide_labellisation: false,
    clos: false,
  } as NonNullable<TCycleLabellisation['parcours']>['audit'];

  const defaultParcours = {
    status: 'audit_en_cours',
    audit,
  } as NonNullable<TCycleLabellisation['parcours']>;

  return {
    parcours: { ...defaultParcours, ...parcoursOverrides },
    isLoading: false,
    isError: false,
    status: 'audit_en_cours',
    isAuditeur: true,
    isCOT: false,
    labellisable: true,
    peutDemanderEtoile: false,
    peutCommencerAudit: false,
    peutDemander1ereEtoileCOT: false,
    ...rest,
  } as TCycleLabellisation;
}

describe('isAuditActif', () => {
  it("est vrai quand le statut est audit_en_cours et l'audit existe", () => {
    expect(isAuditActif(makeCycle())).toBe(true);
  });

  it("est faux quand le statut n'est pas audit_en_cours", () => {
    const statutsNonAuditEnCours = [
      'non_demandee',
      'demande_envoyee',
      'audit_valide',
      'labellisation_en_cours',
    ] as const;

    statutsNonAuditEnCours.forEach((status) => {
      expect(
        isAuditActif(makeCycle({ parcoursOverrides: { status } }))
      ).toBe(false);
    });
  });

  it("est faux quand le parcours n'est pas chargé", () => {
    expect(isAuditActif(makeCycle({ parcours: null }))).toBe(false);
  });

  it("est faux quand l'audit est null malgré le statut audit_en_cours", () => {
    expect(
      isAuditActif(makeCycle({ parcoursOverrides: { audit: null } }))
    ).toBe(false);
  });
});

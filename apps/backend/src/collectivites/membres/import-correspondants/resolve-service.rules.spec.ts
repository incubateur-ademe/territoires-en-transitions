import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { describe, expect, it } from 'vitest';
import {
  correspondantCsvSchema,
  CorrespondantCsv,
} from './correspondant-csv.schema';
import {
  decouperSiret,
  estTypeCorrespondant,
  extraireCleAppariement,
} from './resolve-service.rules';

const ligne = (partial: Partial<CorrespondantCsv>): CorrespondantCsv => ({
  type: collectiviteTypeEnum.DREAL,
  region_code: '',
  departement_code: '',
  siret: '',
  nom: '',
  email: 'correspondant@developpement-durable.gouv.fr',
  role: undefined,
  ...partial,
});

describe('extraireCleAppariement', () => {
  it("apparie une DREAL et une DR ADEME par leur région, une DDT par son département", () => {
    expect(
      extraireCleAppariement(
        ligne({ type: collectiviteTypeEnum.DREAL, region_code: '53' })
      )
    ).toEqual({ success: true, data: { colonne: 'region_code', valeur: '53' } });

    expect(
      extraireCleAppariement(
        ligne({ type: collectiviteTypeEnum.DR_ADEME, region_code: '53' })
      )
    ).toEqual({ success: true, data: { colonne: 'region_code', valeur: '53' } });

    expect(
      extraireCleAppariement(
        ligne({ type: collectiviteTypeEnum.DDT, departement_code: '035' })
      )
    ).toEqual({
      success: true,
      data: { colonne: 'departement_code', valeur: '035' },
    });
  });

  it('apparie un service national par son établissement', () => {
    expect(
      extraireCleAppariement(
        ligne({
          type: collectiviteTypeEnum.SERVICE_NATIONAL,
          siret: '12008701000068',
        })
      )
    ).toEqual({
      success: true,
      data: { colonne: 'siret', valeur: '12008701000068' },
    });
  });

  it('refuse une ligne sans sa colonne clé', () => {
    const resultat = extraireCleAppariement(
      ligne({ type: collectiviteTypeEnum.DDT })
    );
    expect(resultat.success).toBe(false);
    expect(resultat.success === false && resultat.error).toContain(
      'departement_code'
    );
  });

  it("refuse une ligne qui renseigne une autre clé que celle de son type", () => {
    const resultat = extraireCleAppariement(
      ligne({
        type: collectiviteTypeEnum.DDT,
        departement_code: '035',
        region_code: '53',
      })
    );
    expect(resultat.success).toBe(false);
    expect(resultat.success === false && resultat.error).toContain(
      'region_code'
    );
  });

  it('refuse un SIRET qui ne compte pas quatorze chiffres', () => {
    const resultat = extraireCleAppariement(
      ligne({ type: collectiviteTypeEnum.SERVICE_NATIONAL, siret: '120087010' })
    );
    expect(resultat.success).toBe(false);
    expect(resultat.success === false && resultat.error).toContain('14');
  });

  it("refuse un type qui n'a pas de correspondants", () => {
    const resultat = extraireCleAppariement(
      ligne({ type: collectiviteTypeEnum.COMMUNE, region_code: '53' })
    );
    expect(resultat.success).toBe(false);
  });
});

describe('estTypeCorrespondant', () => {
  it('accepte les cinq familles de services et rejette les autres', () => {
    expect(estTypeCorrespondant(collectiviteTypeEnum.DREAL)).toBe(true);
    expect(estTypeCorrespondant(collectiviteTypeEnum.REGION)).toBe(true);
    expect(estTypeCorrespondant(collectiviteTypeEnum.SERVICE_NATIONAL)).toBe(
      true
    );
    expect(estTypeCorrespondant(collectiviteTypeEnum.EPCI)).toBe(false);
  });
});

describe('decouperSiret', () => {
  it('sépare le SIREN du NIC', () => {
    expect(decouperSiret('12008701000068')).toEqual({
      siren: '120087010',
      nic: '00068',
    });
  });
});

describe('correspondantCsvSchema', () => {
  it('normalise la casse et les espaces de l’adresse', () => {
    const ligne = correspondantCsvSchema.parse({
      type: 'dreal',
      region_code: '53',
      email: '  Fabrice.Douglas@Developpement-Durable.Gouv.Fr ',
    });
    expect(ligne.email).toBe('fabrice.douglas@developpement-durable.gouv.fr');
  });

  it('laisse le rôle indéfini quand la colonne est vide', () => {
    const ligne = correspondantCsvSchema.parse({
      type: 'dreal',
      region_code: '53',
      email: 'correspondant@developpement-durable.gouv.fr',
      role: '',
    });
    expect(ligne.role).toBeUndefined();
  });

  it('refuse une adresse invalide', () => {
    expect(
      correspondantCsvSchema.safeParse({
        type: 'dreal',
        region_code: '53',
        email: 'pas-une-adresse',
      }).success
    ).toBe(false);
  });
});

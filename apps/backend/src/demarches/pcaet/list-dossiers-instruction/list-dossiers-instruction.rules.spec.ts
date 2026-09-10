import {
  DemarchePcaetObligationEnum,
  PcaetStatutInstructionEnum,
  STATUTS_INSTRUCTION_PAR_DEFAUT,
} from '@tet/domain/demarches';
import { describe, expect, it } from 'vitest';
import type { DossierInstructionLigne } from './list-dossiers-instruction.output';
import { estRetenue, trierDossiers } from './list-dossiers-instruction.rules';

const ligne = (
  attributs: Partial<DossierInstructionLigne> & { nom?: string } = {}
): DossierInstructionLigne => {
  const { nom = 'Agglo test', ...reste } = attributs;
  return {
    demarcheId: 1,
    demandeAvisId: 1,
    demarcheTitre: 'PCAET',
    demarcheStatus: 'transmis_pour_avis',
    launchedAt: null,
    avisDeadlineAt: null,
    transmittedAt: null,
    collectivite: {
      id: 1,
      nom,
      departementCode: '54',
      regionCode: '44',
      regionLibelle: 'Grand Est',
    },
    contacts: [],
    deposeAvis: true,
    statut: PcaetStatutInstructionEnum.EN_INSTRUCTION,
    obligation: DemarchePcaetObligationEnum.OBLIGATOIRE,
    obligationSource: 'demarche',
    nbAvisValides: 0,
    nbAvisBrouillons: 0,
    ...reste,
  };
};

/** Les filtres omis : le cas d'un appel qui ne demande rien. */
const AUCUN_FILTRE = {
  statuts: [...STATUTS_INSTRUCTION_PAR_DEFAUT],
  obligations: undefined,
  regionCodes: undefined,
  recherche: undefined,
};

describe('estRetenue', () => {
  it('retient les statuts demandés et écarte les autres', () => {
    const filtres = {
      ...AUCUN_FILTRE,
      statuts: [PcaetStatutInstructionEnum.INSTRUIT],
    };

    expect(
      estRetenue(
        ligne({ statut: PcaetStatutInstructionEnum.INSTRUIT }),
        filtres
      )
    ).toBe(true);
    expect(
      estRetenue(
        ligne({ statut: PcaetStatutInstructionEnum.EN_INSTRUCTION }),
        filtres
      )
    ).toBe(false);
  });

  /**
   * Les trois listes vides disent la même chose, et c'est ce que veut dire
   * « Désélectionner les options » : aucun filtre, tout passe. Une liste vide
   * lue comme un filtre viderait l'écran sans que rien ne l'explique.
   */
  it('ne filtre rien sur une liste vide, quel que soit le champ', () => {
    const dossier = ligne({
      statut: PcaetStatutInstructionEnum.AUCUN_DEPOT,
      obligation: null,
      obligationSource: null,
      collectivite: { ...ligne().collectivite, regionCode: '76' },
    });

    expect(
      estRetenue(dossier, {
        statuts: [],
        obligations: [],
        regionCodes: [],
        recherche: undefined,
      })
    ).toBe(true);
  });

  it('filtre par obligation', () => {
    const filtres = {
      ...AUCUN_FILTRE,
      obligations: [DemarchePcaetObligationEnum.VOLONTAIRE],
    };

    expect(
      estRetenue(
        ligne({ obligation: DemarchePcaetObligationEnum.VOLONTAIRE }),
        filtres
      )
    ).toBe(true);
    expect(
      estRetenue(
        ligne({ obligation: DemarchePcaetObligationEnum.OBLIGATOIRE }),
        filtres
      )
    ).toBe(false);
  });

  /**
   * Une ligne dont l'obligation reste inconnue — population absente, nature qui
   * ne porte pas de PCAET — ne peut affirmer ni l'une ni l'autre : elle sort dès
   * qu'un filtre est posé, et reste tant qu'il ne l'est pas.
   */
  it('écarte une obligation inconnue dès qu’un filtre d’obligation est posé', () => {
    const sansObligation = ligne({ obligation: null, obligationSource: null });

    expect(
      estRetenue(sansObligation, {
        ...AUCUN_FILTRE,
        obligations: [DemarchePcaetObligationEnum.OBLIGATOIRE],
      })
    ).toBe(false);
    expect(estRetenue(sansObligation, AUCUN_FILTRE)).toBe(true);
  });

  it('filtre par région, et écarte une collectivité sans région', () => {
    const filtres = { ...AUCUN_FILTRE, regionCodes: ['44'] };

    expect(estRetenue(ligne(), filtres)).toBe(true);
    expect(
      estRetenue(
        ligne({ collectivite: { ...ligne().collectivite, regionCode: '76' } }),
        filtres
      )
    ).toBe(false);
    expect(
      estRetenue(
        ligne({ collectivite: { ...ligne().collectivite, regionCode: null } }),
        filtres
      )
    ).toBe(false);
  });

  it('cherche dans le nom de la collectivité, sans égard à la casse', () => {
    expect(
      estRetenue(ligne({ nom: 'Nancy Métropole' }), {
        ...AUCUN_FILTRE,
        recherche: 'nancy',
      })
    ).toBe(true);
    expect(
      estRetenue(ligne({ nom: 'Nancy Métropole' }), {
        ...AUCUN_FILTRE,
        recherche: 'metz',
      })
    ).toBe(false);
  });
});

describe('trierDossiers', () => {
  const noms = (lignes: DossierInstructionLigne[]) =>
    lignes.map(({ collectivite }) => collectivite.nom);

  it('trie par échéance, et laisse les lignes sans date en dernier dans les deux sens', () => {
    const lignes = [
      ligne({ nom: 'Sans échéance', avisDeadlineAt: null }),
      ligne({ nom: 'Proche', avisDeadlineAt: '2026-01-10T00:00:00.000Z' }),
      ligne({ nom: 'Lointaine', avisDeadlineAt: '2026-06-10T00:00:00.000Z' }),
    ];

    expect(noms(trierDossiers(lignes, 'echeance', 'desc'))).toEqual([
      'Lointaine',
      'Proche',
      'Sans échéance',
    ]);
    expect(noms(trierDossiers(lignes, 'echeance', 'asc'))).toEqual([
      'Proche',
      'Lointaine',
      'Sans échéance',
    ]);
  });

  it('trie par statut dans l’ordre du cycle de vie', () => {
    const lignes = [
      ligne({ nom: 'Adopté', statut: PcaetStatutInstructionEnum.ADOPTE }),
      ligne({
        nom: 'Sans dépôt',
        statut: PcaetStatutInstructionEnum.AUCUN_DEPOT,
      }),
      ligne({
        nom: 'En instruction',
        statut: PcaetStatutInstructionEnum.EN_INSTRUCTION,
      }),
    ];

    expect(noms(trierDossiers(lignes, 'statut', 'asc'))).toEqual([
      'Sans dépôt',
      'En instruction',
      'Adopté',
    ]);
  });

  it('trie par contact, les lignes sans contact en dernier', () => {
    const contact = (nom: string) => [
      { prenom: 'Zoe', nom, email: `${nom}@test.fr` },
    ];
    const lignes = [
      ligne({ nom: 'Sans contact', contacts: [] }),
      ligne({ nom: 'Second', contacts: contact('Martin') }),
      ligne({ nom: 'Premier', contacts: contact('Bernard') }),
    ];

    expect(noms(trierDossiers(lignes, 'contact', 'asc'))).toEqual([
      'Premier',
      'Second',
      'Sans contact',
    ]);
  });

  it('départage deux lignes équivalentes par le nom de la collectivité', () => {
    const lignes = [
      ligne({ nom: 'Zitrone Agglo' }),
      ligne({ nom: 'Abricot Communaute' }),
    ];

    expect(noms(trierDossiers(lignes, 'echeance', 'desc'))).toEqual([
      'Abricot Communaute',
      'Zitrone Agglo',
    ]);
  });

  it('ne touche pas au tableau reçu', () => {
    const lignes = [ligne({ nom: 'Zitrone' }), ligne({ nom: 'Abricot' })];
    trierDossiers(lignes, 'collectivite', 'asc');

    expect(noms(lignes)).toEqual(['Zitrone', 'Abricot']);
  });
});

import {
  CollectivitePcaetObligationEnum,
  PcaetStatutInstructionEnum,
  STATUTS_INSTRUCTION_PAR_DEFAUT,
} from '@tet/domain/demarches';
import { describe, expect, it } from 'vitest';
import type { DossierInstructionLigne } from './list-dossiers-instruction.output';
import {
  estRetenue,
  filtrerLigne,
  listerDepartements,
  trierDossiers,
} from './list-dossiers-instruction.rules';

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
    dateSaisine: null,
    peutModifierDateSaisine: false,
    adoptedAt: null,
    collectivite: {
      id: 1,
      nom,
      departementCode: '54',
      departementLibelle: 'Meurthe-et-Moselle',
      regionCode: '44',
      regionLibelle: 'Grand Est',
    },
    pilotes: [],
    deposeAvis: true,
    statut: PcaetStatutInstructionEnum.EN_INSTRUCTION,
    obligation: CollectivitePcaetObligationEnum.OBLIGATOIRE,
    obligationSource: 'demarche',
    isScotAec: false,
    nbAvisValides: 0,
    nbAvisBrouillons: 0,
    typePorteurSupra: null,
    collectivitesCouvertes: [],
    ...reste,
  };
};

/** Les filtres omis : le cas d'un appel qui ne demande rien. */
const AUCUN_FILTRE = {
  statuts: [...STATUTS_INSTRUCTION_PAR_DEFAUT],
  obligations: undefined,
  regionCodes: undefined,
  departementCodes: undefined,
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
        departementCodes: [],
        recherche: undefined,
      })
    ).toBe(true);
  });

  it('filtre par obligation', () => {
    const filtres = {
      ...AUCUN_FILTRE,
      obligations: [CollectivitePcaetObligationEnum.VOLONTAIRE],
    };

    expect(
      estRetenue(
        ligne({ obligation: CollectivitePcaetObligationEnum.VOLONTAIRE }),
        filtres
      )
    ).toBe(true);
    expect(
      estRetenue(
        ligne({ obligation: CollectivitePcaetObligationEnum.OBLIGATOIRE }),
        filtres
      )
    ).toBe(false);
    expect(
      estRetenue(
        ligne({
          obligation: CollectivitePcaetObligationEnum.NON_OBLIGE,
          obligationSource: 'assujettissement',
        }),
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
        obligations: [CollectivitePcaetObligationEnum.OBLIGATOIRE],
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

  it('filtre par département, et écarte une collectivité sans département', () => {
    const filtres = { ...AUCUN_FILTRE, departementCodes: ['54', '57'] };

    expect(estRetenue(ligne(), filtres)).toBe(true);
    expect(
      estRetenue(
        ligne({
          collectivite: { ...ligne().collectivite, departementCode: '88' },
        }),
        filtres
      )
    ).toBe(false);
    expect(
      estRetenue(
        ligne({
          collectivite: { ...ligne().collectivite, departementCode: null },
        }),
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

describe('listerDepartements', () => {
  it('rend chaque département une fois, par code, sans les collectivités qui n’en ont pas', () => {
    const avec = (departementCode: string | null, departementLibelle: string) =>
      ligne({
        collectivite: {
          ...ligne().collectivite,
          departementCode,
          departementLibelle,
        },
      });

    expect(
      listerDepartements([
        avec('71', 'Saône-et-Loire'),
        avec('01', 'Ain'),
        avec('71', 'Saône-et-Loire'),
        avec(null, ''),
      ])
    ).toEqual([
      { code: '01', libelle: 'Ain' },
      { code: '71', libelle: 'Saône-et-Loire' },
    ]);
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

  it('fait remonter les dossiers en instruction, le plus pressant en tête, quel que soit le sens', () => {
    const lignes = [
      ligne({
        nom: 'Adopté récent',
        statut: PcaetStatutInstructionEnum.ADOPTE,
        avisDeadlineAt: '2026-09-10T00:00:00.000Z',
      }),
      ligne({
        nom: 'Sans dépôt',
        statut: PcaetStatutInstructionEnum.AUCUN_DEPOT,
        avisDeadlineAt: null,
      }),
      ligne({
        nom: 'À instruire plus tard',
        avisDeadlineAt: '2026-06-10T00:00:00.000Z',
      }),
      ligne({
        nom: 'Adopté ancien',
        statut: PcaetStatutInstructionEnum.ADOPTE,
        avisDeadlineAt: '2026-02-10T00:00:00.000Z',
      }),
      ligne({
        nom: 'À instruire bientôt',
        avisDeadlineAt: '2026-01-10T00:00:00.000Z',
      }),
    ];
    const attendu = [
      'À instruire bientôt',
      'À instruire plus tard',
      'Adopté récent',
      'Adopté ancien',
      'Sans dépôt',
    ];

    expect(noms(trierDossiers(lignes, 'priorite', 'desc'))).toEqual(attendu);
    expect(noms(trierDossiers(lignes, 'priorite', 'asc'))).toEqual(attendu);
  });

  it.each([
    ['dateSaisine', 'dateSaisine'],
    ['dateAdoption', 'adoptedAt'],
  ] as const)(
    'trie par %s, et laisse les lignes sans date en dernier dans les deux sens',
    (sort, champ) => {
      const lignes = [
        ligne({ nom: 'Sans date', [champ]: null }),
        ligne({ nom: 'Ancienne', [champ]: '2024-01-01' }),
        ligne({ nom: 'Récente', [champ]: '2026-01-01' }),
      ];

      expect(noms(trierDossiers(lignes, sort, 'asc'))).toEqual([
        'Ancienne',
        'Récente',
        'Sans date',
      ]);
      expect(noms(trierDossiers(lignes, sort, 'desc'))).toEqual([
        'Récente',
        'Ancienne',
        'Sans date',
      ]);
    }
  );

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

  it('trie par premier pilote, les lignes sans pilote en dernier', () => {
    const pilote = (nom: string) => [{ nom, email: null }];
    const lignes = [
      ligne({ nom: 'Sans pilote', pilotes: [] }),
      ligne({ nom: 'Second', pilotes: pilote('Zoe Martin') }),
      ligne({ nom: 'Premier', pilotes: pilote('Alice Bernard') }),
    ];

    expect(noms(trierDossiers(lignes, 'pilote', 'asc'))).toEqual([
      'Premier',
      'Second',
      'Sans pilote',
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

describe('filtrerLigne — le dépôt d’un Supra et ses EPCI couverts', () => {
  const couverte = (
    nom: string,
    departementCode: string,
    obligation: DossierInstructionLigne['obligation']
  ) => ({
    id: nom.length,
    nom,
    departementCode,
    departementLibelle: departementCode,
    regionCode: '76',
    regionLibelle: 'Occitanie',
    obligation,
  });

  const groupe = ligne({
    nom: 'PETR du Pays Lauragais',
    obligation: CollectivitePcaetObligationEnum.VOLONTAIRE,
    typePorteurSupra: 'petr',
    collectivitesCouvertes: [
      couverte(
        'CC Castelnaudary',
        '11',
        CollectivitePcaetObligationEnum.OBLIGATOIRE
      ),
      couverte('CC Revel', '31', CollectivitePcaetObligationEnum.VOLONTAIRE),
    ],
  });

  it('garde le groupe si une seule sous-ligne passe, et seulement elle', () => {
    const retenue = filtrerLigne(groupe, {
      ...AUCUN_FILTRE,
      departementCodes: ['31'],
    });
    expect(retenue?.collectivitesCouvertes.map(({ nom }) => nom)).toEqual([
      'CC Revel',
    ]);
  });

  it('juge l’obligation de chaque EPCI, pas celle du porteur', () => {
    const retenue = filtrerLigne(groupe, {
      ...AUCUN_FILTRE,
      obligations: [CollectivitePcaetObligationEnum.OBLIGATOIRE],
    });
    expect(retenue?.collectivitesCouvertes.map(({ nom }) => nom)).toEqual([
      'CC Castelnaudary',
    ]);
  });

  it('écarte le groupe quand ni le porteur ni ses EPCI ne passent', () => {
    expect(
      filtrerLigne(groupe, { ...AUCUN_FILTRE, departementCodes: ['09'] })
    ).toBeNull();
  });

  it('une recherche qui nomme le porteur garde toutes ses sous-lignes', () => {
    expect(
      filtrerLigne(groupe, { ...AUCUN_FILTRE, recherche: 'lauragais' })
        ?.collectivitesCouvertes
    ).toHaveLength(2);
  });

  it('une recherche qui nomme un EPCI ne garde que lui', () => {
    expect(
      filtrerLigne(groupe, {
        ...AUCUN_FILTRE,
        recherche: 'revel',
      })?.collectivitesCouvertes.map(({ nom }) => nom)
    ).toEqual(['CC Revel']);
  });

  it('liste aussi les départements des EPCI couverts', () => {
    expect(listerDepartements([groupe]).map(({ code }) => code)).toEqual([
      '11',
      '31',
      '54',
    ]);
  });
});

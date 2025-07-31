import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Test } from '@nestjs/testing';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import {
  ListIndicateurRequestQueryOptions,
  ListIndicateursRequestFilters,
} from './list-indicateurs.request';
import ListIndicateursService from './list-indicateurs.service';

describe('IndicateurFiltreService', () => {
  let indicateurFiltreService: ListIndicateursService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ListIndicateursService],
    })
      .useMocker((token) => {
        if (
          token === DatabaseService ||
          token === PermissionService ||
          token === CollectivitesService
        ) {
          return {};
        }
      })
      .compile();

    indicateurFiltreService = moduleRef.get(ListIndicateursService);
  });

  describe('getQueryString', () => {
    it('Test la syntaxe de la requête sans filtres', async () => {
      const filtres: ListIndicateursRequestFilters = {};
      const toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).toContain('WITH groupements AS');
      expect(toCheck).toContain('indicateurs AS');
      expect(toCheck).toContain('OR collectivite_id = 1');
      expect(toCheck).toContain('OR groupement_id IN');
      expect(toCheck).toContain('SELECT i.id');
      expect(toCheck).toContain('FROM indicateurs i');
      expect(toCheck).toContain('FROM indicateur_valeur');
      expect(toCheck).toContain('LEFT JOIN indicateur_groupe ig_parent');
      expect(toCheck).toContain('LEFT JOIN indicateur_groupe ig_enfant');
    });
    it('Test la syntaxe de la requête avec un filtre sur les indicateurs perso', async () => {
      const filtres: ListIndicateursRequestFilters = {
        estPerso: true,
      };
      const toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).not.toContain('OR groupement_id IN');
    });
    it('Test la syntaxe de la requête avec un filtre sur les catégories', async () => {
      const filtres: ListIndicateursRequestFilters = {
        categorieNoms: ['cae', 'clef'],
      };
      const toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).toContain('ct.nom AS "categorieNom"');
      expect(toCheck).toContain('FROM categorie_tag ct');
    });
    it('Test la syntaxe de la requête avec un filtre sur les catégories et perso', async () => {
      const filtres: ListIndicateursRequestFilters = {
        categorieNoms: ['cae', 'clef'],
        estPerso: true,
      };
      const toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).toContain('ct.nom AS "categorieNom"');
      expect(toCheck).toContain('FROM categorie_tag ct');
      expect(toCheck).not.toContain('OR groupement_id IN'); // Filtre perso sur la jointure des catégories
    });
    it('Test la syntaxe de la requête avec un filtre sur les plans', async () => {
      const filtres: ListIndicateursRequestFilters = {
        planActionIds: [1, 2],
      };
      const toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).toContain('plan.id AS "planId"');
      expect(toCheck).toContain('LEFT JOIN axe plan');
    });
    it('Test la syntaxe de la requête avec un filtre sur les fiches', async () => {
      const filtres: ListIndicateursRequestFilters = {
        ficheActionIds: [1, 2],
      };
      const toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).toContain('fa.id AS "ficheId"');
      expect(toCheck).toContain('FROM fiche_action fa');
    });
    it('Test la syntaxe de la requête avec un filtre sur les axes', async () => {
      const filtres: ListIndicateursRequestFilters = {
        fichesNonClassees: true,
      };
      const toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).toContain('fa.id AS "ficheId"');
      expect(toCheck).toContain('FROM fiche_action fa');
      expect(toCheck).toContain('faa.axe_id AS "axeId"');
      expect(toCheck).toContain('LEFT JOIN fiche_action_axe faa');
    });
    it('Test la syntaxe de la requête avec un filtre sur les services', async () => {
      const filtres: ListIndicateursRequestFilters = {
        servicePiloteIds: [1, 2],
      };
      const toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).toContain('st.id AS "serviceId"');
      expect(toCheck).toContain('LEFT JOIN service_tag st');
    });
    it('Test la syntaxe de la requête avec un filtre sur les thématiques', async () => {
      const filtres: ListIndicateursRequestFilters = {
        thematiqueIds: [1, 2],
      };
      const toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).toContain('it.thematique_id AS "thematiqueId"');
      expect(toCheck).toContain('LEFT JOIN indicateur_thematique it');
    });
    it('Test la syntaxe de la requête avec un filtre sur les pilotes', async () => {
      let filtres: ListIndicateursRequestFilters = {
        utilisateurPiloteIds: ['test', 'test2'],
      };
      let toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).toContain('ip.user_id AS "piloteUserId"');
      expect(toCheck).toContain('LEFT JOIN indicateur_pilote ip');

      filtres = {
        personnePiloteIds: [1, 2],
      };
      toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).toContain('ip.tag_id AS "piloteTagId"');
      expect(toCheck).toContain('LEFT JOIN indicateur_pilote ip');
    });
    it('Test la syntaxe de la requête avec un filtre sur la confidentialié', async () => {
      const filtres: ListIndicateursRequestFilters = {
        estConfidentiel: true,
      };
      const toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).toContain('c.confidentiel AS confidentiel');
      expect(toCheck).toContain('LEFT JOIN indicateur_collectivite c');
    });
    it('Test la syntaxe de la requête avec un filtre sur "favoris"', async () => {
      const filtres: ListIndicateursRequestFilters = {
        estFavorisCollectivite: true,
      };
      const toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).toContain('c.favoris AS favoris');
      expect(toCheck).toContain('LEFT JOIN indicateur_collectivite c');
    });
    it('Test la syntaxe de la requête avec un filtre sur les actions', async () => {
      const filtres: ListIndicateursRequestFilters = {
        actionId: 'eci_2.1',
      };
      const toCheck = indicateurFiltreService.getQueryString(1, filtres);
      expect(toCheck).toContain('ia.action_id AS "actionId"');
      expect(toCheck).toContain('LEFT JOIN indicateur_action ia');
    });
  });
  describe('groupDetailsIndicateurs', () => {
    const datas = [
      {
        id: 1,
        identifiantReferentiel: null,
        titre: null,
        description: null,
        collectiviteId: null,
        groupementId: null,
        parent: null,
        enfant: 2,
        participationScore: false,
        confidentiel: true,
        favoris: false,
        valeurId: 1,
        metadonneeId: null,
        categorieNom: 'eci',
        planId: 2,
        ficheId: 1,
        axeId: 1,
        serviceId: null,
        thematiqueId: null,
        piloteUserId: 'userid',
        piloteTagId: null,
        actionId: 'eci_1',
      },
      {
        id: 1,
        identifiantReferentiel: null,
        titre: null,
        description: null,
        collectiviteId: null,
        groupementId: null,
        parent: null,
        enfant: 3,
        participationScore: false,
        confidentiel: false,
        favoris: false,
        valeurId: 2,
        metadonneeId: null,
        categorieNom: null,
        planId: null,
        ficheId: null,
        axeId: null,
        serviceId: 1,
        thematiqueId: 1,
        piloteUserId: null,
        piloteTagId: null,
        actionId: null,
      },
      {
        id: 2,
        identifiantReferentiel: null,
        titre: null,
        description: null,
        collectiviteId: null,
        groupementId: null,
        parent: 1,
        enfant: null,
        participationScore: false,
        confidentiel: false,
        favoris: true,
        valeurId: 2,
        metadonneeId: 1,
        categorieNom: 'cae',
        planId: 1,
        ficheId: 1,
        axeId: 1,
        serviceId: null,
        thematiqueId: null,
        piloteUserId: null,
        piloteTagId: 1,
        actionId: null,
      },
      {
        id: 2,
        identifiantReferentiel: null,
        titre: null,
        description: null,
        collectiviteId: null,
        groupementId: null,
        parent: 1,
        enfant: null,
        participationScore: false,
        confidentiel: false,
        favoris: true,
        valeurId: null,
        metadonneeId: null,
        categorieNom: 'clef',
        planId: null,
        ficheId: 4,
        axeId: null,
        serviceId: null,
        thematiqueId: null,
        piloteUserId: null,
        piloteTagId: null,
        actionId: null,
      },
      {
        id: 3,
        identifiantReferentiel: null,
        titre: null,
        description: null,
        collectiviteId: null,
        groupementId: null,
        parent: 1,
        enfant: null,
        participationScore: true,
        confidentiel: false,
        favoris: true,
        valeurId: null,
        metadonneeId: null,
        categorieNom: null,
        planId: null,
        ficheId: null,
        axeId: null,
        serviceId: 2,
        thematiqueId: 3,
        piloteUserId: null,
        piloteTagId: 2,
        actionId: null,
      },
      {
        id: 4,
        identifiantReferentiel: null,
        titre: null,
        description: null,
        collectiviteId: null,
        groupementId: null,
        parent: null,
        enfant: null,
        participationScore: true,
        confidentiel: false,
        favoris: true,
        valeurId: null,
        metadonneeId: null,
        categorieNom: null,
        planId: null,
        ficheId: null,
        axeId: null,
        serviceId: null,
        thematiqueId: null,
        piloteUserId: null,
        piloteTagId: null,
        actionId: null,
      },
    ];
    it('Test le groupement sans le groupement des enfants dans les parents', async () => {
      const result = indicateurFiltreService.groupDetailsIndicateurs(
        datas,
        true
      );
      const toCheck = indicateurFiltreService.applyFilters(result, {}, true);
      expect(toCheck.length).toEqual(4);
      expect(toCheck.filter((item) => item.id === 1)[0]).toEqual({
        id: 1,
        identifiantReferentiel: null,
        titre: null,
        description: null,
        collectiviteId: null,
        groupementId: null,
        parents: [],
        enfants: [2, 3],
        participationScore: false,
        confidentiel: true,
        favoris: false,
        hasFichesNonClassees: false,
        isCompleted: true,
        hasOpenData: false,
        categorieNoms: ['eci'],
        planIds: [2],
        ficheIds: [1],
        serviceIds: [1],
        thematiqueIds: [1],
        piloteUserIds: ['userid'],
        piloteTagIds: [],
        actionIds: ['eci_1'],
      });
    });
    it('Test le groupement avec le groupement des enfants dans les parents', async () => {
      const result = indicateurFiltreService.groupDetailsIndicateurs(
        datas,
        false
      );
      const toCheck = indicateurFiltreService.applyFilters(result, {}, false);
      expect(toCheck.length).toEqual(2);
      expect(toCheck.filter((item) => item.id === 1)[0]).toEqual({
        id: 1,
        identifiantReferentiel: null,
        titre: null,
        description: null,
        collectiviteId: null,
        groupementId: null,
        parents: [],
        enfants: [2, 3],
        participationScore: true,
        confidentiel: true,
        favoris: true,
        hasFichesNonClassees: true,
        isCompleted: true,
        hasOpenData: true,
        categorieNoms: ['eci', 'cae', 'clef'],
        planIds: [2, 1],
        ficheIds: [1, 4],
        serviceIds: [1, 2],
        thematiqueIds: [1, 3],
        piloteUserIds: ['userid'],
        piloteTagIds: [1, 2],
        actionIds: ['eci_1'],
      });
    });
  });
  describe('applyFilters', () => {
    const datas = [
      {
        id: 1,
        identifiantReferentiel: 'eci_1',
        titre: 'titre',
        description: 'description',
        collectiviteId: null,
        groupementId: null,
        parents: [],
        enfants: [],
        participationScore: true,
        confidentiel: false,
        favoris: false,
        hasFichesNonClassees: false,
        isCompleted: true,
        hasOpenData: false,
        categorieNoms: ['eci', 'cae'],
        planIds: [1, 2],
        ficheIds: [1],
        serviceIds: [3],
        thematiqueIds: [1, 3],
        piloteUserIds: ['userid'],
        piloteTagIds: [1],
        actionIds: ['eci_1'],
      },
      {
        id: 2,
        identifiantReferentiel: 'eci_2',
        titre: 'nom',
        description: 'description clef',
        collectiviteId: null,
        groupementId: null,
        parents: [1],
        enfants: [],
        participationScore: false,
        confidentiel: true,
        favoris: false,
        hasFichesNonClassees: true,
        isCompleted: false,
        hasOpenData: true,
        categorieNoms: ['eci'],
        planIds: [3],
        ficheIds: [2],
        serviceIds: [1],
        thematiqueIds: [2],
        piloteUserIds: ['userid', 'userid2'],
        piloteTagIds: [2],
        actionIds: ['eci_2'],
      },
      {
        id: 3,
        identifiantReferentiel: null,
        titre: 'titre',
        description: 'description',
        collectiviteId: null,
        groupementId: null,
        parents: [],
        enfants: [],
        participationScore: false,
        confidentiel: false,
        favoris: true,
        hasFichesNonClassees: false,
        isCompleted: false,
        hasOpenData: false,
        categorieNoms: ['crte'],
        planIds: [],
        ficheIds: [],
        serviceIds: [1],
        thematiqueIds: [1],
        piloteUserIds: [],
        piloteTagIds: [2],
        actionIds: [],
      },
      {
        id: 4,
        identifiantReferentiel: null,
        titre: 'titre clef',
        description: 'description',
        collectiviteId: null,
        groupementId: null,
        parents: [],
        enfants: [],
        participationScore: false,
        confidentiel: false,
        favoris: false,
        hasFichesNonClassees: false,
        isCompleted: true,
        hasOpenData: true,
        categorieNoms: ['eci', 'cae'],
        planIds: [3],
        ficheIds: [2],
        serviceIds: [3],
        thematiqueIds: [3],
        piloteUserIds: ['userid'],
        piloteTagIds: [],
        actionIds: ['eci_2'],
      },
    ];
    it('Test sans aucun filtre', async () => {
      const filtres: ListIndicateursRequestFilters = {};
      const toCheck = indicateurFiltreService.applyFilters(
        datas,
        filtres,
        true
      );
      expect(toCheck.length).toEqual(4);
    });
    describe('Test des filtres booléens', async () => {
      it('participationScore', async () => {
        const filtres: ListIndicateursRequestFilters = {
          participationScore: true,
        };
        const toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(1);
      });
      it('estComplet', async () => {
        let filtres: ListIndicateursRequestFilters = {
          estComplet: true,
        };
        let toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(2);
        filtres = {
          estComplet: false,
        };
        toCheck = indicateurFiltreService.applyFilters(datas, filtres, true);
        expect(toCheck.length).toEqual(2);
      });
      it('estConfidentiel', async () => {
        const filtres: ListIndicateursRequestFilters = {
          estConfidentiel: true,
        };
        const toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(1);
      });
      it('estFavorisCollectivite', async () => {
        const filtres: ListIndicateursRequestFilters = {
          estFavorisCollectivite: true,
        };
        const toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(1);
      });
      it('fichesNonClassees', async () => {
        const filtres: ListIndicateursRequestFilters = {
          fichesNonClassees: true,
        };
        const toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(1);
      });
      it('hasOpenData', async () => {
        const filtres: ListIndicateursRequestFilters = {
          hasOpenData: true,
        };
        const toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(2);
      });
      it('withChildren', async () => {
        let filtres: ListIndicateursRequestFilters = {
          withChildren: true,
        };
        let toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(4);
        filtres = {
          withChildren: false,
        };
        toCheck = indicateurFiltreService.applyFilters(datas, filtres, false);
        expect(toCheck.length).toEqual(3);
      });
    });
    describe('Test des filtres via éléments liés', async () => {
      it('actionId', async () => {
        const filtres: ListIndicateursRequestFilters = {
          actionId: 'eci_2',
        };
        const toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(2);
      });
      it('categorieNoms', async () => {
        const filtres: ListIndicateursRequestFilters = {
          categorieNoms: ['eci'],
        };
        const toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(3);
      });
      it('thematiqueIds', async () => {
        const filtres: ListIndicateursRequestFilters = {
          thematiqueIds: [1],
        };
        const toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(2);
      });
      it('planActionIds', async () => {
        const filtres: ListIndicateursRequestFilters = {
          planActionIds: [1, 3],
        };
        const toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(3);
      });
      it('utilisateurPiloteIds', async () => {
        const filtres: ListIndicateursRequestFilters = {
          utilisateurPiloteIds: ['userid2'],
        };
        const toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(1);
      });
      it('personnePiloteIds', async () => {
        const filtres: ListIndicateursRequestFilters = {
          personnePiloteIds: [1, 2],
        };
        const toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(3);
      });
      it('servicePiloteIds', async () => {
        const filtres: ListIndicateursRequestFilters = {
          servicePiloteIds: [1],
        };
        const toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(2);
      });
      it('ficheActionIds', async () => {
        const filtres: ListIndicateursRequestFilters = {
          ficheActionIds: [1],
        };
        const toCheck = indicateurFiltreService.applyFilters(
          datas,
          filtres,
          true
        );
        expect(toCheck.length).toEqual(1);
      });
    });
    it('Test le filtre via la recherche textuelle', async () => {
      const filtres: ListIndicateursRequestFilters = {
        text: 'clef',
      };
      const toCheck = indicateurFiltreService.applyFilters(
        datas,
        filtres,
        true
      );
      expect(toCheck.length).toEqual(2);
    });
    it('Test le filtre via la recherche par identifiant', async () => {
      const filtres: ListIndicateursRequestFilters = {
        text: '#eci_1',
      };
      const toCheck = indicateurFiltreService.applyFilters(
        datas,
        filtres,
        true
      );
      expect(toCheck.length).toEqual(1);
    });
    it('Test le filtre indicateurIds', async () => {
      const filtres: ListIndicateursRequestFilters = {
        indicateurIds: [1, 2],
      };
      const toCheck = indicateurFiltreService.applyFilters(
        datas,
        filtres,
        true
      );
      expect(toCheck.length).toEqual(2);
    });
  });
  describe('applySorts', () => {
    const ind1 = {
      id: 1,
      identifiantReferentiel: '',
      titre: 'a',
      description: null,
      collectiviteId: null,
      groupementId: null,
      parents: [],
      enfants: [],
      participationScore: null,
      confidentiel: null,
      favoris: null,
      hasFichesNonClassees: true,
      isCompleted: true,
      hasOpenData: true,
      categorieNoms: [],
      planIds: [],
      ficheIds: [],
      serviceIds: [],
      thematiqueIds: [],
      piloteUserIds: [],
      piloteTagIds: [],
      actionIds: [],
    };
    const ind2 = {
      id: 1,
      identifiantReferentiel: '',
      titre: 'z',
      description: null,
      collectiviteId: null,
      groupementId: null,
      parents: [],
      enfants: [],
      participationScore: null,
      confidentiel: null,
      favoris: null,
      hasFichesNonClassees: true,
      isCompleted: false,
      hasOpenData: true,
      categorieNoms: [],
      planIds: [],
      ficheIds: [],
      serviceIds: [],
      thematiqueIds: [],
      piloteUserIds: [],
      piloteTagIds: [],
      actionIds: [],
    };
    const ind3 = {
      id: 1,
      identifiantReferentiel: '',
      titre: 'J',
      description: null,
      collectiviteId: null,
      groupementId: null,
      parents: [],
      enfants: [],
      participationScore: null,
      confidentiel: null,
      favoris: null,
      hasFichesNonClassees: true,
      isCompleted: true,
      hasOpenData: true,
      categorieNoms: [],
      planIds: [],
      ficheIds: [],
      serviceIds: [],
      thematiqueIds: [],
      piloteUserIds: [],
      piloteTagIds: [],
      actionIds: [],
    };
    it('Applique le tri alphabétique par défaut', async () => {
      const queryOptions: ListIndicateurRequestQueryOptions = {
        page: 1,
        limit: 10,
        sort: [],
      };
      const toCheck = indicateurFiltreService.applySorts(
        [ind1, ind2, ind3],
        queryOptions
      );
      expect(toCheck).toEqual([ind1, ind3, ind2]);
    });
    it('Applique le tri par complétude', async () => {
      const queryOptions: ListIndicateurRequestQueryOptions = {
        page: 1,
        limit: 10,
        sort: [
          {
            field: 'estComplet',
            direction: 'asc',
          },
        ],
      };
      const toCheck = indicateurFiltreService.applySorts(
        [ind1, ind2, ind3],
        queryOptions
      );
      expect(toCheck).toEqual([ind1, ind3, ind2]);
    });
  });
});

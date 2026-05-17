import { Test } from '@nestjs/testing';
import { ListPersonnalisationQuestionsRepository } from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.repository';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import PersonnalisationsExpressionService from './personnalisations-expression.service';
import { PersonnalisationQuestionsActivesService } from './personnalisation-questions-actives.service';

describe('PersonnalisationQuestionsActivesService', () => {
  let service: PersonnalisationQuestionsActivesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PersonnalisationQuestionsActivesService,
        {
          provide: ListPersonnalisationQuestionsRepository,
          useValue: {},
        },
        {
          provide: PersonnalisationsExpressionService,
          useValue: {},
        },
        {
          provide: CollectivitesService,
          useValue: {},
        },
      ],
    }).compile();

    service = moduleRef.get(PersonnalisationQuestionsActivesService);
  });

  describe('filterReponsesForActiveQuestionIds', () => {
    test('ne conserve que les réponses des questions actives', () => {
      const reponses = {
        q_active: true,
        q_inactive: false,
        q_autre: 'choix-1',
      };

      expect(
        service.filterReponsesForActiveQuestionIds(reponses, [
          'q_active',
          'q_autre',
        ])
      ).toEqual({
        q_active: true,
        q_autre: 'choix-1',
      });
    });

    test('retourne un objet vide si aucune question active', () => {
      const reponses = { q1: true, q2: false };

      expect(service.filterReponsesForActiveQuestionIds(reponses, [])).toEqual(
        {}
      );
    });

    test('retourne un objet vide si aucune réponse ne correspond aux ids actifs', () => {
      expect(
        service.filterReponsesForActiveQuestionIds(
          { q_hors_perimetre: true },
          ['q_active']
        )
      ).toEqual({});
    });
  });
});

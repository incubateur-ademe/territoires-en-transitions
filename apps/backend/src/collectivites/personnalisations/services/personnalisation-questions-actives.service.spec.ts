import { Test } from '@nestjs/testing';
import { ListPersonnalisationQuestionsRepository } from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.repository';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { QuestionWithChoices } from '@tet/domain/collectivites';
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
        service.filterReponsesForActiveQuestionIds({ q_hors_perimetre: true }, [
          'q_active',
        ])
      ).toEqual({});
    });
  });
  describe('resolveActiveQuestions', () => {
    test('exclut une question dont exprVisible est invalide sans bloquer les autres', async () => {
      const questions = [
        { id: 'q_ok', exprVisible: null },
        { id: 'q_invalide', exprVisible: 'Si reponse(' },
        { id: 'q_enfant', exprVisible: 'Si reponse(q_ok, OUI) alors VRAI' },
      ] as QuestionWithChoices[];

      const moduleRef = await Test.createTestingModule({
        providers: [
          PersonnalisationQuestionsActivesService,
          PersonnalisationsExpressionService,
          {
            provide: ListPersonnalisationQuestionsRepository,
            useValue: { listQuestionsWithChoices: async () => questions },
          },
          {
            provide: CollectivitesService,
            useValue: {
              getCollectiviteAvecType: async () => ({ type: 'commune' }),
            },
          },
        ],
      }).compile();

      const result = await moduleRef
        .get(PersonnalisationQuestionsActivesService)
        .resolveActiveQuestions({
          enabledReferentiels: [],
          filters: {},
          reponses: { q_ok: true, q_invalide: true, q_enfant: true },
          collectiviteId: 1,
        });

      expect(result.questions.map((q) => q.id)).toEqual(['q_ok', 'q_enfant']);
      expect(result.reponsesQuestionsActives).toEqual({
        q_ok: true,
        q_enfant: true,
      });
    });
  });
});

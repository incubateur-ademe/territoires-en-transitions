import ListPersonnalisationQuestionsService from '@/backend/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import { DatabaseService } from '@/backend/utils';
import ConfigurationService from '@/backend/utils/config/configuration.service';
import SheetService from '@/backend/utils/google-sheets/sheet.service';
import VersionService from '@/backend/utils/version/version.service';
import { Test } from '@nestjs/testing';
import { QuestionThematique } from '../models/question-thematique.table';
import {
  ImportPersonnalisationChoix,
  ImportPersonnalisationQuestion,
} from './import-personnalisation-question.dto';
import ImportPersonnalisationQuestionService from './import-personnalisation-question.service';

describe('ImportPersonnalisationQuestionService', () => {
  let service: ImportPersonnalisationQuestionService;

  beforeAll(async () => {
    // Create a minimal instance for testing the pure function
    const moduleRef = await Test.createTestingModule({
      providers: [ImportPersonnalisationQuestionService],
    })
      .useMocker((token) => {
        if (
          token === DatabaseService ||
          token === SheetService ||
          token === ConfigurationService ||
          token === ListPersonnalisationQuestionsService ||
          token === VersionService
        ) {
          return {};
        }
      })
      .compile();
    service = moduleRef.get(ImportPersonnalisationQuestionService);
  });

  describe('verifyPersonnalisationQuestionsAndChoix', () => {
    it('should validate successfully with valid questions and choices', () => {
      const thematiques: QuestionThematique[] = [
        {
          id: 'energie',
          nom: 'Énergie',
        },
        {
          id: 'mobilite',
          nom: 'Mobilité',
        },
      ];

      const questions: ImportPersonnalisationQuestion[] = [
        {
          id: 'test_question_1',
          formulation: 'Is this a test question?',
          description: 'Test description',
          type: 'binaire',
          thematiqueId: 'energie',
          ordonnancement: 1,
          typesCollectivitesConcernees: ['commune', 'EPCI'],
        },
        {
          id: 'test_question_2',
          formulation: 'Choose an option',
          description: 'Test choice question',
          type: 'choix',
          thematiqueId: 'mobilite',
          ordonnancement: 2,
          typesCollectivitesConcernees: null,
        },
      ];

      const choix: ImportPersonnalisationChoix[] = [
        {
          id: 'choice_1',
          questionId: 'test_question_2',
          ordonnancement: 1,
          formulation: 'Option 1',
        },
        {
          id: 'choice_2',
          questionId: 'test_question_2',
          ordonnancement: 2,
          formulation: 'Option 2',
        },
      ];

      expect(() =>
        service.verifyPersonnalisationQuestionsAndChoix(
          questions,
          choix,
          thematiques
        )
      ).not.toThrow();
    });

    it('should throw error for duplicate question id', () => {
      const questions: ImportPersonnalisationQuestion[] = [
        {
          id: 'test_question_1',
          formulation: 'Question 1',
          description: 'Description 1',
          type: 'binaire',
          ordonnancement: 1,
          typesCollectivitesConcernees: null,
        },
        {
          id: 'test_question_1',
          formulation: 'Question 1 Duplicate',
          description: 'Description 1 Duplicate',
          type: 'binaire',
          ordonnancement: 2,
          typesCollectivitesConcernees: null,
        },
      ];

      expect(() =>
        service.verifyPersonnalisationQuestionsAndChoix(questions, [], [])
      ).toThrow('Duplicate question id test_question_1');
    });

    it('should throw error for invalid question reference in choice', () => {
      const questions: ImportPersonnalisationQuestion[] = [
        {
          id: 'test_question_1',
          formulation: 'Question 1',
          description: 'Description 1',
          type: 'choix',
          ordonnancement: 1,
          typesCollectivitesConcernees: null,
        },
      ];

      const choix: ImportPersonnalisationChoix[] = [
        {
          id: 'choice_1',
          questionId: 'non_existent_question',
          ordonnancement: 1,
          formulation: 'Option 1',
        },
      ];

      expect(() =>
        service.verifyPersonnalisationQuestionsAndChoix(questions, choix, [])
      ).toThrow(
        'Invalid question reference non_existent_question for choice choice_1'
      );
    });

    it('should throw error for choix question without choices', () => {
      const questions: ImportPersonnalisationQuestion[] = [
        {
          id: 'test_question_1',
          formulation: 'Choose an option',
          description: 'This should have choices',
          type: 'choix',
          ordonnancement: 1,
          typesCollectivitesConcernees: null,
        },
      ];

      expect(() =>
        service.verifyPersonnalisationQuestionsAndChoix(questions, [], [])
      ).toThrow(
        "Question test_question_1 is of type 'choix' but has no choices defined"
      );
    });

    it('should not throw error for binaire or proportion questions without choices', () => {
      const questions: ImportPersonnalisationQuestion[] = [
        {
          id: 'test_question_1',
          formulation: 'Is this true?',
          description: 'Binary question',
          type: 'binaire',
          ordonnancement: 1,
          typesCollectivitesConcernees: null,
        },
        {
          id: 'test_question_2',
          formulation: 'What proportion?',
          description: 'Proportion question',
          type: 'proportion',
          ordonnancement: 2,
          typesCollectivitesConcernees: null,
        },
      ];

      expect(() =>
        service.verifyPersonnalisationQuestionsAndChoix(questions, [], [])
      ).not.toThrow();
    });

    it('should throw error for invalid thematiqueId', () => {
      const thematiques: QuestionThematique[] = [
        {
          id: 'energie',
          nom: 'Énergie',
        },
        {
          id: 'mobilite',
          nom: 'Mobilité',
        },
      ];

      const questions: ImportPersonnalisationQuestion[] = [
        {
          id: 'test_question_1',
          formulation: 'Question with invalid thematique',
          description: 'This has an invalid thematique',
          type: 'binaire',
          thematiqueId: 'invalid_thematique',
          ordonnancement: 1,
          typesCollectivitesConcernees: null,
        },
      ];

      expect(() =>
        service.verifyPersonnalisationQuestionsAndChoix(
          questions,
          [],
          thematiques
        )
      ).toThrow(
        'Invalid thematique reference invalid_thematique for question test_question_1'
      );
    });
  });
});

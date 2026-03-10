import { Test } from '@nestjs/testing';
import ListPersonnalisationQuestionsService from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import PersonnalisationsExpressionService from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import VersionService from '@tet/backend/utils/version/version.service';
import { QuestionThematique } from '@tet/domain/collectivites';
import {
  ImportPersonnalisationChoix,
  ImportPersonnalisationCompetence,
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
          token === VersionService ||
          token === PersonnalisationsExpressionService
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
          thematiques,
          [],
          []
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
        service.verifyPersonnalisationQuestionsAndChoix(
          questions,
          [],
          [],
          [],
          []
        )
      ).toThrow(
        'Duplicate question id test_question_1 (existing: test_question_1)'
      );
    });

    it('should throw error for duplicate question id differing only by case', () => {
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
          id: 'Test_question_1',
          formulation: 'Question 1 autre casse',
          description: 'Description 2',
          type: 'binaire',
          ordonnancement: 2,
          typesCollectivitesConcernees: null,
        },
      ];

      expect(() =>
        service.verifyPersonnalisationQuestionsAndChoix(
          questions,
          [],
          [],
          [],
          []
        )
      ).toThrow(
        'Duplicate question id Test_question_1 (existing: test_question_1)'
      );
    });

    it('should throw error for existing question id differing only by case', () => {
      const questions: ImportPersonnalisationQuestion[] = [
        {
          id: 'Test_question_1',
          formulation: 'Question 1',
          description: 'Description 1',
          type: 'binaire',
          ordonnancement: 1,
          typesCollectivitesConcernees: null,
        },
      ];
      const existingQuestions = [
        {
          id: 'test_question_1',
          formulation: 'Question 1 autre casse',
          description: 'Description 2',
          type: 'binaire' as const,
          ordonnancement: 2,
          typesCollectivitesConcernees: null,
          thematiqueId: null,
          version: '0.0.0',
          competenceCode: null,
          consignesJustification: null,
          exprVisible: null,
        },
      ];

      expect(() =>
        service.verifyPersonnalisationQuestionsAndChoix(
          questions,
          [],
          [],
          existingQuestions,
          []
        )
      ).toThrow(
        'Cannot change existing question ID test_question_1 to Test_question_1'
      );
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
        service.verifyPersonnalisationQuestionsAndChoix(
          questions,
          choix,
          [],
          [],
          []
        )
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
        service.verifyPersonnalisationQuestionsAndChoix(
          questions,
          [],
          [],
          [],
          []
        )
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
        service.verifyPersonnalisationQuestionsAndChoix(
          questions,
          [],
          [],
          [],
          []
        )
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
          thematiques,
          [],
          []
        )
      ).toThrow(
        'Invalid thematique reference invalid_thematique for question test_question_1'
      );
    });

    it('should throw error when question competenceCode is absent from imported competences', () => {
      const competences: ImportPersonnalisationCompetence[] = [
        {
          competenceCode: 1,
          intitule: 'Compétence listée dans la feuille',
          version: '1.0.0',
        },
      ];

      const questions: ImportPersonnalisationQuestion[] = [
        {
          id: 'test_question_1',
          formulation: 'Question liée à une compétence',
          description: 'Le code ne figure pas dans la feuille Compétences',
          type: 'binaire',
          ordonnancement: 1,
          typesCollectivitesConcernees: null,
          competenceCode: 999,
        },
      ];

      expect(() =>
        service.verifyPersonnalisationQuestionsAndChoix(
          questions,
          [],
          [],
          [],
          competences
        )
      ).toThrow(
        'Competence code 999 not found for question test_question_1'
      );
    });

    it('should validate successfully when question competenceCode matches an imported competence', () => {
      const competences: ImportPersonnalisationCompetence[] = [
        {
          competenceCode: 42,
          intitule: 'Eau et assainissement',
          version: '1.0.0',
        },
      ];

      const questions: ImportPersonnalisationQuestion[] = [
        {
          id: 'test_question_1',
          formulation: 'Question avec compétence Banatic',
          description: 'Le code est présent dans la feuille Compétences',
          type: 'binaire',
          ordonnancement: 1,
          typesCollectivitesConcernees: null,
          competenceCode: 42,
        },
      ];

      expect(() =>
        service.verifyPersonnalisationQuestionsAndChoix(
          questions,
          [],
          [],
          [],
          competences
        )
      ).not.toThrow();
    });
  });
});

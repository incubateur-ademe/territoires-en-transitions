import {
  ChampIdentiteInvalide,
  QuestionInconnue,
  ScoreActionInconnue,
  ValeurIdentiteInvalide,
  ValeurIncoherente,
  verifyIdentite,
  verifyQuestion,
  verifyScore,
} from '@tet/domain/referentiels';

const questionBinaire = {
  id: 'dechets_1',
  type: 'binaire' as const,
  choix: null,
};

const questionChoix = {
  id: 'EP_1',
  type: 'choix' as const,
  choix: [
    { id: 'EP_1_a', ordonnancement: 1, formulation: 'Option A' },
    { id: 'EP_1_b', ordonnancement: 2, formulation: 'Option B' },
  ],
};

const questionProportion = {
  id: 'habitat_2',
  type: 'proportion' as const,
  choix: null,
};

const questions = [questionBinaire, questionChoix, questionProportion];

describe('verifyQuestion', () => {
  it('retourne null pour une question binaire avec valeur OUI', () => {
    expect(
      verifyQuestion(
        { questionId: 'dechets_1', valeur: 'OUI' },
        questions,
        'cae_1.2.3',
        'desactivation'
      )
    ).toBeNull();
  });

  it('retourne QuestionInconnue pour une question inexistante', () => {
    expect(
      verifyQuestion(
        { questionId: 'question_inexistante', valeur: 'OUI' },
        questions,
        'cae_1.2.3',
        'desactivation'
      )
    ).toMatchObject(
      new QuestionInconnue('cae_1.2.3', 'desactivation', 'question_inexistante')
    );
  });

  it('retourne ValeurIncoherente pour une question binaire avec valeur invalide', () => {
    expect(
      verifyQuestion(
        { questionId: 'dechets_1', valeur: 'INVALIDE' },
        questions,
        'cae_2.2',
        'desactivation'
      )
    ).toMatchObject(
      new ValeurIncoherente(
        'cae_2.2',
        'desactivation',
        'dechets_1',
        'binaire',
        'INVALIDE',
        ['OUI', 'NON']
      )
    );
  });

  it('retourne null pour une question choix avec un choix valide', () => {
    expect(
      verifyQuestion(
        { questionId: 'EP_1', valeur: 'EP_1_a' },
        questions,
        'cae_1.2.3',
        'reduction'
      )
    ).toBeNull();
  });

  it('retourne ValeurIncoherente pour une question choix avec choix invalide', () => {
    expect(
      verifyQuestion(
        { questionId: 'EP_1', valeur: 'EP_1_inexistant' },
        questions,
        'cae_1.2.3',
        'reduction'
      )
    ).toMatchObject(
      new ValeurIncoherente(
        'cae_1.2.3',
        'reduction',
        'EP_1',
        'choix',
        'EP_1_inexistant',
        ['EP_1_a', 'EP_1_b']
      )
    );
  });

  it('retourne null pour une question proportion sans valeur', () => {
    expect(
      verifyQuestion(
        { questionId: 'habitat_2' },
        questions,
        'cae_1.2.3',
        'reduction'
      )
    ).toBeNull();
  });

  it('retourne ValeurIncoherente pour une question binaire avec valeur vide', () => {
    expect(
      verifyQuestion(
        { questionId: 'dechets_1', valeur: '' },
        questions,
        'cae_1.2.3',
        'desactivation'
      )
    ).toMatchObject(
      new ValeurIncoherente(
        'cae_1.2.3',
        'desactivation',
        'dechets_1',
        'binaire',
        '',
        ['OUI', 'NON']
      )
    );
  });

  it('retourne ValeurIncoherente pour une question proportion avec valeur', () => {
    expect(
      verifyQuestion(
        { questionId: 'habitat_2', valeur: '50' },
        questions,
        'cae_1.2.3',
        'reduction'
      )
    ).toMatchObject(
      new ValeurIncoherente(
        'cae_1.2.3',
        'reduction',
        'habitat_2',
        'proportion',
        '50'
      )
    );
  });
});

describe('verifyIdentite', () => {
  it('retourne null pour identite(type, EPCI)', () => {
    expect(
      verifyIdentite(
        { champ: 'type', valeur: 'EPCI' },
        'cae_1.2.3',
        'desactivation'
      )
    ).toBeNull();
  });

  it('retourne null pour identite(type, commune) — case insensitive', () => {
    expect(
      verifyIdentite(
        { champ: 'type', valeur: 'commune' },
        'cae_1.2.3',
        'desactivation'
      )
    ).toBeNull();
  });

  it('retourne ChampIdentiteInvalide pour un champ inconnu', () => {
    expect(
      verifyIdentite(
        { champ: 'champ_invalide', valeur: 'quelconque' },
        'cae_1.2.3',
        'desactivation'
      )
    ).toMatchObject(
      new ChampIdentiteInvalide('cae_1.2.3', 'desactivation', 'champ_invalide')
    );
  });

  it('retourne ValeurIdentiteInvalide pour une valeur invalide de population', () => {
    const error = verifyIdentite(
      { champ: 'population', valeur: 'valeur_invalide' },
      'cae_1.2.3',
      'desactivation'
    );
    expect(error).toBeInstanceOf(ValeurIdentiteInvalide);
    expect(error?.message).toContain('valeur_invalide');
    expect(error?.message).toContain('moins_de_3000');
  });

  it('retourne null pour identite(localisation, DOM)', () => {
    expect(
      verifyIdentite(
        { champ: 'localisation', valeur: 'DOM' },
        'cae_1.2.3',
        'desactivation'
      )
    ).toBeNull();
  });

  it('retourne null pour identite(dans_aire_urbaine, oui)', () => {
    expect(
      verifyIdentite(
        { champ: 'dans_aire_urbaine', valeur: 'oui' },
        'cae_1.2.3',
        'desactivation'
      )
    ).toBeNull();
  });
});

describe('verifyScore', () => {
  const actionIds = ['cae_1.2.3', 'cae_1.2.4', 'cae_2.1'];

  it('retourne null pour une action existante', () => {
    expect(
      verifyScore({ actionId: 'cae_1.2.3' }, actionIds, 'cae_2.1', 'score')
    ).toBeNull();
  });

  it('retourne ScoreActionInconnue pour une action inexistante', () => {
    expect(
      verifyScore({ actionId: 'cae_99.99' }, actionIds, 'cae_2.1', 'score')
    ).toMatchObject(new ScoreActionInconnue('cae_2.1', 'score', 'cae_99.99'));
  });
});

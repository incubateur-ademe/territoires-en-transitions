import '@testing-library/jest-dom/extend-expect';
import {QuestionReadEndpoint} from 'core-logic/api/endpoints/QuestionReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yuluCredentials} from 'test_utils/collectivites';

const questionDechets4 = {
  id: 'dechets_4',
  action_ids: ['eci_4'],
  thematique_id: 'dechets',
  type: 'binaire',
  thematique_nom: 'Déchets',
  description: '',
  formulation:
    'La collectivité a-t-elle mise en place la redevance d’enlèvement des ordures ménagères (REOM) ?',
  choix: null,
};

const QuestionEnergie1 = {
  id: 'energie_1',
  action_ids: ['cae_2.3.1'],
  thematique_id: 'energie',
  type: 'proportion',
  thematique_nom: 'Énergie',
  description: '',
  formulation:
    "Quelle est la part de la collectivité dans la structure compétente en matière d'éclairage public ?",
  choix: null,
};

const QuestionEnergie2 = {
  id: 'energie_2',
  action_ids: ['cae_2.3.1'],
  thematique_id: 'energie',
  type: 'proportion',
  thematique_nom: 'Énergie',
  description: '',
  formulation: 'La collectivité a-t-elle la compétence éclairage public ?',
  choix: null,
};

const QuestionMobilite1 = {
  id: 'mobilite_1',
  action_ids: ['cae_2.3.3'],
  thematique_id: 'mobilite',
  type: 'choix',
  thematique_nom: 'Mobilité',
  description: '',
  formulation: 'La collectivité a-t-elle la compétence voirie ?',
  choix: [
    {
      id: 'mobilite_1_a',
      label:
        "Oui, uniquement sur trottoirs, parkings ou zones d'activités ou industrielles",
    },
    {
      id: 'mobilite_1_b',
      label: 'non',
    },
  ],
};

describe('Question reading endpoint ', () => {
  it('should retrieve a question by action_id', async () => {
    const questionReadEndpoint = new QuestionReadEndpoint([]);
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await questionReadEndpoint.getBy({
      action_ids: ['eci_4'],
    });

    expect(results.length).toEqual(1);

    expect(results).toEqual(
      expect.arrayContaining([expect.objectContaining(questionDechets4)])
    );
  });

  it('should retrieve questions by action_id', async () => {
    const questionReadEndpoint = new QuestionReadEndpoint([]);
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await questionReadEndpoint.getBy({
      action_ids: ['cae_2.3.1'],
    });

    expect(results.length).toEqual(2);

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining(QuestionEnergie1),
        expect.objectContaining(QuestionEnergie2),
      ])
    );
  });

  it('should return an empty array if there is no questions related to action_id', async () => {
    const questionReadEndpoint = new QuestionReadEndpoint([]);
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await questionReadEndpoint.getBy({
      action_ids: ['nimp'],
    });

    expect(results.length).toEqual(0);
  });

  /*
  it('should group choices on the same question', async () => {
    const questionReadEndpoint = new QuestionReadEndpoint([]);
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await questionReadEndpoint.getBy({
      action_ids: ['cae_2.3.3'],
    });

    //expect(results.length).toEqual(1);

    expect(results).toEqual(
      expect.arrayContaining([expect.objectContaining(QuestionMobilite1)])
    );
  });
  */
});

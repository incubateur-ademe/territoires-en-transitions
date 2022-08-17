import '@testing-library/jest-dom/extend-expect';
import {QuestionReadEndpoint} from 'core-logic/api/endpoints/QuestionReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yuluCredentials} from 'test_utils/collectivites';

const questionDechets4 = {
  action_ids: [
    'cae_1.2.3',
    'eci_2.2',
    'eci_2.4',
    'eci_2.4.2',
    'eci_2.4.3',
    'eci_4.1',
    'eci_4.2',
    'eci_4.2.1',
    'eci_4.2.2',
    'eci_4.2.3',
    'eci_4.2.4',
  ],
  choix: null,
  collectivite_id: 1,
  description: '',
  formulation: 'La collectivité a-t-elle la compétence collecte des déchets ?',
  id: 'dechets_1',
  localisation: [],
  ordonnancement: null,
  population: ['moins_de_20000', 'moins_de_100000'],
  thematique_id: 'dechets',
  thematique_nom: 'Déchets',
  type: 'binaire',
  types_collectivites_concernees: null,
};

const QuestionEnergie2 = {
  action_ids: ['cae_2.3.1'],
  choix: [
    {
      id: 'EP_1_a',
      label: "Oui sur l'ensemble du territoire",
      ordonnancement: null,
    },
    {
      id: 'EP_1_b',
      label:
        "Oui partiellement (uniquement sur les zones d'intérêt communautaire par exemple)",
      ordonnancement: null,
    },
    {id: 'EP_1_c', label: 'Non pas du tout', ordonnancement: null},
  ],
  collectivite_id: 1,
  description: '',
  formulation: 'La collectivité a-t-elle la compétence "éclairage public" ?',
  id: 'EP_1',
  localisation: [],
  ordonnancement: null,
  population: ['moins_de_20000', 'moins_de_100000'],
  thematique_id: 'energie',
  thematique_nom: 'Énergie',
  type: 'choix',
  types_collectivites_concernees: null,
};

const QuestionEnergie3 = {
  action_ids: ['cae_2.3.1'],
  choix: null,
  collectivite_id: 1,
  description: '',
  formulation:
    "Quelle est la part de la collectivité dans la structure compétente en matière d'éclairage public ?",
  id: 'EP_2',
  localisation: [],
  ordonnancement: null,
  population: ['moins_de_20000', 'moins_de_100000'],
  thematique_id: 'energie',
  thematique_nom: 'Énergie',
  type: 'proportion',
  types_collectivites_concernees: null,
};
describe('Question reading endpoint ', () => {
  it('should retrieve a question by action_id', async () => {
    const questionReadEndpoint = new QuestionReadEndpoint([]);
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await questionReadEndpoint.getBy({
      collectivite_id: 1,
      action_ids: ['eci_2.2'],
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
      collectivite_id: 1,
      action_ids: ['cae_2.3.1'],
    });

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining(QuestionEnergie2),
        expect.objectContaining(QuestionEnergie3),
      ])
    );
  });

  it('should return an empty array if there is no questions related to action_id', async () => {
    const questionReadEndpoint = new QuestionReadEndpoint([]);
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await questionReadEndpoint.getBy({
      collectivite_id: 1,
      action_ids: ['nimp'],
    });

    expect(results.length).toEqual(0);
  });

  it('should return questions related to thematique_id', async () => {
    const questionReadEndpoint = new QuestionReadEndpoint([]);
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await questionReadEndpoint.getBy({
      collectivite_id: 1,
      thematique_id: 'dechets',
    });

    expect(results.length).toEqual(4);
    expect(results).toEqual(
      expect.arrayContaining([
        {
          id: 'dechets_3',
          action_ids: ['cae_1.2.3', 'eci_2.1'],
          collectivite_id: 1,
          thematique_id: 'dechets',
          type: 'binaire',
          thematique_nom: 'Déchets',
          description: '',
          types_collectivites_concernees: null,
          formulation:
            'La collectivité est-elle chargée de la réalisation d\'un "Programme local de prévention des déchets ménagers et assimilés" (PLPDMA) du fait de sa compétence collecte et/ou par délégation d\'une autre collectivité ?',
          ordonnancement: null,
          choix: null,
          population: ['moins_de_20000', 'moins_de_100000'],
          localisation: [],
        },
      ])
    );
  });
});

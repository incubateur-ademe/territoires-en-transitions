import { GetPersonnalisationReglesResponseType } from '../get-personnalisation-regles.response';

export const eciPersonnalisationRegles: GetPersonnalisationReglesResponseType =
  {
    regles: [
      {
        actionId: 'eci_1.2.2',
        type: 'desactivation',
        formule:
          'si identite(type, syndicat) alors VRAI\nsinon si reponse(dev_eco_1, NON) alors VRAI\n',
        description:
          '<p>Les syndicats ne sont pas concernés par la sous-action 1.2.2.</p>\n',
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_1.2.3',
        type: 'desactivation',
        formule:
          'si identite(type, syndicat) alors VRAI\nsinon si reponse(dev_eco_1, NON) alors VRAI\n',
        description:
          '<p>Les syndicats ne sont pas concernés par la sous-action 1.2.3.</p>\n',
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_1.2.4',
        type: 'desactivation',
        formule: 'si identite(type, syndicat) alors FAUX sinon VRAI\n',
        description:
          '<p>Les syndicats ne sont pas concernés par la sous-action 1.2.4.</p>\n',
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_2.1',
        type: 'desactivation',
        formule: 'reponse(dechets_3, NON) \n',
        description:
          "<p>Pour les collectivités n'ayant pas la compétence &quot;collecte des déchets&quot;, le score de l'action 2.1. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>\n",
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_2.2',
        type: 'desactivation',
        formule: 'reponse(dechets_1, NON) \n',
        description:
          "<p>Pour les collectivités n'ayant pas la compétence &quot;collecte des déchets&quot;, le score de l'action 2.2. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>\n",
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_2.3',
        type: 'desactivation',
        formule: 'reponse(dechets_2, NON) \n',
        description:
          "<p>Pour les collectivités n'ayant pas la compétence &quot;traitement des déchets&quot;, le score de l'action 2.3. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>\n",
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_2.4',
        type: 'desactivation',
        formule: 'reponse(dechets_1, NON) et reponse(dechets_2, NON)\n',
        description:
          "<p>Pour les collectivités n'ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l'action 2.4. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>\n<p>Pour les collectivités n'ayant pas la compétence &quot;collecte des déchets&quot;, les scores des sous-actions 2.4.2 et 2.4.3 sont réduits à 0 et les statuts de ces 2 sous-actions sont &quot;non concerné&quot;.</p>\n<p>Pour les collectivités n'ayant pas la compétence &quot;traitement des déchets&quot;, le score de la sous-action 2.4.4 est réduit à 0 et le statut de cette sous-action est &quot;non concerné&quot;.</p>\n",
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_2.4.2',
        type: 'desactivation',
        formule: 'reponse(dechets_1, NON) \n',
        description: '',
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_2.4.3',
        type: 'desactivation',
        formule: 'reponse(dechets_1, NON) \n',
        description:
          '<pre><code>                                           ˚\n</code></pre>\n',
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_2.4.4',
        type: 'desactivation',
        formule: 'reponse(dechets_2, NON) \n',
        description: '',
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_3.2.0',
        type: 'desactivation',
        formule: 'reponse(SPASER, OUI) \n',
        description:
          '<p>Les collectivités ayant un montant total annuel des achats inférieur à 50 millions d’euros hors-taxes ne sont pas concernées par le SPASER.</p>\n',
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_3.4',
        type: 'desactivation',
        formule: 'reponse(dev_eco_1, NON) \n',
        description:
          "<p>Pour les collectivités n'ayant pas la compétence &quot;développement économique&quot;, le score de l'action 3.4. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>\n<p>Pour les collectivités ne possédant pas d'établissements de formation initiale et continue sur leur territoire, le score de la sous-action 3.4.2 est réduit à 0 et le statut est &quot;non concerné&quot;.</p>\n",
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_3.4.2',
        type: 'desactivation',
        formule: 'reponse(formation, NON) \n',
        description: '',
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_3.7.1',
        type: 'reduction',
        formule: 'si identite(population, moins_de_100000) alors 3 \n',
        description:
          '<p>La note du référentiel actuel est à 25 %. Pour les collectivités ayant une population inférieure à 100 000 habitants, la note de la sous-action passe à 75 %.</p>\n',
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_3.7.2',
        type: 'reduction',
        formule: 'si identite(population, moins_de_100000) alors 1/3\n',
        description:
          '<p>La note du référentiel actuel est à 75 %. Pour les collectivités ayant une population inférieure à 100 000 habitants, la note de la sous-action passe à 25 %.</p>\n',
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_4.1',
        type: 'desactivation',
        formule: 'reponse(dechets_1, NON) et reponse(dechets_2, NON)\n',
        description:
          "<p>Pour les collectivités n'ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l'action 4.1. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>\n",
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_4.2.1',
        type: 'desactivation',
        formule: 'reponse(dechets_1, NON) ou reponse(REOM, OUI) \n',
        description:
          "<p>Pour les collectivités n'ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l'action 4.2 est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>\n<p>Pour les collectivités n'ayant pas la compétence &quot;collecte des déchets&quot;, les scores des sous-actions 4.2.1 à 4.2.4 sont réduits à 0 et les statuts de ces 4 sous-actions sont &quot;non concerné&quot;.</p>\n<p>Pour les collectivités ayant mis en place la redevance d’enlèvement des ordures ménagères (REOM), les scores des sous-action 4.2.1 et 4.2.3 sont réduits à 0 et les statuts de ces 2 sous-actions sont &quot;non concerné&quot;.</p>\n<p>La sous-action 4.2.5 ne s'adressent qu'aux syndicats de traitement.</p>\n",
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_4.2.2',
        type: 'desactivation',
        formule: 'reponse(dechets_1, NON) \n',
        description:
          "<p>Pour les collectivités n'ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l'action 4.2 est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>\n",
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_4.2.3',
        type: 'desactivation',
        formule: 'reponse(dechets_1, NON) ou reponse(REOM, OUI) \n',
        description:
          "<p>Pour les collectivités n'ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l'action 4.2 est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>\n<p>Pour les collectivités ayant mis en place la redevance d’enlèvement des ordures ménagères (REOM), les scores des sous-action 4.2.1 et 4.2.3 sont réduits à 0 et les statuts de ces 2 sous-actions sont &quot;non concerné&quot;.</p>\n",
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_4.2.4',
        type: 'desactivation',
        formule: 'reponse(dechets_1, NON) \n',
        description:
          "<p>Pour les collectivités n'ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l'action 4.2 est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>\n<p>Pour les collectivités n'ayant pas la compétence &quot;collecte des déchets&quot;, les scores des sous-actions 4.2.1 à 4.2.4 sont réduits à 0 et les statuts de ces 4 sous-actions sont &quot;non concerné&quot;.</p>\n",
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_4.2.5',
        type: 'desactivation',
        formule:
          'si identite(type, syndicat) et reponse(dechets_2, OUI) alors FAUX sinon VRAI\n',
        description:
          "<p>Pour les collectivités n'ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l'action 4.2 est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>\n<p>La sous-action 4.2.5 ne s'adressent qu'aux syndicats de traitement.</p>\n",
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
      {
        actionId: 'eci_4.3',
        type: 'desactivation',
        formule: 'reponse(dev_eco_1, NON) \n',
        description:
          "<p>Pour les collectivités n'ayant pas la compétence &quot;développement économique&quot;, le score de l'action 4.3. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>\n",
        modifiedAt: '2022-09-12 17:13:21.389402+00',
      },
    ],
  };

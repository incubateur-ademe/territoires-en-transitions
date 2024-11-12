import { GetPersonnalisationReglesResponseType } from '../get-personnalisation-regles.response';

export const caePersonnalisationRegles: GetPersonnalisationReglesResponseType =
  {
    regles: [
      {
        actionId: 'cae_1.1.2.0.1',
        type: 'desactivation',
        formule:
          'si identite(type, commune) alors VRAI\nsinon si identite(type, EPCI) et identite(population, moins_de_20000) alors VRAI\n',
        description:
          "<p>Seuls les EPCI à fiscalité propre de plus de 20 000 habitants sont concernées par l'obligation de réaliser un PCAET.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.1.2.0.2',
        type: 'desactivation',
        formule: 'identite(population, moins_de_50000)\n',
        description:
          "<p>Les collectivités de moins de 50 000 habitants ne sont pas concernées par l'obligation BEGES.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.1.2.1',
        type: 'desactivation',
        formule:
          'si identite(type, EPCI) et identite(population, plus_de_20000) alors VRAI\n',
        description:
          '<p>Seuls les EPCI à fiscalité propre de plus de 20 000 habitants ne sont pas évaluées sur cette action.</p>\n',
        modifiedAt: '2023-10-27 09:19:16.433221+00',
      },
      {
        actionId: 'cae_1.1.2.1',
        type: 'reduction',
        formule:
          'si identite(type, EPCI) et identite(population, plus_de_20000) alors 0\n',
        description: '',
        modifiedAt: '2023-10-27 11:56:17.852604+00',
      },
      {
        actionId: 'cae_1.1.2.1.5',
        type: 'desactivation',
        formule: 'identite(type, EPCI)\n',
        description: '',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_1.1.2.2',
        type: 'reduction',
        formule:
          'si identite(type, EPCI) et identite(population, plus_de_20000) alors 5/4\n',
        description:
          '<p>La note du référentiel actuel est à 40 %. Pour les EPCI plus de 20 000, la note de la sous-action passe à 50 %.</p>\n',
        modifiedAt: '2023-10-27 09:19:16.433221+00',
      },
      {
        actionId: 'cae_1.1.2.5',
        type: 'reduction',
        formule:
          'si identite(type, EPCI) et identite(population, plus_de_20000) alors 3/2\n',
        description:
          '<p>La note du référentiel actuel est à 20 %. Pour les EPCI plus de 20 000, la note de la sous-action passe à 30 %.</p>\n',
        modifiedAt: '2023-10-27 09:19:16.433221+00',
      },
      {
        actionId: 'cae_1.2.2',
        type: 'reduction',
        formule:
          'si reponse(centre_urbain, NON) et reponse (AOM_1, NON) alors 2/12 \nsinon si reponse (AOM_1, NON) alors 6/12\n',
        description:
          "<p>Pour une collectivité n'ayant pas la compétence AOM, le score de la 1.2.2 est réduit de 50 %.</p>\n<p>Pour une collectivité n'ayant pas de centre urbain de plus de 5000 habitants ET n'ayant pas la compétence AOM, le score de la 1.2.2 est réduit à 2 points.</p>\n<p>Pour une collectivité AOM, de plus de 100 000 habitants, la 1.2.2.1 est désactivée et la 1.2.2.5 est évaluée sur 40 % des points.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.2.2.1',
        type: 'desactivation',
        formule:
          'reponse(AOM_1, OUI) et identite(population, plus_de_100000)\n',
        description:
          '<p>Pour une collectivité AOM, de plus de 100 000 habitants, la 1.2.2.1 est désactivée.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.2.2.1',
        type: 'reduction',
        formule:
          'si reponse(AOM_1, OUI) et identite(population, plus_de_100000) alors 0.0\n',
        description:
          '<p>Pour une collectivité AOM, de plus de 100 000 habitants, le potentiel passe de 10% à 0%.</p>\n',
        modifiedAt: '2022-12-21 09:56:06.218724+00',
      },
      {
        actionId: 'cae_1.2.2.1.1',
        type: 'desactivation',
        formule: 'identite(type, commune)\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.2.2.1.3',
        type: 'desactivation',
        formule: 'identite(type, EPCI)\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.2.2.5',
        type: 'reduction',
        formule:
          'si reponse(AOM_1, OUI) et identite(population, plus_de_100000) alors 0.4/0.3\n',
        description:
          '<p>Pour une collectivité AOM, de plus de 100 000 habitants, la 1.2.2.5 est notée sur 40 % (au lieu de 30 %).</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.2.3',
        type: 'reduction',
        formule:
          'si reponse(dechets_1, OUI) et reponse(dechets_2, OUI) et reponse(dechets_3, OUI) alors 1.0\nsinon si reponse(dechets_1, NON) et reponse(dechets_2, NON) et reponse(dechets_3, NON) alors 2/10\nsinon si reponse(dechets_1, NON) ou reponse(dechets_2, NON) ou reponse(dechets_3, NON) alors 0.75\n',
        description:
          "<p>Pour une collectivité ne possédant que partiellement les compétences collecte, traitement des déchets et plan de prévention des déchets, le score de la 1.2.3 est réduit de 25 %.</p>\n<p>Pour une collectivité n'ayant aucune des compétences collecte, traitement des déchets et plan de prévention des déchets, le score de la 1.2.3 est réduit à 2 points.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.2.3.1.4',
        type: 'desactivation',
        formule: 'reponse(dechets_1, NON)\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.2.3.1.5',
        type: 'desactivation',
        formule: 'reponse(dechets_2, NON)\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.2.4',
        type: 'reduction',
        formule:
          'si identite(type, EPCI) et reponse(habitat_1, NON) alors 8/12 \nsinon si identite(type, commune) alors max (reponse(habitat_2), 0.5) \n',
        description:
          "<p>Pour un EPCI n'ayant pas la compétence habitat, le score de la 1.2.4 est réduit à 8 points.</p>\n<p>Si la collectivité est une commune, le potentiel est réduit à la part de la commune dans la collectivité compétente en matière de Programme Local de l’Habitat (PLH), dans la limite de 50 %.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.3.1',
        type: 'reduction',
        formule:
          'si reponse(urba_1, NON) et reponse(SCoT, NON) alors 6/12 \nsinon si reponse(urba_1, NON) et reponse(SCoT, OUI) alors 0.7 \n',
        description:
          "<p>Pour une collectivité n'ayant ni la compétence PLU, ni la compétence SCOT, le score de la 1.3.1 est réduit de 50 %.</p>\n<p>Pour une collectivité n'ayant pas la compétence PLU mais disposant de la compétence SCOT, le score de la 1.3.1 est réduit de 30 %.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.3.2',
        type: 'reduction',
        formule:
          'si reponse(amenagement_1, NON) ou reponse (amenagement_2, NON) alors 5/10 \n',
        description:
          "<p>Si une collectivité n'a pas de terrains utilisables ou vendables ou elle dispose de terrains de ce type mais n'a pas réalisé de vente ou de contrats d'utilisation alors le score de la 1.3.2 est réduit de 50 %.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.3.3',
        type: 'desactivation',
        formule:
          'reponse(urba_1, NON) et reponse (urba_2, NON) et reponse(urba_3, NON)\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_1.3.3',
        type: 'reduction',
        formule:
          'si reponse(urba_1, NON) et reponse (urba_2, NON) et reponse(urba_3, NON) alors 0\nsinon si reponse(urba_1, OUI) et reponse(urba_2, NON) et reponse(urba_3, NON) alors 0.5\nsinon si reponse(urba_1, NON) et reponse(urba_2, OUI) et reponse(urba_3, NON) alors 0.5\nsinon si reponse(urba_1, NON) et reponse(urba_2, NON) et reponse(urba_3, OUI) alors 0.5\n',
        description:
          "<p>Pour une collectivité n'ayant ni la compétence PLU, ni l'instruction, ni l'octroi des permis de construire, le score de la 1.3.3 est réduit de 100 % et le statut de la 1.3.3 est &quot;non concerné&quot;.</p>\n<p>Pour une collectivité n'ayant que l'une des compétences (PLU, instruction ou octroi des permis de construire), le score de la 1.3.3 est réduit de 50 %.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_2.2.3',
        type: 'reduction',
        formule:
          'si identite(localisation, DOM) et reponse(ECS, NON) alors 0.3\n',
        description:
          "<p>Pour une collectivité hors France Métropolitaine, et en l'absence de besoin d'eau chaude sanitaire, le score de la 2.2.3 est réduit de 70 %.</p>\n<p>Pour une collectivité hors France Métropolitaine, le statut des sous-actions 2.2.3.1 à 2.2.3.3 est &quot;non concerné&quot;.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_2.2.3.1',
        type: 'desactivation',
        formule: 'identite(localisation, DOM) \n',
        description:
          '<p>Pour une collectivité hors France Métropolitaine, le statut de la sous-action 2.2.3.1 est &quot;non concernée&quot;.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_2.2.3.2',
        type: 'desactivation',
        formule: 'identite(localisation, DOM) \n',
        description:
          '<p>Pour une collectivité hors France Métropolitaine, le statut de la sous-action 2.2.3.2 est &quot;non concernée&quot;.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_2.2.3.3',
        type: 'desactivation',
        formule: 'identite(localisation, DOM) \n',
        description:
          '<p>Pour une collectivité hors France Métropolitaine, le statut de la sous-action 2.2.3.3 est &quot;non concernée&quot;.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_2.2.4.2.4',
        type: 'desactivation',
        formule: 'identite(localisation, Metropole)\n',
        description:
          '<p>Pour une collectivité hors DOM, la tâche &quot;installer ou favoriser les moyens de production avec stockage de l’électricité&quot; est non concernée.</p>\n',
        modifiedAt: '2023-10-27 09:19:16.433221+00',
      },
      {
        actionId: 'cae_2.3.1',
        type: 'desactivation',
        formule: 'identite(type, EPCI) et reponse(EP_1, EP_1_c)\n',
        description:
          "<p>Si la collectivité est un EPCI sans compétence sur l'éclairage public, alors le score est réduit à 0 et les statuts sont &quot;non concernés&quot;.</p>\n<p>Si la collectivité est un EPCI avec une compétence éclairage public limitée, alors la collectivité est évaluée sur 2 points (au lieu de 6).</p>\n<p>Si la collectivité a délégué sa compétence éclairage public à une autre structure, alors le score est proportionnel à la participation de la collectivité dans la structure.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_2.3.1',
        type: 'reduction',
        formule:
          'si identite(type, EPCI) et reponse(EP_1, EP_1_b) alors 2/6\nsinon si identite(type, EPCI) et reponse(EP_1, EP_1_c) alors 0\nsinon reponse(EP_2)\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_2.3.3',
        type: 'desactivation',
        formule: 'reponse(voirie_1, voirie_1_c)\n',
        description:
          "<p>Si la collectivité n'a pas la compétence voirie, alors le score est réduit à 0 et les statuts sont &quot;non concernés&quot;.</p>\n<p>Si la collectivité a une compétence voirie limitée, alors la collectivité est évaluée sur 1 point (au lieu de 2).</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_2.3.3',
        type: 'reduction',
        formule:
          'si reponse(voirie_1, voirie_1_b) alors 0.5\nsinon si reponse(voirie_1, voirie_1_c) alors 0/2\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.1.1',
        type: 'reduction',
        formule:
          'si reponse(AOD_elec, OUI) et reponse(AOD_gaz, OUI) et reponse(AOD_chaleur, OUI) alors 1.0 \nsinon si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 2/10 \nsinon si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) alors 4/10 \nsinon si reponse(AOD_elec, NON) et reponse(AOD_chaleur, NON) alors 3/10 \nsinon si reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 3/10 \nsinon si reponse(AOD_elec, NON) ou reponse(AOD_gaz, NON) alors 7/10 \nsinon si reponse(AOD_chaleur, NON) alors 6/10 \n',
        description:
          "<p>Pour une collectivité non autorité organisatrice de la distribution d'électricité, le score de la 3.1.1 est réduit de 30 %.</p>\n<p>Pour une collectivité non autorité organisatrice de la distribution de gaz, le score de la 3.1.1 est réduit de 30 %.</p>\n<p>Pour une collectivité non autorité organisatrice de la distribution de chaleur, le score de la 3.1.1 est réduit de 40 %.</p>\n<p>Ces réductions sont cumulables dans la limite de 2 points restants pour prendre en compte la part d’influence dans les instances compétentes et les actions partenariales.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.1.2',
        type: 'reduction',
        formule:
          'si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 0.5\nsinon si reponse(fournisseur_energie, NON) alors 0.8\n',
        description:
          "<p>Pour une collectivité non autorité organisatrice de la distribution d'électricité, de gaz et de chaleur, le score de la 3.1.2 est réduit de 50 %.</p>\n<p>En l’absence de fournisseurs d’énergie maîtrisés par la collectivité (SEM/régie/exploitants de réseau de chaleur urbain liés à la collectivité par DSP), le score de la 3.1.2 est réduit de 20 % et le statut de la sous-action 3.1.2.2 liée aux actions de la facturation est &quot;non concerné&quot;.</p>\n<p>La réduction la plus forte prévaut.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.1.2.2',
        type: 'desactivation',
        formule: 'si reponse(fournisseur_energie, NON) alors VRAI\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.2.1',
        type: 'reduction',
        formule:
          'si reponse(recuperation_cogeneration, OUI) et identite(localisation,DOM) alors 10/12\nsinon si reponse(recuperation_cogeneration, NON) alors 2/12\n',
        description:
          "<p>Le nombre de point max pour l'action 3.2.1 est de 12 points en Métropole et de 10 points pour les collectivités DOM.</p>\n<p>Pour une collectivité avec peu d'activités industrielles adaptées pour la récupération de chaleur fatale et peu de potentiel pour la cogénération voir la micro-cogénération (donc ni de chaufferies ni de consommateurs suffisants en chaleur ni de producteur-consommateur visant l’autoconsommation), le score de la 3.2.1 est réduit à 2 points et les sous-actions 3.2.1.2 et 3.2.1.3 sont automatiquement en statut &quot;Non concerné&quot;.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.2.1.2',
        type: 'desactivation',
        formule: 'reponse(recuperation_cogeneration, NON) \n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.2.1.3',
        type: 'desactivation',
        formule: 'reponse(recuperation_cogeneration, NON) \n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.2.2',
        type: 'reduction',
        formule: 'si identite(localisation,DOM) alors 10/12\n',
        description:
          "<p>Le nombre de point max pour l'action 3.2.2 est de 12 points en Métropole et de 10 points pour les collectivités DOM.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.2.3',
        type: 'reduction',
        formule: 'si identite(localisation,DOM) alors 12/8\n',
        description:
          "<p>Le nombre de point max pour l'action 3.2.3 est de 8 points en Métropole et de 12 points pour les collectivités DOM.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.3.1',
        type: 'desactivation',
        formule: 'reponse(eau_1, NON) \n',
        description:
          '<p>Pour une collectivité sans la compétence eau potable, le score de la 3.3.1 est réduit à 0 point et le statut de la sous-action est &quot;non concernée&quot;.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.3.1',
        type: 'reduction',
        formule: 'si reponse(eau_1, NON) alors 0/6 \n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.3.2',
        type: 'desactivation',
        formule: 'reponse(assainissement_1, NON)\n',
        description:
          "<p>Pour une collectivité sans la compétence assainissement collectif, le score de la 3.3.2 est réduit à 0 point et le statut de la sous-action est &quot;non concernée&quot;.</p>\n<p>En cas d'absence de potentiel de valorisation énergétique (méthanisation ou récupération de chaleur) attestée par une étude portant sur la totalité du périmètre d’assainissement, le score de la 3.3.2 est réduit à 50 %.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.3.2',
        type: 'reduction',
        formule:
          'si reponse(assainissement_1, NON) alors 0/12\nsinon si reponse(assainissement_4, OUI) et reponse(assainissement_4bis, NON) alors 0.5\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.3.3',
        type: 'reduction',
        formule:
          'si identite(type, EPCI) alors max(reponse(assainissement_3), 0.5)\nsinon si identite(type, commune) et reponse(assainissement_1, NON) et reponse(assainissement_2, NON) alors 0.5\n',
        description:
          '<p>Pour un EPCI, en cas de compétence &quot;assainissement&quot; partagée ou variable sur le territoire, la réduction de potentielle est proportionnelle à la part des communes ayant délégué leur compétence assainissement, dans la limite de moins 50%. Des actions sont possibles sur d’autres compétences, notamment « gestion des milieux aquatiques et prévention des inondations ».</p>\n<p>Pour les communes sans compétence assainissement, le score de la 3.3.3 est réduit de 50 %.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.3.3.3.4',
        type: 'desactivation',
        formule: 'identite(localisation,DOM)\n',
        description: '',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_3.3.5',
        type: 'score',
        formule: 'min(score(cae_1.2.3), score(cae_3.3.5))\n',
        description:
          "<p>Pour favoriser la prévention des déchets, la note attribuée à cette action ne peut dépasser celle obtenue dans l'action 1.2.3.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_3.3.5',
        type: 'reduction',
        formule:
          'si identite(type, commune) et reponse(dechets_2, NON) alors 2/12\nsinon si identite(type, EPCI) et reponse(dechets_2, NON) alors max(reponse(dechets_4),2/12)\n',
        description:
          "<p>Pour une commune, la note est réduite à 2 points en l'absence de la compétence traitement des déchets.</p>\n<p>Pour un EPCI ayant transféré la compétence traitement des déchets à un syndicat compétent en la matière, la note est réduite proportionnelle à sa participation dans ce syndicat, dans la limite de 2 points restants.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_4.1.1',
        type: 'reduction',
        formule: 'max(reponse(AOM_2), 0.5) \n',
        description:
          '<p>Pour une collectivité non AOM, le score est proportionnel à la participation dans la structure AOM dans la limite de 50 %.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_4.1.2',
        type: 'reduction',
        formule:
          'si reponse(TC_1, NON) et reponse(vehiculeCT_1, NON) alors 0.5\nsinon si reponse(TC_1, NON) alors 0.8\nsinon si reponse(vehiculeCT_1, NON) alors 0.7\n',
        description:
          '<p>Pour une collectivité dont la desserte des locaux par les transports publics est inenvisageable, le score est diminué de 20 %.</p>\n<p>Pour une collectivité ne disposant pas de véhicules, le score est diminué de 30 % et les statuts des sous-actions 4.1.2.1, 4.1.2.3 et 4.1.2.4 sont &quot;non concerné&quot;.</p>\n<p>Ces 2 réductions sont cumulables.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_4.1.2.1',
        type: 'desactivation',
        formule: 'reponse(vehiculeCT_1, NON)\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_4.1.2.3',
        type: 'desactivation',
        formule: 'reponse(vehiculeCT_1, NON)\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_4.1.2.4',
        type: 'desactivation',
        formule: 'reponse(vehiculeCT_1, NON)\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_4.2.1',
        type: 'reduction',
        formule:
          'si identite(type, commune) alors max(reponse(voirie_2), 2/8)\nsinon si identite(type, EPCI) et reponse(voirie_1, voirie_1_b) alors 0.5\nsinon si reponse(voirie_1, voirie_1_c) et reponse(centre_polarite, NON) alors 0.25\nsinon si identite(type, EPCI) et reponse(voirie_1, voirie_1_c) alors 0.5\n',
        description:
          '<p>Pour les communes, le score est réduit proportionnelle à la part dans l’EPCI en cas de transfert de la compétence en matière de voirie/stationnement, dans la limite de 2 points pour le pouvoir de police du maire.</p>\n<p>Pour les intercommunalités qui n’ont pas la compétence &quot;voirie&quot; ou uniquement sur les voiries et parcs de stationnements communautaires, le score est réduit de 50 %.</p>\n<p>En l’absence de compétences voirie et stationnement et de zones de polarités, le score est réduit de 75 %.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_4.2.2',
        type: 'reduction',
        formule:
          'si reponse(pouvoir_police, NON) et reponse(trafic, NON) et reponse(voirie_1,voirie_1_b) alors 2/16\nsinon si reponse(pouvoir_police, NON) et reponse(trafic, NON) et reponse(voirie_1,voirie_1_c) alors 2/16\nsinon si reponse(pouvoir_police, NON) et reponse(trafic, NON) alors 4/16\nsinon si reponse(pouvoir_police, NON) et reponse(voirie_1,voirie_1_b) alors 4/16\nsinon si reponse(pouvoir_police, NON) et reponse(voirie_1,voirie_1_c) alors 4/16\nsinon si reponse(voirie_1,voirie_1_b) et reponse(voirie_1,voirie_1_c) alors 4/16\nsinon si reponse(voirie_1,voirie_1_b) et reponse(trafic, NON) alors 4/16\nsinon si reponse(voirie_1,voirie_1_c) et reponse(trafic, NON) alors 4/16\nsinon si reponse(pouvoir_police, NON) ou reponse(voirie_1,voirie_1_b) ou reponse(voirie_1,voirie_1_c) ou reponse\n(trafic, NON) alors 0.5\n',
        description:
          "<p>Pour les collectivités ne disposant pas des compétences en matière de circulation/gestion du trafic (pouvoir de police), le score est réduit de 50 %.</p>\n<p>Pour les collectivités ne disposant pas de compétences en matière de voirie (création, aménagement, entretien) ou qui possèdent uniquement les voiries et parcs de stationnements communautaires, le score est réduit de 50 %.</p>\n<p>Pour les collectivités pour lesquelles il n'y a manifestement pas de potentiel d'action ou de problèmes liés à la vitesse, le score est réduit de 50 %.</p>\n<p>Ces réductions sont cumulables, dans la limite de 2 points potentiel restant.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_4.2.3',
        type: 'desactivation',
        formule:
          'si reponse(AOM_1, NON) et reponse (voirie_1, voirie_1_c) et reponse(centre_polarite, NON) alors VRAI\nsinon si reponse(AOM_1, NON) et reponse (voirie_1, voirie_1_c) et identite(population, moins_de_10000) alors VRAI\n',
        description:
          "<p>Pour une collectivité non AOM, sans compétence voirie, de moins de 10 000 habitants ou ne comportant pas de commune ou centre-bourg de plus de 2000 habitants, le score de la 4.2.3 est réduit à 0 et l'action entière est &quot;Non concernée&quot;.</p>\n",
        modifiedAt: '2024-02-21 13:49:11.116461+00',
      },
      {
        actionId: 'cae_4.2.3',
        type: 'reduction',
        formule:
          'si reponse(AOM_1, NON) et reponse (voirie_1, voirie_1_c) et reponse(centre_polarite, NON) alors 0\nsinon si reponse(AOM_1, NON) et reponse (voirie_1, voirie_1_c) et identite(population, moins_de_10000) alors 0\nsinon si identite(population, moins_de_10000) et reponse(AOM_1, NON) alors 0.25\nsinon si reponse(centre_polarite, NON) et reponse(AOM_1, NON) alors 0.25\nsinon si identite(population, moins_de_10000) et reponse (voirie_1, voirie_1_c) alors 0.25\nsinon si reponse(centre_polarite, NON) et reponse (voirie_1, voirie_1_c) alors 0.25\nsinon si identite(population, moins_de_10000) ou reponse(centre_polarite, NON) alors 0.5\nsinon si reponse(AOM_1, NON) et reponse (voirie_1, voirie_1_c) alors 0.5 \nsinon si reponse(AOM_1, NON) alors 0.75\nsinon si reponse (voirie_1, voirie_1_c) alors 0.75\n',
        description:
          '<p>Pour une collectivité non AOM, le score de la 4.2.3 est réduit de 25 %.</p>\n<p>Pour une collectivité sans compétence voirie, le score de la 4.2.3 est réduit de 25 %.</p>\n<p>Pour une collectivité de moins de 10 000 habitants ou ne comportant pas de commune ou centre-bourg de plus de 2000 habitants, le score de la 4.2.3 est réduit de 50 %.</p>\n<p>Les réductions sont cumulables.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_4.2.3.5',
        type: 'desactivation',
        formule: 'reponse(voirie_1, voirie_1_c)\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_4.3.1',
        type: 'reduction',
        formule:
          'si identite(type, commune) alors max(reponse(voirie_2), 0.5)\nsinon si identite(type, EPCI) et reponse(voirie_1, voirie_1_b) alors 0.5\nsinon si identite(type, EPCI) et reponse(voirie_1, voirie_1_c) alors 0.5\n',
        description:
          '<p>Pour les communes, le score de la 4.3.1 est réduit proportionnellement à la part dans l’EPCI compétent en matière de voirie (création, aménagement, entretien) dans la limite de 50 % pour prendre en compte le pouvoir de police du maire.</p>\n<p>Pour les intercommunalités qui n’ont la compétence que sur les voiries et parcs de stationnements communautaires, le score est réduit de 50 %.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_4.3.1.2',
        type: 'reduction',
        formule: 'si identite(localisation, DOM) alors 3/2\n',
        description:
          '<p>Pour une collectivité hors Métropole, la 4.3.1.2 est notée sur 30 % (au lieu de 20 %).</p>\n',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_4.3.1.4',
        type: 'reduction',
        formule: 'si identite(localisation, DOM) alors 2/3\n',
        description:
          '<p>Pour une collectivité hors Métropole, la 4.3.1.2 est notée sur 20 % (au lieu de 30 %).</p>\n',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_4.3.2',
        type: 'reduction',
        formule:
          'si identite(localisation,DOM) et reponse(cyclable, NON) alors 7/16\nsinon si identite(localisation,DOM) alors 14/16\nsinon si reponse(cyclable, NON) alors 0.5\n',
        description:
          "<p>Pour une collectivité disposant de peu de compétences en matière de politique cyclable (ni AOM, ni compétente en matière d’infrastructures vélos, de stationnement vélos, de services associés aux vélos), le score de la 4.3.2 est réduit de 50 %.</p>\n<p>Le nombre de point max pour l'action 4.3.2 est de 16 points en Métropole et de 14 points pour les collectivités DOM.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_4.3.2.2',
        type: 'reduction',
        formule: 'si identite(localisation, DOM) alors 2\n',
        description:
          '<p>Pour une collectivité hors Métropole, la 4.3.2.2 est notée sur 10 % (au lieu de 5 %).</p>\n',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_4.3.2.3',
        type: 'reduction',
        formule: 'si identite(localisation, DOM) alors 2\n',
        description:
          '<p>Pour une collectivité hors Métropole, la 4.3.2.3 est notée sur 20 % (au lieu de 10 %).</p>\n',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_4.3.2.6',
        type: 'desactivation',
        formule: 'identite(localisation, DOM)\n',
        description:
          '<p>Pour une collectivité hors Métropole, la 4.3.2.6 est désactivée.</p>\n',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_4.3.2.6',
        type: 'reduction',
        formule: 'si identite(localisation, DOM) alors 0/14\n',
        description: '',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_4.3.2.7',
        type: 'reduction',
        formule: 'si identite(localisation, DOM) alors 2/3\n',
        description:
          '<p>Pour une collectivité hors Métropole, la 4.3.2.7 est notée sur 20 % (au lieu de 30 %).</p>\n',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_4.3.3',
        type: 'reduction',
        formule:
          'si reponse(AOM_1, NON) et reponse(versement_mobilite, NON) alors min(reponse(AOM_2), 0.5)\nsinon si reponse(AOM_1, NON) et reponse(versement_mobilite, OUI) alors reponse(AOM_2)\nsinon si reponse(versement_mobilite, NON) alors 0.5\n',
        description:
          '<p>Pour une collectivité non AOM, le score de la 4.3.3 est réduit proportionnellement à la part de la collectivité dans la structure AOM.</p>\n<p>Pour les collectivités non concernée par le versement mobilité, le score de la 4.3.3 est réduit de 50 %.</p>\n<p>La réduction la plus forte prévaut.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_4.3.4',
        type: 'reduction',
        formule:
          'si identite(localisation,DOM) et reponse(AOM_1, NON) alors max(reponse(AOM_2) * 10/8, 5/8)\nsinon si identite(localisation,DOM) alors 10/8\nsinon si reponse(AOM_1, NON) alors max(reponse(AOM_2), 4/8)\n',
        description:
          "<p>Pour une collectivité non AOM, le score de la 4.3.4 est réduit proportionnellement à la part de la collectivité dans la structure AOM dans la limite de 50%.</p>\n<p>Le nombre de point max pour l'action 4.3.4 est de 8 points en Métropole et de 10 points pour les collectivités DOM.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.1.2',
        type: 'reduction',
        formule: 'si identite(type, commune) alors 3/4\n',
        description:
          '<p>Les communes sont évaluées sur 3 points au lieu de 4.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.1.2.3.1',
        type: 'desactivation',
        formule: 'identite(type, commune)\n',
        description: '',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_6.1.2.3.2',
        type: 'desactivation',
        formule: 'identite(type, EPCI)\n',
        description: '',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_6.1.2.4.1',
        type: 'desactivation',
        formule: 'identite(type, commune)\n',
        description: '',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_6.1.2.4.2',
        type: 'desactivation',
        formule: 'identite(type, commune)\n',
        description: '',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_6.1.2.4.3',
        type: 'desactivation',
        formule: 'identite(type, commune)\n',
        description: '',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_6.1.2.4.4',
        type: 'desactivation',
        formule: 'identite(type, EPCI)\n',
        description: '',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_6.1.2.4.5',
        type: 'desactivation',
        formule: 'identite(type, EPCI)\n',
        description: '',
        modifiedAt: '2023-02-20 09:49:29.286703+00',
      },
      {
        actionId: 'cae_6.2.1',
        type: 'reduction',
        formule:
          'si identite(type, commune) et reponse(habitat_3, NON) alors max(reponse(habitat_2), 2/10) \nsinon si identite(type, commune) et reponse(habitat_3, OUI) alors max(reponse(habitat_2), 2/10) + 1/10 \n',
        description:
          "<p>Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de politique du logement et du cadre de vie, dans la limite de 2 points restant minimum.</p>\n<p>Si la commune participe au conseil d’administration d'un bailleur social, le potentiel, possiblement réduit est augmenté d'un point sur la 6.2.1</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.2.2',
        type: 'reduction',
        formule:
          'si identite(type, commune) alors max (reponse(habitat_2),1/6) \n',
        description:
          "<p>Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de politique du logement et du cadre de vie, dans la limite d'un point restant minimum.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.2.3',
        type: 'reduction',
        formule:
          'si identite(type, commune) alors max (reponse(habitat_2),0.5) \n',
        description:
          '<p>Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de politique du logement et du cadre de vie, dans la limite de 50 % des points.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.2.4',
        type: 'reduction',
        formule:
          'si identite(type, commune) alors max (reponse(dev_eco_2),2/8) \n',
        description:
          '<p>Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de développement économique, dans la limite de 2 points de potentiel restant.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.3.1',
        type: 'reduction',
        formule:
          'si identite(type, commune) alors max (reponse(dev_eco_2), 2/8) \n',
        description:
          '<p>Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de développement économique, dans la limite de 2 points de potentiel restant.</p>\n<p>En l’absence de tissu économique propice à l’émergence de projets d’écologie industrielle, le score de la 6.3.1.4 est réduit à 0 et son statut est &quot;non concerné&quot; : les 2 points liés sont affectés à la 6.3.1.3 et la 6.3.1.5.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.3.1.3',
        type: 'reduction',
        formule: 'si reponse(dev_eco_4,NON) alors 1.625\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.3.1.4',
        type: 'desactivation',
        formule: 'reponse(dev_eco_4,NON) \n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.3.1.4',
        type: 'reduction',
        formule: 'si reponse(dev_eco_4,NON) alors 0\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.3.1.4.4',
        type: 'desactivation',
        formule: 'identite(localisation, DOM)\n',
        description: '',
        modifiedAt: '2022-11-29 13:18:54.370179+00',
      },
      {
        actionId: 'cae_6.3.1.5',
        type: 'reduction',
        formule: 'si reponse(dev_eco_4,NON) alors 1.625\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.3.2',
        type: 'reduction',
        formule:
          'si identite(type, commune) alors max (reponse(tourisme_1),1/4) \nsinon si identite(type, EPCI) et reponse(tourisme_2, NON) alors 1/4 \n',
        description:
          "<p>Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de tourisme, dans la limite d'un point de potentiel restant.</p>\n<p>Pour les EPCI dont le territoire est très peu touristique (non dotés d’un office du tourisme, d'un syndicat d’initiative ou d'un bureau d’information touristique), le score est réduit à 1 point.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.4.1',
        type: 'reduction',
        formule: 'si reponse(SAU, OUI) alors 0.5 \n',
        description:
          '<p>Pour les collectivités possédant moins de 3 % de surfaces agricoles, le score de la 6.4.1 est réduit de 50 %.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.4.1.6',
        type: 'reduction',
        formule: 'si identite(localisation, DOM) alors 4/3\n',
        description:
          '<p>La note du référentiel actuel est à 15 %. Pour les collectivités DOM, la note de la sous-action passe à 20 %.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.4.1.6.4',
        type: 'desactivation',
        formule: 'identite(localisation, Metropole)\n',
        description:
          '<p>Dans les DOM, les mesures spécifiques DOM plan Ecophyto sont déclinées/soutenues localement donc désactivée pour les collectivités en métropole.</p>\n',
        modifiedAt: '2023-10-27 09:19:16.433221+00',
      },
      {
        actionId: 'cae_6.4.1.8',
        type: 'reduction',
        formule: 'si identite(localisation, DOM) alors 2/3\n',
        description:
          '<p>La note du référentiel actuel est à 15 %. Pour les collectivités DOM, la note de la sous-action passe à 10 %.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.4.2',
        type: 'reduction',
        formule: 'si reponse(foret, OUI) alors 0.5\n',
        description:
          '<p>Pour les collectivités possédant moins de 10 % de surfaces agricoles, le score de la 6.4.2 est réduit de 50 %.</p>\n',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.5.2',
        type: 'reduction',
        formule: 'si reponse(dev_eco_3, NON) alors 5/6 \n',
        description:
          "<p>Pour une collectivité non responsable de la publicité et des enseignes, le statut de la tâche 6.5.2.5 est &quot;non concernée&quot; et le score de la 6.5.2 est réduit d'un point.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.5.2.5',
        type: 'desactivation',
        formule: 'reponse(dev_eco_3, NON)\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.5.3',
        type: 'desactivation',
        formule: 'reponse(scolaire_2, NON)\n',
        description:
          "<p>Si le territoire de la collectivité ne compte aucun établissement scolaire ou structure d’accueil de jeunes enfants sur le territoire, le score de l'action 6.5.3 est réduit à 0.</p>\n<p>Si la collectivité n’est pas en charge des écoles, le score de l'action 6.5.3 est 'reduit de 50 % : le reste du potentiel est maintenu pour la compétence « soutien aux actions de maîtrise de la demande d'énergie » que la collectivité peut prendre de manière facultative.</p>\n",
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
      {
        actionId: 'cae_6.5.3',
        type: 'reduction',
        formule:
          'si reponse(scolaire_2, NON) alors 0\nsinon si reponse(scolaire_1, NON) alors 0.5\n',
        description: '',
        modifiedAt: '2022-10-13 16:34:22.831904+00',
      },
    ],
  };

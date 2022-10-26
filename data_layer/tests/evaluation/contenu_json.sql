begin;
select plan(4);

truncate personnalisations_json;
truncate question cascade;
truncate personnalisation cascade;

select is_empty(
               'select * from question_choix',
               'Il devrait ne plus y avoir de choix'
           );

insert into personnalisations_json (questions, regles)
values ('
        [
          {
            "id": "tourisme_1",
            "type": "proportion",
            "action_ids": [
              "cae_6.3.2"
            ],
            "formulation": "Quelle est la part de la collectivit\u00e9 dans la structure comp\u00e9tente en mati\u00e8re de tourisme ?",
            "description": "",
            "thematique_id": "tourisme",
            "ordonnnancement": null,
            "types_collectivites_concernees": [
              "commune"
            ],
            "choix": null
          },
          {
            "id": "tourisme_2",
            "type": "binaire",
            "action_ids": [
              "cae_6.3.2"
            ],
            "formulation": "Le territoire est-il touristique (dot\u00e9 d''un office de tourisme, d''un syndicat d''initiative, d''un bureau d''information touristique) ?",
            "description": "",
            "thematique_id": "tourisme",
            "ordonnnancement": null,
            "types_collectivites_concernees": null,
            "choix": null
          },
          {
            "id": "EP_1",
            "type": "choix",
            "action_ids": [
              "cae_2.3.1"
            ],
            "formulation": "La collectivit\u00e9 a-t-elle la comp\u00e9tence \"\u00e9clairage public\" ?",
            "description": "",
            "thematique_id": "energie",
            "ordonnnancement": null,
            "types_collectivites_concernees": null,
            "choix": [
              {
                "id": "EP_1_a",
                "formulation": "Oui sur l''ensemble du territoire",
                "ordonnancement": null
              },
              {
                "id": "EP_1_b",
                "formulation": "Oui partiellement (uniquement sur les zones d''int\u00e9r\u00eat communautaire par exemple)",
                "ordonnancement": null
              },
              {
                "id": "EP_1_c",
                "formulation": "Non pas du tout",
                "ordonnancement": null
              }
            ]
          }
        ]
        '::jsonb,
        '[
          {
            "action_id": "cae_4.1.1",
            "regles": [
              {
                "formule": "max(reponse(AOM_2), 0.5) \n",
                "type": "reduction",
                "description": "<p>Pour une collectivit\u00e9 non AOM, le score est proportionnel \u00e0 la participation dans la structure AOM dans la limite de 50 %.</p>\n"
              }
            ],
            "titre": "R\u00e9duction potentiel cae 4.1.1 liee AMO",
            "description": ""
          },
          {
            "action_id": "cae_4.1.2.1",
            "regles": [
              {
                "formule": "reponse(vehiculeCT_1, NON)\n",
                "type": "desactivation",
                "description": ""
              }
            ],
            "titre": "D\u00e9sactivation cae 4.1.2.1 liee mobilit\u00e9 interne",
            "description": ""
          }
        ]
        '::jsonb);


select bag_eq(
               'select id from question q;',
               'select (jsonb_array_elements(pj.questions)) ->> ''id'' as id from personnalisations_json pj;',
               'Tous les id des questions devraient être dans la table `question`'
           );

select bag_eq(
               'select formule from personnalisation_regle pr;',
               'select jsonb_array_elements(r.data) ->> ''formule''
                from (select jsonb_array_elements(pj.regles) -> ''regles'' as data from personnalisations_json pj) r;',
               'Toutes les formules devraient être dans la table `personnalisation_regle`'
           );

select bag_eq(
               'select formulation from question_choix;',
               'select jsonb_array_elements(r.data) ->> ''formulation'' from (select jsonb_array_elements(pj.questions) -> ''choix'' as data from personnalisations_json pj) r
                where r.data != ''null'';',
               'Toutes les formulations des choix devraient être dans la table `question_choix`'
           );

rollback;

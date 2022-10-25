begin;
select plan(4);

truncate indicateurs_json;
truncate indicateur_definition cascade;

select is_empty(
               'select * from indicateurs_json',
               'Il devrait ne plus y avoir de contenu '
           );

insert into indicateurs_json (indicateurs)
values ('
[
  {
    "indicateur_id": "eci_8",
    "identifiant": 8,
    "indicateur_group": "eci",
    "nom": "Taux de mise en décharge de DMA(%)",
    "unite": "%",
    "action_ids": null,
    "description": "<p>Poids de déchets envoyés en décharge / Poids de déchets produits sur le territoire</p>\n",
    "valeur_indicateur": null,
    "obligation_eci": false
  },
  {
    "indicateur_id": "eci_18",
    "identifiant": 18,
    "indicateur_group": "eci",
    "nom": "Nombre de synergies d''Ecologie Industrielle et Territoriale (EIT) opérationnelles sur le territoire (nombre)",
    "unite": "nombre",
    "action_ids": [
      "eci_3.5"
    ],
    "description": "<p>Synergie est considérée comme opérationnelle à partir d&#x27;au moins un échange matière réalisé ou d&#x27;un service de mutualisation utilisé par au moins deux entités</p>\n",
    "valeur_indicateur": null,
    "obligation_eci": false
  }
]
'::jsonb);

select isnt_empty(
               'select * from indicateurs_json',
               'Les indicateurs au format json devraient être présents'
           );

select results_eq(
               'select action_id, indicateur_id from indicateur_action where action_id = ''eci_3.5'' and indicateur_id = ''eci_18'';',
               'select ''eci_3.5''::action_id, ''eci_18''::indicateur_id;',
               'La relation eci_3.5 -> eci_18 devrait être dans la table `indicateur_action`'
           );

select bag_eq(
               'select (jsonb_array_elements( indicateurs )) ->> ''nom'' from indicateurs_json;',
               'select nom from indicateur_definition;',
               'Tous les noms des indicateurs devraient être dans la table `indicateur_definition`'
           );

rollback;

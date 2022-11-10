begin;
select plan(4);

truncate indicateurs_terristory_json;

select is_empty(
               'select * from indicateurs_terristory_json',
               'Il devrait ne plus y avoir de contenu '
           );

insert into indicateurs_terristory_json (indicateurs)
values ('
{
  "type":"test",
  "contenu":[
      {
        "code": "200000172",
        "nom": "CC Faucigny-Gli\u00e8res",
        "x": 715564.0,
        "y": 5786687.0,
        "val": 794.0,
        "confidentiel": false,
        "annee": "2019"
      },
      {
        "code": "200011773",
        "nom": "CA Annemasse-Les Voirons-Agglom\u00e9ration",
        "x": 701943.0,
        "y": 5814170.0,
        "val": 1743.0,
        "confidentiel": false,
        "annee": "2019"
      }
  ]
}
'::jsonb);

select isnt_empty(
               'select * from indicateurs_terristory_json',
               'Les indicateurs terristory au format json devraient être présents'
           );

prepare thrower_indicateur_terristory_json_type_different as
    insert into indicateurs_terristory_json (indicateurs)
    values ('
    {
      "type":"test",
      "contenu":[
        {
          "code": "200000172",
          "nom": "CC Faucigny-Gli\u00e8res",
          "x": "pas ok",
          "y": 5786687.0,
          "val": 794.0,
          "confidentiel": false,
          "annee": "2019"
        }
      ]
    }
    '::jsonb);
select throws_ok(
               'thrower_indicateur_terristory_json_type_different',
               'new row for relation "indicateurs_terristory_json" violates check constraint "indicateurs_terristory_json_indicateurs_check"',
               'Les données json insérées de devrait pas être valide car le mauvais type pour x est donné.'
 );

prepare thrower_indicateur_terristory_json_attribut_manquant as
    insert into indicateurs_terristory_json (indicateurs)
    values ('
    {
      "type":"test",
      "contenu":[
        {
          "code": "200000172",
          "nom": "CC Faucigny-Gli\u00e8res",
          "y": 5786687.0,
          "val": 794.0,
          "confidentiel": false,
          "annee": "2019"
        }
      ]
    }
    '::jsonb);
select throws_ok(
               'thrower_indicateur_terristory_json_attribut_manquant',
               'new row for relation "indicateurs_terristory_json" violates check constraint "indicateurs_terristory_json_indicateurs_check"',
               'Les données json insérées de devrait pas être valide car un attribut est manquant.'
           );


rollback;
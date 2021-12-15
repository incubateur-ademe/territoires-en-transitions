insert into collectivite
values (1, 'yolo');

insert into action_relation(id, referentiel, parent)
values ('root', 'cae', null);

insert into indicateur_definition
values (default,
        'ind0',
        '0',
        'Radioactivité',
        'sv');

insert into indicateur_personnalise_definition
values (default,
        1,
        1,
        'Voltage',
        'Tension',
        'V',
        'commentaire');



insert into fiche_action
(collectivite_id,
 avancement,
 numeration,
 titre,
 description,
 structure_pilote,
 personne_referente,
 elu_referent,
 partenaires,
 budget_global,
 commentaire,
 date_fin,
 date_debut,
 action_ids,
 indicateur_ids,
 indicateur_personnalise_ids)
values (1,
        'pas_fait',
        'A0',
        'titre',
        'description',
        'pilote',
        'référente',
        'référent',
        'partenaires',
        '€',
        'commentaire',
        'fin',
        'début',
        array ['root']::action_id[],
        array ['ind0']::indicateur_id[],
        array [1]::integer[]);


select *
from fiche_action;
select *
from fiche_action_action;
select *
from fiche_action_indicateur;
select *
from fiche_action_indicateur_personnalise;

begin;
select plan(8);

-- Ce que le calcul des périmètres EPCI garantit : le siège donne le périmètre
-- principal, chaque autre département des communes membres donne un périmètre
-- secondaire, les régions suivent, et le rejeu ne touche que ses propres lignes.
--
-- Les codes géographiques sont ici les vrais : `imports.epci_commune` a une clé
-- étrangère vers `imports.departement`, ce qui interdit les codes en lettres
-- qu'emploient les autres fixtures. Ce sont ceux de Redon Agglomération — siège
-- en Ille-et-Vilaine, communes en Loire-Atlantique et dans le Morbihan, donc à
-- cheval sur la Bretagne (53) et les Pays de la Loire (52) — mais le SIREN et
-- les codes communes sont inventés : c'est un Redon miniature, pas le vrai.

insert into collectivite (nom, type, siren)
values ('EPCI témoin de la composition communale', 'epci', '999999999');

create temporary view sujet as
select id from collectivite where type = 'epci' and siren = '999999999';

insert into imports.epci_commune (siren_epci, insee_commune, departement_code, siege_departement_code)
values ('999999999', '99001', '35', '35'),
       ('999999999', '99002', '44', '35'),
       ('999999999', '99003', '56', '35');

select imports.update_epci_perimetres_from_banatic();

select is(
    (select c.departement_code || '/' || c.region_code
       from collectivite c join sujet s on s.id = c.id),
    '35/53',
    'le périmètre principal est celui du siège, région comprise'
);

select is(
    (select array_agg(p.departement_code::text order by p.departement_code)
       from collectivite_perimetre_secondaire p
       join sujet s on s.id = p.collectivite_id
      where p.source = 'banatic' and p.departement_code is not null),
    array['44', '56'],
    'chaque département des communes membres autre que le siège devient secondaire'
);

select is(
    (select array_agg(p.region_code::text order by p.region_code)
       from collectivite_perimetre_secondaire p
       join sujet s on s.id = p.collectivite_id
      where p.source = 'banatic' and p.region_code is not null),
    array['52'],
    'les régions suivent les départements, sans redire la principale'
);

-- Le rejeu est ce qui tourne chaque année : il doit être sans effet quand la
-- source n'a pas bougé.
select imports.update_epci_perimetres_from_banatic();

select is(
    (select count(*)::int from collectivite_perimetre_secondaire p
       join sujet s on s.id = p.collectivite_id
      where p.source = 'banatic'),
    3,
    'rejouer le calcul sur la même source ne duplique rien'
);

select is(
    (select count(*)::int
       from collectivite_perimetre_secondaire p
       join collectivite c on c.id = p.collectivite_id
      where p.source = 'banatic'
        and (p.departement_code = c.departement_code or p.region_code = c.region_code)),
    0,
    'aucun périmètre secondaire ne répète le principal'
);

-- L'autre producteur vient d'un classeur et ne se recalcule pas : le rejeu ne
-- doit pas l'emporter. C'est la raison d'être de la colonne `source`.
insert into collectivite_perimetre_secondaire (collectivite_id, region_code, source)
select id, '11', 'import_service_etat' from sujet;

select imports.update_epci_perimetres_from_banatic();

select is(
    (select count(*)::int from collectivite_perimetre_secondaire p
       join sujet s on s.id = p.collectivite_id
      where p.source = 'import_service_etat' and p.region_code = '11'),
    1,
    'le rejeu banatic laisse intactes les lignes de l''import des services de l''État'
);

-- Les index uniques ne portent pas `source` : un code déjà tenu par l'autre
-- producteur ferait échouer l'insertion sans le `on conflict do nothing`.
delete from collectivite_perimetre_secondaire p
 where p.source = 'banatic'
   and p.departement_code = '44'
   and p.collectivite_id in (select id from sujet);

insert into collectivite_perimetre_secondaire (collectivite_id, departement_code, source)
select id, '44', 'import_service_etat' from sujet;

select lives_ok(
    $$ select imports.update_epci_perimetres_from_banatic() $$,
    'un département déjà déclaré par l''autre producteur ne fait pas échouer le rejeu'
);

-- Un siège absent de la composition rendrait le périmètre principal faux, et
-- les secondaires se calculeraient contre lui. Le calcul refuse plutôt d'écrire.
insert into collectivite (nom, type, siren)
values ('EPCI témoin au siège incohérent', 'epci', '999999998');

insert into imports.epci_commune (siren_epci, insee_commune, departement_code, siege_departement_code)
values ('999999998', '99010', '44', '35');

select throws_ok(
    $$ select imports.update_epci_perimetres_from_banatic() $$,
    'P0001',
    null,
    'un siège absent des communes membres interrompt le calcul'
);

select * from finish();
rollback;

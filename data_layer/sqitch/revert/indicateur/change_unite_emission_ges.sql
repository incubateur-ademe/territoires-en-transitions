-- Revert tet:indicateur/change_unite_emission_ges from pg

BEGIN;

update indicateur_valeur
set 
resultat = case 
	when resultat is null then null 
	else resultat*1000
end,
objectif  = case 
	when objectif is null then null 
	else objectif*1000
end
where indicateur_valeur.id in (
select 
indicateur_valeur.id
from indicateur_valeur
left join indicateur_definition on indicateur_valeur.indicateur_id = indicateur_definition.id
where indicateur_definition.identifiant_referentiel in ('cae_1.h', 'cae_1.aa', 'cae_1.ca', 'cae_1.cc', 'cae_1.cb', 'cae_1.csc', 'cae_1.da', 'cae_1.db', 'cae_1.ea', 'cae_1.k', 'cae_1.a', 'cae_1.c', 'cae_1.d', 'cae_1.e', 'cae_1.f', 'cae_1.g', 'cae_1.i', 'cae_1.j', 'cae_1.eb', 'cae_1.ga', 'cae_1.gb', 'cae_1.gc', 'cae_1.ia', 'cae_1.ib', 'cae_1.ic', 'cae_1.id', 'cae_1.ie', 'cae_1.if', 'cae_1.ig' )
and (indicateur_valeur.collectivite_id not in (3881, 5096, 3924, 4745, 4028, 4546, 4879, 4063, 3851, 4022, 4097, 4436) or indicateur_valeur.metadonnee_id is not null));

update indicateur_valeur
set 
resultat = case 
	when resultat is null then null 
	else resultat*1000
end,
objectif  = case 
	when objectif is null then null 
	else objectif*1000
end
where indicateur_valeur.id in (
select 
indicateur_valeur.id
from indicateur_valeur
left join indicateur_definition on indicateur_valeur.indicateur_id = indicateur_definition.id
where indicateur_definition.identifiant_referentiel in ('cae_63.e', 'cae_63.b', 'cae_63.a', 'cae_63.c', 'cae_63.d', 'cae_63.ca', 'cae_63.cb', 'cae_63.cc', 'cae_63.cd', 'cae_63.da', 'cae_63.db')
and (indicateur_valeur.collectivite_id not in (3995, 4020, 4063, 4103, 4216, 4220, 4226, 4464, 4520, 4546, 4590, 4740, 4967, 4997, 5003, 5077, 5189, 5195, 5269, 5307, 5384) or indicateur_valeur.metadonnee_id is not null));

COMMIT;

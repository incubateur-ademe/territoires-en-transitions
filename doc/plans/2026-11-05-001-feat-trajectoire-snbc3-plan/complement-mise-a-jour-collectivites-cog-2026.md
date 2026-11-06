---
title: 'Complément — Mise à jour des communes et des EPCI de TeT au COG 2026'
parent: ./README.md
kind: complement
updated: 2026-11-08
---

# Complément : mise à jour des communes et des EPCI de TeT au COG 2026

> Indépendant de la trajectoire SNBC 3. Il est né des vérifications de jointure du plan général (section « Jointure »), mais il ne dépend d'aucun lot, et aucun lot n'en dépend.
> But : remettre la prod en accord avec le découpage au 01/01/2026, au plus simple. Une opération ponctuelle en SQL, sans nouveau code ni endpoint.

## Contexte

Les constats ont été faits le 08/11 sur la base locale (prod restaurée le 02/11) et sur l'export de `collectivite_relations` de prod du 08/11 (5 587 lignes). Les `id` cités sont ceux de la prod. L'étape 0 les revérifie avant toute écriture.

| Donnée | État actuel | Écart avec le 01/01/2026 |
|---|---|---|
| `imports.commune` (référentiel utilisé à la création d'une commune) | COG 2023 | 81 communes disparues depuis, 11 communes créées en 2024 et 2025 absentes, libellés tronqués à 30 caractères |
| Fiches `collectivite` de type `commune` (3 868) | créées au fil des inscriptions | 4 fiches obsolètes, 1 fiche au code faux, 17 noms périmés |
| Fiches `collectivite` des EPCI à fiscalité propre | à jour des fusions de 2026 (6031 et 6860 existent) | 4 EPCI fermés, 6 natures fausses, une trentaine de renommages |
| `collectivite_relations` (commune → EPCI) | import Banatic 2025, communes de 3 000 habitants et plus | 12 relations vers les anciennes CA de Thionville, 129 communes sans EPCI parent |

Sources :
- COG 2026, liste des communes : https://www.insee.fr/fr/statistiques/fichier/8740222/v_commune_2026.csv
- COG 2026, mouvements de communes depuis 1943 : https://www.insee.fr/fr/statistiques/fichier/8740222/v_mvt_commune_2026.csv
- Composition communale des EPCI au 01/01/2026 (INSEE, mise en ligne le 19/03/2026) : https://www.insee.fr/fr/information/2510634, fichier https://www.insee.fr/fr/statistiques/fichier/2510634/EPCI_au_01-01-2026.zip
- Codes, noms, départements et populations des communes : https://geo.api.gouv.fr/communes et `?type=arrondissement-municipal`. L'API donne les codes communes du COG 2026, mais elle rattache encore les communes aux EPCI de 2025 : on ne s'en sert pas pour les EPCI.
- Noms courts des EPCI : https://geo.api.gouv.fr/epcis (au format de TeT, mais au découpage 2025).
- État des SIREN (fermeture, création) : https://recherche-entreprises.api.gouv.fr/search?q=<SIREN>

## Principes

- **Aucune suppression de fiche.** Toutes les fiches concernées ont des valeurs d'indicateurs (open data), et `collectivite` est référencée par des centaines de clés étrangères, la plupart sans `on delete cascade`. On garde les `id`, et on renomme ou corrige en place.
- **Une transaction par étape**, précédée d'un `select` qui montre les lignes touchées. On compare les comptes avec ceux de ce plan avant le `commit`.
- **Ordre** : étapes 1, 2 et 3 dans n'importe quel ordre, puis l'étape 4, qui s'appuie sur les codes corrigés à l'étape 2 et sur la nature de la 6031 corrigée à l'étape 3.

## Étape 0 : préparer les fichiers et vérifier la prod

**Fichiers**, préparés en local, puis chargés par `\copy` dans des tables temporaires de la session psql de prod. Le xlsx INSEE a une feuille de styles invalide : openpyxl ne le lit qu'une fois `xl/styles.xml` retiré.

```sh
mkdir -p /tmp/cog2026 && cd /tmp/cog2026
curl -sO 'https://www.insee.fr/fr/statistiques/fichier/2510634/EPCI_au_01-01-2026.zip' && unzip -o EPCI_au_01-01-2026.zip
cp EPCI_au_01-01-2026.xlsx epci.xlsx && zip -q -d epci.xlsx xl/styles.xml
curl -s 'https://geo.api.gouv.fr/communes?fields=code,nom,codeDepartement,codeRegion,population&format=json' -o communes.json
curl -s 'https://geo.api.gouv.fr/communes?type=arrondissement-municipal&fields=code,nom,codeDepartement,codeRegion,population&format=json' -o arrondissements.json

uv run --with pandas --with openpyxl python - <<'EOF'
import json, pandas as pd

def feuille(nom, cle):
    raw = pd.read_excel('epci.xlsx', sheet_name=nom, header=None, dtype=str)
    h = raw.index[raw.iloc[:, 0] == cle][0]
    df = raw.iloc[h + 1:].copy()
    df.columns = raw.iloc[h]
    return df

compo = feuille('Composition_communale', 'CODGEO')
compo = compo[compo.EPCI != 'ZZZZZZZZZ']  # 4 îles sans EPCI
compo[['CODGEO', 'EPCI']].to_csv('epci_commune_2026.csv', index=False, header=False)

com = pd.concat([pd.DataFrame(json.load(open(f))) for f in ('communes.json', 'arrondissements.json')])
com = com[~com.code.str.match(r'^(97[5-8]|98)')]  # COM et TOM, absents du COG des communes
com['population'] = com.population.fillna(0).astype(int)
com[['code', 'codeRegion', 'codeDepartement', 'nom', 'population']].to_csv('communes_2026.csv', index=False, header=False)
print(len(compo), 'rattachements,', len(com), 'communes et arrondissements')
EOF
```

Attendu : 34 871 rattachements, 34 920 communes et arrondissements (soit les 34 875 communes du COG 2026 et les 45 arrondissements de Paris, Lyon et Marseille).

```sql
create temp table tmp_epci_commune (insee text primary key, siren text not null);
\copy tmp_epci_commune from '/tmp/cog2026/epci_commune_2026.csv' csv
create temp table tmp_commune (code text primary key, region_code text, departement_code text, libelle text, population int);
\copy tmp_commune from '/tmp/cog2026/communes_2026.csv' csv
```

**Vérifications en prod** :

```sql
-- les fiches à modifier, avec leurs membres actifs
select c.id, c.nom, c.type, c.nature_insee, c.siren, c.commune_code, c.region_code,
       (select count(*) from private_utilisateur_droit d where d.collectivite_id = c.id and d.active) as membres
from collectivite c
where c.id in (1662, 2612, 2613, 2615, 3592, 3597, 5545,
               3971, 3973, 4748, 4749, 6031, 6860,
               5287, 5288, 4800, 4291, 4372)
order by c.id;
```

```sql
-- relations commune → EPCI qui changeront à l'étape 4, en lecture seule
-- après les étapes 2 et 3, attendu : 12 à corriger, 129 à ajouter
select count(*) filter (where r.parent_id is null) as a_ajouter,
       count(*) filter (where r.parent_id <> e.id) as a_corriger
from collectivite c
join tmp_epci_commune t on t.insee = c.commune_code
join collectivite e on e.siren = t.siren and e.type = 'epci' and e.nature_insee in ('CC', 'CA', 'CU', 'METRO')
left join (select r.id, r.parent_id from collectivite_relations r
           join collectivite p on p.id = r.parent_id and p.nature_insee in ('CC', 'CA', 'CU', 'METRO')) r on r.id = c.id
where c.type = 'commune';
```

Avant les étapes 2 et 3, on attend 127 à ajouter et 0 à corriger : les codes d'Orée d'Anjou et de Porte des Pierres Dorées ne sont pas encore corrigés, et les 12 communes de Thionville-Fensch ne trouvent pas la 6031 tant que sa nature est vide. Comptes vérifiés le 08/11 sur la base locale chargée avec l'export de prod, étape 4 comprise (12 suppressions, 141 insertions, 5 716 relations à la fin).

## Étape 1 : recharger `imports.commune`

Aucune table ni vue ne dépend de `imports.commune`. Un rechargement complet suffit.

```sql
begin;
truncate imports.commune;
insert into imports.commune (code, region_code, departement_code, libelle, population)
select code, region_code, departement_code, left(libelle, 30), population
from tmp_commune;
select count(*) from imports.commune;  -- attendu : 34 920
commit;
```

- **Libellés de plus de 30 caractères** (49 communes, par exemple « Saint-Laurent-les-Bains-Laval-d'Aurelle ») : ils restent tronqués, comme aujourd'hui, parce que la colonne est en `varchar(30)`. Les garder entiers demanderait une migration sqitch et une modification de `imports-commune.table.ts` (décision 1).
- **Populations** : ce sont les populations légales que publie geo.api.gouv.fr. Le millésime n'est pas précisé par l'API.
- **Fiches de commune existantes** : on aligne leur département, leur région et leur population sur le nouveau référentiel :

```sql
begin;
update collectivite c
set departement_code = i.departement_code, region_code = i.region_code, population = i.population
from imports.commune i
where c.type = 'commune' and c.commune_code = i.code
  and (c.departement_code, c.region_code, c.population) is distinct from (i.departement_code, i.region_code, i.population);
commit;
```

À lancer après l'étape 2, pour que les deux codes corrigés en profitent.

## Étape 2 : fiches de commune

**Codes changés** (la fiche et son SIREN restent les mêmes) :

| Fiche | Avant | Après | Événement COG | Membres |
|---|---|---|---|---|
| Orée d'Anjou (1662) | `49069` | `49126` | changement de code au 01/01/2025 | 5 |
| Porte des Pierres Dorées (2615) | `69159` | `69114` | changement de chef-lieu au 15/03/2024 | 0 |

```sql
update collectivite set commune_code = '49126' where id = 1662 and commune_code = '49069';
update collectivite set commune_code = '69114' where id = 2615 and commune_code = '69159';
```

**Communes fusionnées** : la fiche absorbée est gardée (valeurs d'indicateurs), sans membre ni fiche action. Elle n'a pas de relation vers un EPCI.

| Fiche absorbée | Fusionnée dans | Date |
|---|---|---|
| Pierre-Bénite (2613, `69152`) | Oullins-Pierre-Bénite (2612, `69149`) | 01/01/2024 |
| Pierrefitte-sur-Seine (3592, `93059`) | Saint-Denis (3597, `93066`) | 01/01/2025 |

Il faut décider comment la signaler (décision 2). Proposition : suffixer son nom, par exemple « Pierre-Bénite (fusionnée dans Oullins-Pierre-Bénite) », pour qu'aucun utilisateur ne s'y inscrive par erreur.

**Fiche au code faux** : la fiche 5545 « Maisonsgoutte » (créée le 29/11/2023, 1 membre) porte le code `67220`, le SIREN `216702209` et la population (345) d'Ingenheim. Maisonsgoutte, c'est le code `67280` et le SIREN `216702803`. Il faut d'abord savoir quelle commune représente le membre (décision 3), puis corriger soit le nom, soit le code, le SIREN et la population.

**Noms périmés** (même code, nom changé au COG) :

| Fiche | Nom TeT | Nom COG 2026 |
|---|---|---|
| 15 | Culoz | Culoz-Béon |
| 372 | Le Hom | Thury-Harcourt-le-Hom |
| 665 | Commune nouvelle d'Arrou | Vald'Yerre |
| 1493 | Grandchamps-des-Fontaines | Grandchamp-des-Fontaines |
| 2599 | Grigny | Grigny-sur-Rhône |
| 2612 | Oullins | Oullins-Pierre-Bénite |
| 2701 | Louhans | Louhans-Châteaurenaud |
| 2898 | Oissel | Oissel-sur-Seine |
| 3307 | Cugand | Cugand-la-Bernardière |
| 3309 | Essarts en Bocage | Essarts-en-Bocage |
| 3335 | Sainte-Hermine | Saint-Jean-d'Hermine |
| 3411 | Capavenir Vosges | Thaon-les-Vosges |
| 3671 | Éragny | Éragny-sur-Oise |
| 5523 | COMMUNE DE GALLUIS | Galluis |
| 5528 | Le Foeil | Le Fœil |
| 5570 | Le Minihic Sur Rance | Le Minihic-sur-Rance |
| 5636 | `Sainte-Colombe ` (espace final) | Sainte-Colombe |

```sql
update collectivite c set nom = v.nom
from (values (15, 'Culoz-Béon'), (372, 'Thury-Harcourt-le-Hom'), (665, 'Vald''Yerre'),
             (1493, 'Grandchamp-des-Fontaines'), (2599, 'Grigny-sur-Rhône'), (2612, 'Oullins-Pierre-Bénite'),
             (2701, 'Louhans-Châteaurenaud'), (2898, 'Oissel-sur-Seine'), (3307, 'Cugand-la-Bernardière'),
             (3309, 'Essarts-en-Bocage'), (3335, 'Saint-Jean-d''Hermine'), (3411, 'Thaon-les-Vosges'),
             (3671, 'Éragny-sur-Oise'), (5523, 'Galluis'), (5528, 'Le Fœil'),
             (5570, 'Le Minihic-sur-Rance'), (5636, 'Sainte-Colombe')) as v(id, nom)
where c.id = v.id and c.type = 'commune';
-- attendu : 17 lignes
```

Les noms choisis volontairement sont laissés tels quels : « Ville de Marseille » (5499), « Ville de Lyon » (5482), « Ville et Eurométropole de Strasbourg - public » (2518), « Saint-Denis (93) » (3597).

## Étape 3 : fiches d'EPCI

**Natures**, d'après la liste des EPCI INSEE au 01/01/2026 :

| Fiche | Nom TeT | Nature TeT | Nature 2026 | Nom à donner |
|---|---|---|---|---|
| 6031 | Thionville Fensch Agglomération | vide | CA | inchangé |
| 5287 | Pays de Saint Gilles Croix de Vie Agglomération | CC | CA | CA du Pays de Saint-Gilles-Croix-de-Vie |
| 5288 | CA Terres de Montaigu | CC | CA | inchangé |
| 4800 | CC Coeur d'Ostrevent (CCCO) | CC | CA | CA Cœur d'Ostrevent |
| 4291 | Grand Ouest Toulousain | CC | CA | CA Le Grand Ouest Toulousain |
| 4372 | CC du Pays de Lunel | CC | CA | CA Lunel Agglo |

```sql
update collectivite set nature_insee = 'CA' where id in (6031, 5287, 5288, 4800, 4291, 4372);
update collectivite c set nom = v.nom
from (values (5287, 'CA du Pays de Saint-Gilles-Croix-de-Vie'), (4800, 'CA Cœur d''Ostrevent'),
             (4291, 'CA Le Grand Ouest Toulousain'), (4372, 'CA Lunel Agglo')) as v(id, nom)
where c.id = v.id;
update collectivite set region_code = '76' where id = 6860 and region_code is null;  -- CC du Lévézou, Aveyron
```

**Renommages** : nom TeT comparé à geo.api.gouv.fr. Il y a 93 écarts, dont environ 65 de pure forme (accents, tirets, préfixe « CC » ou « CA » manquant). Les renommages réels sont listés ci-dessous. geo.api étant au découpage 2025, un renommage de 2026 sans changement de nature n'y apparaît pas.

| Fiche | Nom TeT | Nom actuel |
|---|---|---|
| 3924 | CA Pays Foix-Varilhes | CA L'Agglo Foix-Varilhes |
| 4025 | CA de Saintes | CA "Saintes - Grandes Rives - L'Agglo" |
| 4055 | CC Fercher Pays Florentais | CC FerCher |
| 4086 | CC de Saulieu | CC de Saulieu-Morvan |
| 4132 | CC du Terrassonnais en Périgord Noir Thenon Hautefort | CC Terrassonnais Haut Périgord Noir |
| 4151 | CC de Montbenoit | CC Entre Doubs et Loue |
| 4288 | CC Lauragais Revel Sorezois | CC Aux sources du Canal du Midi |
| 4340 | CC du Secteur de Saint-Loubès | CC Les Rives de la Laurence |
| 4412 | CC de la Région de Levroux | CC Levroux Boischaut Champagne |
| 4428 | CC de Gâtine et Choisilles - Pays de Racan | CC de Gâtine-Racan |
| 4430 | CC de Bléré Val de Cher | CC Autour de Chenonceaux Bléré-Val de Cher |
| 4451 | CC des Collines du Nord Dauphiné | CC Collines Isère Nord Communauté |
| 4556 | CC de la Région de Blain | CC du Pays de Blain |
| 4601 | CA d'Agen | CA Agglomération d'Agen |
| 4613 | CC du Haut Allier | CC du Haut Allier Margeride |
| 4673 | CA de Saint-Dizier Der et Blaise | CA du Grand Saint-Dizier Der et Vallées |
| 5051 | CC Loué - Brûlon - Noyen | CC LBN Communauté |
| 5062 | CC du Sud Est du Pays Manceau | CC du Sud Est Manceau |
| 5125 | CC des 4 rivières | CC des Quatre Rivières en Bray |
| 5127 | CC Plateau de Caux-Doudeville-Yerville | CC Plateau de Caux |
| 5229 | CC des Monts de Lacaune et de la Montagne du Haut Languedoc | CC du Haut-Languedoc |
| 5242 | CC Coteaux et Plaines du Pays Lafrançaisain | CC du Pays de Lafrançaise |
| 5276 | CC du Pays Réuni d'Orange | CC Pays d'Orange en Provence |

Ces 23 renommages s'appliquent avec le même `update … from (values …)` que pour les communes. Il faut décider s'il faut aussi corriger les écarts de forme (décision 4). La liste complète s'obtient en comparant `collectivite.nom` à `https://geo.api.gouv.fr/epcis?fields=code,nom` par SIREN.

**EPCI fermés au 01/01/2026** :

| Fiche | Fusionnée dans | Membres actifs | Fiches action | Syndicat dont elle est membre |
|---|---|---|---|---|
| CC du Pays de Salars (3971) | CC du Lévézou (6860) | 0 | 0 | SYDOM Aveyron (3978) |
| CC de Lévézou Pareloup (3973) | CC du Lévézou (6860) | 0 | 0 | SYDOM Aveyron (3978) |
| CA du Val de Fensch (4748) | Thionville Fensch Agglomération (6031) | 5 | 0 actives (3 supprimées) | SYDELON (4767) |
| CA Portes de France-Thionville (4749) | Thionville Fensch Agglomération (6031) | 8 | 73 | SYDELON (4767) |

- Les fiches sont gardées. Leurs relations commune → EPCI passent à la 6031 à l'étape 4. Les communes du Lévézou ont toutes moins de 3 000 habitants : aucune n'est dans TeT.
- Il faut décider comment les signaler et que faire des membres de 4748 et 4749 (décision 5). La 6031 a déjà 9 membres et 73 fiches actives : l'équipe s'est vraisemblablement réinscrite sur la nouvelle fiche. Proposition : suffixer leur nom, par exemple « CA Portes de France-Thionville (fusionnée dans Thionville Fensch Agglomération) », et prévenir leurs membres.
- **Syndicats** : le nouvel EPCI remplace en principe les anciens dans les syndicats dont ils étaient membres. C'est à confirmer sur Banatic avant d'écrire :

```sql
insert into collectivite_relations (id, parent_id) values (6860, 3978), (6031, 4767) on conflict do nothing;
delete from collectivite_relations where id in (3971, 3973, 4748, 4749) and parent_id in (3978, 4767);
```

**Hors EPCI** : la Collectivité territoriale de Martinique (5442, nature `CC`), la Collectivité de Saint-Martin (5657, `CU`) et la Province Nord (5661, `CC`) ne sont pas des EPCI, mais elles ont une nature d'EPCI. On n'y touche pas : changer leur nature pourrait leur retirer des fonctionnalités réservées aux EPCI.

## Étape 4 : relations commune → EPCI

On rattache chaque fiche de commune à l'EPCI de sa commune au 01/01/2026, sans seuil de population. L'import Banatic écartait les communes de moins de 3 000 habitants et n'a pas été rejoué pour les communes inscrites depuis.

```sql
begin;
create temp view tmp_cible as
select c.id as commune_id, e.id as epci_id
from collectivite c
join tmp_epci_commune t on t.insee = c.commune_code
join collectivite e on e.siren = t.siren and e.type = 'epci' and e.nature_insee in ('CC', 'CA', 'CU', 'METRO')
where c.type = 'commune';

-- relations vers un mauvais EPCI à fiscalité propre (attendu : 12, les communes de Thionville-Fensch)
delete from collectivite_relations r
using tmp_cible t, collectivite p
where r.id = t.commune_id and p.id = r.parent_id
  and p.nature_insee in ('CC', 'CA', 'CU', 'METRO') and r.parent_id <> t.epci_id;

-- relations manquantes (attendu : 141, soit 129 communes sans parent et les 12 de Thionville-Fensch ;
-- les 129 comptent la fiche 5545, rattachée selon son code après la décision 3)
insert into collectivite_relations (id, parent_id)
select commune_id, epci_id from tmp_cible
on conflict do nothing;
commit;
```

- Les relations vers les syndicats, les PETR et les pôles métropolitains ne sont pas touchées.
- Les arrondissements de Paris, Lyon et Marseille n'ont pas d'EPCI dans le fichier INSEE. Ils restent sans parent, comme aujourd'hui.
- Pierre-Bénite et Pierrefitte-sur-Seine ont disparu du COG : elles restent sans parent.
- Les 4 îles sans EPCI (Bréhat, Sein, Ouessant, Yeu) restent sans parent.
- La fiche de test « Klow (test) » (13858) garde sa relation vers « CC Equipe TET » (5556).

## Décisions à prendre

1. Libellés de plus de 30 caractères dans `imports.commune` : les garder tronqués (proposé, rien à faire) ou élargir la colonne (migration).
2. Communes absorbées (2613, 3592) : suffixer leur nom (proposé) ou les laisser telles quelles.
3. Fiche 5545 : Maisonsgoutte ou Ingenheim ? À trancher avec son membre.
4. Noms d'EPCI : les 23 renommages réels seulement (proposé), ou aussi la soixantaine d'écarts de forme.
5. EPCI fermés (3971, 3973, 4748, 4749) : suffixer leur nom (proposé) ; prévenir les 13 membres actifs de 4748 et 4749 ; confirmer sur Banatic le remplacement dans SYDOM Aveyron et SYDELON.

## Vérification

- `select count(*) from imports.commune` donne 34 920, et `select count(*) from imports.commune where code in ('49126', '12218', '14581', '93066')` donne 4.
- Plus aucune fiche de commune n'a un code absent de `imports.commune`, hors fiches de test :
  `select id, nom, commune_code from collectivite where type = 'commune' and commune_code is not null and commune_code not in (select code from imports.commune);` ne renvoie que Pierre-Bénite et Pierrefitte-sur-Seine.
- `select count(*) from collectivite where type = 'epci' and nature_insee is null and siren in (select siren from tmp_epci_commune)` donne 0.
- Aucune relation ne pointe vers 4748 ou 4749 depuis une commune.
- Sur l'interface, la fiche de Thionville affiche Thionville Fensch Agglomération comme EPCI, et la recherche de collectivité trouve « Orée d'Anjou » et « Oullins-Pierre-Bénite ».

#!/usr/bin/env python3
"""Régénère l'import des services de l'État depuis `seed/sources/service-etat/`.

Écrit **un seul** fichier, `seed/imports/09-service_etat.sql` : `seed.sh` le
charge sur une base neuve, et le change sqitch
`collectivite/service_etat_import` l'inclut par `\\ir` pour les bases déjà
peuplées (staging, production), où le seed ne repasse jamais.

Un seul exemplaire des données, donc : générer les deux fichiers les avait fait
diverger en une journée. Le script de deploy sqitch, lui, ne bouge jamais — son
empreinte reste stable quand la liste est régénérée.

Le corps est idempotent : il s'apparie sur la famille et le code géographique,
qui sont les clés que la base impose déjà (index uniques partiels), et ne réécrit
jamais le nom d'un service existant. Le rejouer ne crée rien et ne renomme rien.

Le NIC manque au classeur pour les DDT, les DREAL et les conseils régionaux : il
est récupéré au répertoire SIRENE via recherche-entreprises.api.gouv.fr. Jamais
pour les DR ADEME ni les services nationaux, qui portent un SIRET complet — leur
SIREN est celui de l'ADEME, partagé par les dix-huit directions, et le siège de ce
SIREN vaudrait pour toutes.

À relancer via `make seeds_rebuild_from_source` après avoir corrigé un CSV. Toute
anomalie interrompt la génération sans toucher aux SQL existants : mieux vaut un
seed daté qu'un seed corrompu.
"""

import csv
import json
import pathlib
import re
import time
import urllib.error
import urllib.parse
import urllib.request

DATA_LAYER = pathlib.Path(__file__).resolve().parents[1]
SOURCES = DATA_LAYER / 'seed' / 'sources' / 'service-etat'
DESTINATION = DATA_LAYER / 'seed' / 'imports' / '09-service_etat.sql'

# Le NIC du siège vient du répertoire SIRENE, exposé sans clé par la DINUM.
API = 'https://recherche-entreprises.api.gouv.fr/search'
ALLOWED_HOSTS = frozenset({'recherche-entreprises.api.gouv.fr'})
TIMEOUT_SECONDS = 30
# L'API plafonne à 7 requêtes par seconde et par IP ; on reste loin de la limite,
# quelques dizaines de secondes pour les ~130 SIREN.
THROTTLE_SECONDS = 0.2
RETRIES = 3

# Le domaine SQL `siren` impose déjà `^\d{9}$` ; échouer ici donne un message
# lisible au moment de la génération plutôt qu'au chargement du seed.
SIREN_PATTERN = re.compile(r'^\d{9}$')
SIRET_PATTERN = re.compile(r'^\d{14}$')
NIC_PATTERN = re.compile(r'^\d{5}$')
# Un caractère de contrôle dans un libellé signe une erreur de décodage.
CONTROL_PATTERN = re.compile(r'[\x00-\x1f\x7f-\x9f]')
# Toutes ces directions sont des personnes morales de droit public (catégories
# juridiques 71xx à 74xx) : un SIREN mal recopié qui tomberait sur une société
# privée est arrêté ici plutôt que découvert en production.
NATURE_JURIDIQUE_PUBLIQUE = re.compile(r'^7\d{3}$')


def fail(message: str) -> None:
    raise SystemExit(f'✗ {message}')


# ————————————————————————— lecture des sources —————————————————————————


def codes_geographiques() -> tuple[frozenset[str], dict[str, str]]:
    """Les codes que le seed connaît, lus dans les fichiers qui les portent.

    C'est le garde-fou qui attrape un code hors du référentiel TeT : le
    département 975 (Saint-Pierre-et-Miquelon) du classeur, par exemple, qui
    n'existe pas dans `imports.departement`.
    """
    imports = DATA_LAYER / 'seed' / 'imports'
    regions = re.findall(r"\('(\d{2})',", (imports / '01-region.sql').read_text())
    # Le rattachement est retenu, pas seulement le code : c'est ce qui permet de
    # refuser une DDT dont le département n'appartient pas à la région annoncée.
    departements = dict(
        re.findall(
            r"\('([0-9AB]{2,3})', '(\d{2})',", (imports / '02-departement.sql').read_text()
        )
    )
    if len(regions) != 18:
        fail(f'01-region.sql : 18 régions attendues, {len(regions)} lues')
    if len(departements) != 101:
        fail(f'02-departement.sql : 101 départements attendus, {len(departements)} lus')
    return frozenset(regions), departements


def read_csv(name: str, colonnes: tuple[str, ...]) -> list[dict[str, str]]:
    chemin = SOURCES / name
    with chemin.open(encoding='utf-8', newline='') as handle:
        reader = csv.DictReader(handle, delimiter=';')
        manquantes = [c for c in colonnes if c not in (reader.fieldnames or ())]
        if manquantes:
            fail(
                f'{chemin.name} : colonnes absentes {", ".join(manquantes)} '
                f'(en-tête lu : {reader.fieldnames})'
            )
        lignes = []
        for numero, ligne in enumerate(reader, start=2):  # 1 = en-tête
            lignes.append({c: (ligne[c] or '').strip() for c in colonnes} | {'_ligne': numero})
    if not lignes:
        fail(f'{chemin.name} : aucune ligne')
    return lignes


def check_libelle(fichier: str, ligne: dict[str, str]) -> str:
    nom = ligne['nom']
    numero = ligne['_ligne']
    if not nom:
        fail(f'{fichier}:{numero} : dénomination vide')
    if CONTROL_PATTERN.search(nom):
        fail(f'{fichier}:{numero} : caractère de contrôle dans {nom!r}')
    return nom


def check_unique(fichier: str, cle: str, valeurs: list[tuple[str, int]]) -> None:
    vues: dict[str, int] = {}
    for valeur, numero in valeurs:
        if valeur in vues:
            fail(
                f'{fichier}:{numero} : {cle} {valeur} déjà vu ligne {vues[valeur]} — '
                f'la base n\'accepte qu\'un service par {cle}'
            )
        vues[valeur] = numero


def decoupe_siret(fichier: str, ligne: dict[str, str]) -> tuple[str, str]:
    """SIRET (14) = SIREN (9) + NIC (5)."""
    siret = ligne['siret']
    if not SIRET_PATTERN.match(siret):
        fail(f'{fichier}:{ligne["_ligne"]} : SIRET invalide {siret!r} (14 chiffres attendus)')
    return siret[:9], siret[9:]


# ——————————————————————————— NIC via SIRENE ———————————————————————————


def fetch_json(url: str) -> dict:
    if urllib.parse.urlparse(url).hostname not in ALLOWED_HOSTS:
        fail(f'URL hors des domaines attendus : {url}')
    derniere: Exception | None = None
    for essai in range(RETRIES):
        try:
            with urllib.request.urlopen(url, timeout=TIMEOUT_SECONDS) as reponse:
                return json.loads(reponse.read())
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as erreur:
            derniere = erreur
            time.sleep(1 + essai)
    fail(f'{url} : {derniere}')


def nic_du_siege(siren: str, contexte: str) -> str:
    """Le NIC du siège, avec les contrôles qui rendent un SIREN faux détectable."""
    time.sleep(THROTTLE_SECONDS)
    reponse = fetch_json(f'{API}?{urllib.parse.urlencode({"q": siren, "per_page": 1})}')

    resultats = reponse.get('results') or []
    if not resultats:
        fail(f'{contexte} : SIREN {siren} inconnu du répertoire SIRENE')
    entreprise = resultats[0]

    if entreprise.get('siren') != siren:
        fail(
            f'{contexte} : la recherche du SIREN {siren} renvoie '
            f'{entreprise.get("siren")} ({entreprise.get("nom_complet")})'
        )

    nature = str(entreprise.get('nature_juridique') or '')
    if not NATURE_JURIDIQUE_PUBLIQUE.match(nature):
        fail(
            f'{contexte} : SIREN {siren} de catégorie juridique {nature or "inconnue"} '
            f'({entreprise.get("nom_complet")}) — une administration est attendue'
        )

    siege = entreprise.get('siege') or {}
    if siege.get('etat_administratif') != 'A':
        fail(
            f'{contexte} : le siège du SIREN {siren} est fermé '
            f'({entreprise.get("nom_complet")})'
        )

    siret = str(siege.get('siret') or '')
    if not SIRET_PATTERN.match(siret) or not siret.startswith(siren):
        fail(f'{contexte} : SIRET de siège inattendu {siret!r} pour le SIREN {siren}')

    nic = siret[9:]
    if not NIC_PATTERN.match(nic):
        fail(f'{contexte} : NIC de siège invalide {nic!r}')
    return nic


# ——————————————————————————— rendu du SQL ———————————————————————————


def quote(valeur: str) -> str:
    return "'" + valeur.replace("'", "''") + "'"


def valeurs(lignes: list[tuple[str, ...]]) -> str:
    return ',\n'.join('        (' + ', '.join(quote(v) for v in ligne) + ')' for ligne in lignes)


ADOPTION = """-- Adoption des lignes antérieures à l'import. `service_national` est la seule
-- famille appariée sur le nom : une ligne posée avant cet import sous une forme
-- courte — le « DGEC » du seed de développement — ne serait pas reconnue sous sa
-- dénomination officielle, et l'insert qui suit en créerait une seconde. On
-- l'adopte plutôt, ce qui vaut aussi sur une base déjà peuplée où le seed ne
-- repasse jamais.
--
-- `siren is null` borne l'adoption aux lignes que l'import n'a pas encore
-- touchées : un service déjà identifié au répertoire SIRENE n'est jamais renommé.
-- Les noms antérieurs sont déclarés dans la colonne `nom_anterieur` de
-- service-national.csv.
--
-- La dénomination officielle est reconnue au même titre que le nom antérieur :
-- sans cela, une ligne déjà nommée mais sans SIREN — un ajout à la main, ou un
-- passage interrompu — ne serait ni adoptée ici ni insérée plus bas (le `not
-- exists` la voit), resterait sans identité, et ferait échouer le `verify`.
update collectivite
set nom   = v.nom,
    siren = v.siren,
    nic   = v.nic
from (values
{valeurs}
) as v (nom, siren, nic, nom_anterieur)
where type = 'service_national'
  and collectivite.nom in (v.nom_anterieur, v.nom)
  and collectivite.siren is null;

"""


def bloc_adoption(lignes: list[tuple[str, ...]]) -> str:
    """Vide quand aucun nom antérieur n'est déclaré : rien à réconcilier."""
    if not lignes:
        return ''
    return ADOPTION.format(valeurs=valeurs(lignes))


# `where exists (select 1 from collectivite)` : la garde qui rend ce corps
# jouable aux deux endroits. Voir le commentaire d'en-tête du corps.
GARDE = 'where exists (select 1 from collectivite)'


def corps(services: dict[str, list[tuple[str, ...]]]) -> str:
    return f"""-- Ce corps est joué à deux endroits — le change sqitch
-- `collectivite/service_etat_import` et ce seed — et chaque bloc porte
-- `{GARDE}`.
--
-- Cette garde n'est pas une précaution, c'est le cœur du dispositif. Une base
-- neuve est **vide** au moment des migrations : y insérer 130 collectivités
-- consommerait la séquence d'`id` avant le seed, et la collectivité 1 ne serait
-- plus Ambérieu-en-Bugey mais une DREAL. Or des ids sont écrits en clair dans le
-- dépôt — `07-banatic_2025_competence_par_collectivite.sql` en cite des milliers,
-- les seeds de développement s'appuient sur la collectivité 1. Tout se
-- décalerait d'un cran.
--
-- Donc : sur une base neuve la migration ne fait rien, et c'est le seed qui
-- peuple, à sa place dans l'ordre de chargement (après `content/`, donc après
-- les communes et les EPCI). Sur une base déjà peuplée — staging, production —
-- le seed ne repasse jamais et c'est la migration qui agit. Les deux chemins
-- sont idempotents et se recoupent sans dégât.

-- Les DREAL. Un service de l'État est une ligne de `collectivite`, sa famille
-- est son `type`, et son périmètre son code géographique. La clé d'appariement
-- est l'index unique partiel que la base porte déjà
-- (`collectivite_dreal_unique_region_code`) : reconnaître une DREAL à sa région,
-- jamais à son nom.
--
-- `nom` est volontairement absent du `do update` : un service déjà nommé en base
-- garde son nom. La DREAL Pays de la Loire créée à la main en production reste
-- « DREAL Pays de la Loire » et gagne seulement son SIREN et son NIC.
--
-- Ni population ni territoire : une DREAL n'a pas de territoire propre. Le bucket
-- de stockage est créé par le trigger `after_collectivite_write`.
insert into collectivite (nom, type, region_code, siren, nic)
select v.nom, v.type, v.region_code, v.siren, v.nic
from (values
{valeurs(services['dreal'])}
) as v (nom, type, region_code, siren, nic)
{GARDE}
on conflict (type, region_code) where type = 'dreal'
do update set siren = excluded.siren,
              nic   = excluded.nic;

-- Les DDT, appariées sur le département (`collectivite_ddt_unique_departement_code`).
-- Les DDTM sont des DDT : la mer est dans leur nom, pas dans leur famille. Le
-- code région, lui, est un fait géographique et non un nom — on le reporte.
insert into collectivite (nom, type, departement_code, region_code, siren, nic)
select v.nom, v.type, v.departement_code, v.region_code, v.siren, v.nic
from (values
{valeurs(services['ddt'])}
) as v (nom, type, departement_code, region_code, siren, nic)
{GARDE}
on conflict (type, departement_code) where type = 'ddt'
do update set siren       = excluded.siren,
              nic         = excluded.nic,
              region_code = excluded.region_code;

-- Les DR ADEME, appariées sur la région. Les dix-huit partagent le SIREN 385290309
-- de l'ADEME : seul le NIC les distingue, et c'est ce qui rendra possible le
-- rattachement automatique par ProConnect. La direction Océan Indien couvre deux
-- régions (La Réunion et Mayotte) : deux lignes, même nom et même SIRET, ce que
-- l'index autorise puisqu'il ne porte que sur la région.
insert into collectivite (nom, type, region_code, siren, nic)
select v.nom, v.type, v.region_code, v.siren, v.nic
from (values
{valeurs(services['dr_ademe'])}
) as v (nom, type, region_code, siren, nic)
{GARDE}
on conflict (type, region_code) where type = 'dr_ademe'
do update set siren = excluded.siren,
              nic   = excluded.nic;

{bloc_adoption(services['adoption'])}-- Les services nationaux. `service_national` est une famille, pas un service : la
-- DGEC et l'ADEME aujourd'hui, d'autres organes ensuite. Aucune unicité en base —
-- c'est le défaut de code géographique qui fait le périmètre national — et donc
-- pas de cible pour un `on conflict` : l'appariement se fait sur le nom, faute
-- d'autre clé stable une fois le territoire exclu.
insert into collectivite (nom, type, siren, nic)
select v.nom, 'service_national', v.siren, v.nic
from (values
{valeurs(services['service_national'])}
) as v (nom, siren, nic)
{GARDE}
  and not exists (
    select 1 from collectivite
    where type = 'service_national' and nom = v.nom
);

-- Les conseils régionaux existent déjà comme collectivités de type `region`,
-- créées depuis `imports.region`. On ne fait que renseigner leur identité SIRENE :
-- jamais de création, jamais de renommage.
--
-- Attention, ils ne partaient pas de rien : `collectivite/fusion.sql` en avait
-- posé des SIREN, sur la carte des régions d'avant 2016. Deux d'entre eux
-- désignent un conseil régional dissous et **sont délibérément remplacés** —
-- Martinique 239720014 et Guyane 239730013 sont fermés au répertoire SIRENE,
-- au profit des collectivités territoriales qui leur ont succédé (200055507 et
-- 200052678). Mayotte, elle, n'en avait aucun. Les quinze autres codes de
-- `fusion.sql` visent des régions qui n'existent plus comme collectivités : ils
-- ne rencontrent aucune ligne.
--
-- Comme les blocs précédents, cet `update` ne rencontre rien au moment des
-- migrations sur une base neuve : les régions n'arrivent qu'avec
-- `06-complete_collectivite_with_import.sql`. Le piège est connu —
-- `collectivite/code_siren_commune` portait un `update` qui n'a jamais rien
-- rencontré, et les communes sont restées sans SIREN pendant des mois. Ici le
-- seed rejoue le même corps derrière, donc rien ne se perd.
update collectivite
set siren = v.siren,
    nic   = v.nic
from (values
{valeurs(services['conseil_regional'])}
) as v (region_code, siren, nic)
where type = 'region'
  and collectivite.region_code = v.region_code
  and (collectivite.siren, collectivite.nic) is distinct from (v.siren, v.nic);
"""


HEADER = """-- Services de l'État instructeurs du dépôt PCAET : DREAL, DDT, DR ADEME et
-- services nationaux, plus le SIREN et le NIC des conseils régionaux.
--
-- Source : data_layer/seed/sources/service-etat/*.csv (classeur remis par l'ADEME,
-- cf. le README du dossier). Fichier généré — régénérer avec
-- `make seeds_rebuild_from_source`
-- (script : data_layer/scripts/generate_service_etat.py).
--
-- Ce fichier est le **seul** exemplaire des données, et il a deux lecteurs :
-- `seed.sh` le charge sur une base neuve, et le change sqitch
-- `collectivite/service_etat_import` l'inclut par `\\ir` pour les bases déjà
-- peuplées, où le seed ne repasse jamais. D'où l'absence de `begin`/`commit`
-- ici : c'est le change sqitch qui ouvre la transaction, et un `commit` au
-- milieu refermerait la sienne. `seed.sh` s'appuie sur `ON_ERROR_STOP`.

"""

FOOTER = ''


# ————————————————————————————————— main —————————————————————————————————


def main() -> None:
    regions, departements = codes_geographiques()
    services: dict[str, list[tuple[str, ...]]] = {}

    def check_region(fichier: str, ligne: dict[str, str]) -> str:
        code = ligne['region_code']
        if code not in regions:
            fail(
                f'{fichier}:{ligne["_ligne"]} : code région {code!r} inconnu de '
                f'01-region.sql (les codes d\'outre-mer s\'écrivent sur deux '
                f'caractères : 01, 02, 03, 04, 06)'
            )
        return code

    def check_siren(fichier: str, ligne: dict[str, str]) -> str:
        siren = ligne['siren']
        if not SIREN_PATTERN.match(siren):
            fail(f'{fichier}:{ligne["_ligne"]} : SIREN invalide {siren!r} (9 chiffres attendus)')
        return siren

    # — DREAL : SIREN au classeur, NIC au répertoire SIRENE
    fichier = 'dreal.csv'
    lignes = read_csv(fichier, ('region_code', 'siren', 'nom'))
    check_unique(fichier, 'code région', [(l['region_code'], l['_ligne']) for l in lignes])
    check_unique(fichier, 'SIREN', [(l['siren'], l['_ligne']) for l in lignes])
    print(f'⏳ {fichier} : {len(lignes)} NIC à récupérer au répertoire SIRENE')
    services['dreal'] = [
        (
            check_libelle(fichier, ligne),
            'dreal',
            check_region(fichier, ligne),
            check_siren(fichier, ligne),
            nic_du_siege(ligne['siren'], f'{fichier}:{ligne["_ligne"]}'),
        )
        for ligne in lignes
    ]

    # — DDT
    fichier = 'ddt.csv'
    lignes = read_csv(fichier, ('region_code', 'departement_code', 'siren', 'nom'))
    check_unique(
        fichier, 'code département', [(l['departement_code'], l['_ligne']) for l in lignes]
    )
    check_unique(fichier, 'SIREN', [(l['siren'], l['_ligne']) for l in lignes])
    for ligne in lignes:
        code_dep = ligne['departement_code']
        if code_dep not in departements:
            fail(
                f'{fichier}:{ligne["_ligne"]} : code département '
                f'{code_dep!r} inconnu de 02-departement.sql'
            )
        # L'insert reporte `region_code` sur la DDT existante : une paire fausse
        # déplacerait le service hors du périmètre de sa DREAL, sans bruit.
        if departements[code_dep] != ligne['region_code']:
            fail(
                f'{fichier}:{ligne["_ligne"]} : le département {code_dep} appartient à la '
                f'région {departements[code_dep]}, pas à {ligne["region_code"]!r}'
            )
    print(f'⏳ {fichier} : {len(lignes)} NIC à récupérer au répertoire SIRENE')
    services['ddt'] = [
        (
            check_libelle(fichier, ligne),
            'ddt',
            ligne['departement_code'],
            check_region(fichier, ligne),
            check_siren(fichier, ligne),
            nic_du_siege(ligne['siren'], f'{fichier}:{ligne["_ligne"]}'),
        )
        for ligne in lignes
    ]

    # — DR ADEME : SIRET complet au classeur, le NIC n'est jamais cherché ailleurs
    fichier = 'dr-ademe.csv'
    lignes = read_csv(fichier, ('region_code', 'siret', 'nom'))
    check_unique(fichier, 'code région', [(l['region_code'], l['_ligne']) for l in lignes])
    services['dr_ademe'] = []
    for ligne in lignes:
        siren, nic = decoupe_siret(fichier, ligne)
        services['dr_ademe'].append(
            (check_libelle(fichier, ligne), 'dr_ademe', check_region(fichier, ligne), siren, nic)
        )

    # — Services nationaux : appariés sur le nom, donc unique par construction
    fichier = 'service-national.csv'
    lignes = read_csv(fichier, ('siret', 'nom', 'nom_anterieur'))
    check_unique(fichier, 'dénomination', [(l['nom'], l['_ligne']) for l in lignes])
    check_unique(
        fichier,
        'nom antérieur',
        [(l['nom_anterieur'], l['_ligne']) for l in lignes if l['nom_anterieur']],
    )
    services['service_national'] = []
    services['adoption'] = []
    for ligne in lignes:
        siren, nic = decoupe_siret(fichier, ligne)
        nom = check_libelle(fichier, ligne)
        services['service_national'].append((nom, siren, nic))
        if ligne['nom_anterieur']:
            services['adoption'].append((nom, siren, nic, ligne['nom_anterieur']))

    # — Conseils régionaux : update seul, le nom du classeur n'est pas repris
    fichier = 'conseil-regional.csv'
    lignes = read_csv(fichier, ('region_code', 'siren', 'nom'))
    check_unique(fichier, 'code région', [(l['region_code'], l['_ligne']) for l in lignes])
    check_unique(fichier, 'SIREN', [(l['siren'], l['_ligne']) for l in lignes])
    print(f'⏳ {fichier} : {len(lignes)} NIC à récupérer au répertoire SIRENE')
    services['conseil_regional'] = [
        (
            check_region(fichier, ligne),
            check_siren(fichier, ligne),
            nic_du_siege(ligne['siren'], f'{fichier}:{ligne["_ligne"]}'),
        )
        for ligne in lignes
    ]

    # Rien n'est écrit avant que tout soit lu, validé et complété : une source
    # abîmée laisse les deux SQL en place.
    DESTINATION.write_text(HEADER + corps(services) + FOOTER, encoding='utf-8')

    print(
        f'✓ {len(services["dreal"])} DREAL, {len(services["ddt"])} DDT, '
        f'{len(services["dr_ademe"])} DR ADEME, '
        f'{len(services["service_national"])} services nationaux, '
        f'{len(services["conseil_regional"])} conseils régionaux'
    )
    print(f'  → {DESTINATION.relative_to(DATA_LAYER.parent)}')


if __name__ == '__main__':
    main()

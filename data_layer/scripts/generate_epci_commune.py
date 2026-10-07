#!/usr/bin/env python3
"""Régénère `seed/imports/11-epci_commune.sql` depuis la source BANATIC.

La composition communale des EPCI à fiscalité propre : une ligne par couple
(EPCI, commune membre), avec le département de la commune et celui du siège du
groupement.

C'est la matière première des périmètres géographiques secondaires. `collectivite`
ne porte qu'un département et une région — ceux du siège — alors qu'un EPCI peut
en chevaucher plusieurs : Redon Agglomération s'étale sur 35, 44 et 56, donc sur
la Bretagne et les Pays de la Loire. Le calcul lui-même n'est pas ici, il est en
SQL (`update_epci_perimetres_from_banatic`, change
`collectivite/epci_perimetre_secondaire`) : ce script ne fait que transcrire la
source, pour que la règle n'existe qu'à un seul endroit.

Il faut la composition **complète**. `collectivite_relations` ne la donne pas :
elle écarte les communes de moins de 3 000 habitants et ne retient que celles qui
existent dans `collectivite`, soit 3 668 relations pour 34 871 lignes de source —
de quoi manquer 67 des 89 EPCI multi-départements.

À rejouer une fois par an, la source étant publiée à ce rythme et les périmètres
bougeant peu depuis la fin de la loi NOTRe. `make seeds_rebuild_from_source`
lance tous les générateurs de ce dossier ; le SQL réécrit se commite.

Toute anomalie de la source interrompt la génération sans toucher au SQL
existant : mieux vaut un seed daté qu'un seed corrompu.
"""

import csv
import io
import json
import pathlib
import re
import urllib.parse
import urllib.request

DATASET = (
    'https://www.data.gouv.fr/api/1/datasets/base-nationale-sur-les-intercommunalites/'
)
# La ressource porte un identifiant pérenne : data.gouv redirige vers l'URL
# horodatée du millésime courant, donc le rejeu annuel suit la source sans qu'on
# ait à toucher ce script. C'est déjà celui qu'utilisent
# `import-collectivite-relations.service.ts` et l'import du périmètre Banatic 2025.
RESOURCE_ID = '6e05c448-62cc-4470-aa0f-4f31adea0bc4'
# L'URL de la ressource vient de la réponse de data.gouv.fr : on la borne au
# domaine attendu plutôt que de télécharger ce qu'elle désigne.
ALLOWED_HOSTS = frozenset({'static.data.gouv.fr', 'www.data.gouv.fr'})
TIMEOUT_SECONDS = 60

# BANATIC publie en cp1252, séparateur `;`. Surtout pas latin-1 : l'octet 0x9C
# y vaut « œ » (Vandœuvre, Cœuvres, tous les Bœuf/Cœur), que latin-1 décode en
# caractère de contrôle invisible. Aucun libellé n'est repris ici — seuls des
# codes, tous ASCII — mais un décodage faux signalerait une source changée.
ENCODING = 'cp1252'

COLUMNS = ('siren', 'insee', 'dept', 'dep_com', 'nb_membres')
SIREN_PATTERN = re.compile(r'^\d{9}$')
INSEE_PATTERN = re.compile(r'^(\d{5}|2[AB]\d{3})$')
# Les quatre colonnes retenues sont des codes : un caractère hors ASCII y
# signerait un décalage de colonnes ou un changement d'encodage.
NON_ASCII_PATTERN = re.compile(r'[^\x00-\x7f]')

# Une source amputée ne doit pas vider les périmètres, donc les habilitations :
# chaque département déclaré ouvre le dépôt PCAET de l'EPCI à la DDT du lieu.
MIN_LIGNES = 30_000
MIN_EPCI = 1_200

DATA_LAYER = pathlib.Path(__file__).resolve().parents[1]
DESTINATION = DATA_LAYER / 'seed' / 'imports' / '11-epci_commune.sql'

HEADER = """-- Composition communale des EPCI à fiscalité propre.
--
-- Source : BANATIC (DGCL), ressource « perimetre-epci-a-fp.csv » du jeu de
-- données data.gouv « base nationale sur les intercommunalités ».
-- Fichier généré — régénérer avec `make seeds_rebuild_from_source`
-- (script : data_layer/scripts/generate_epci_commune.py).
--
-- Une ligne par couple (EPCI, commune membre), sans seuil de population : c'est
-- ce qui distingue cette table de `collectivite_relations`, qui écarte les
-- communes de moins de 3 000 habitants et manquerait les EPCI ruraux à cheval.
--
-- `departement_code` est celui de la commune, `siege_departement_code` celui du
-- groupement. Leur écart est tout le sujet : il donne les départements — et par
-- `imports.departement`, les régions — qu'un EPCI couvre au-delà de son siège.
--
-- Le calcul n'est pas ici : `update_epci_perimetres_from_banatic()` le porte, et
-- le change `collectivite/epci_perimetre_secondaire` l'appelle après ce fichier.
--
-- Deux lecteurs, comme `10-service_etat_perimetre_secondaire.sql` : `seed.sh` le
-- charge sur une base neuve, et le change `collectivite/epci_perimetre_secondaire`
-- l'inclut par `\\ir` pour les bases déjà peuplées. D'où l'absence de
-- `begin`/`commit` : c'est le change qui ouvre la transaction.

-- La source est un instantané, pas un journal : on repart d'une table vide pour
-- qu'une commune sortie d'un EPCI ne laisse pas sa ligne derrière elle.
truncate imports.epci_commune;

insert into imports.epci_commune (siren_epci, insee_commune, departement_code, siege_departement_code)
select v.siren_epci, v.insee_commune, v.departement_code, v.siege_departement_code
from (values
"""

FOOTER = """
) as v (siren_epci, insee_commune, departement_code, siege_departement_code)
-- Les deux colonnes de département ont une clé étrangère vers
-- `imports.departement`, que seul `02-departement.sql` remplit — donc après les
-- migrations. Sans cette garde, le change sqitch qui inclut ce fichier échouerait
-- sur une base neuve, où la CI le joue avant le seed. Sur une base déjà peuplée
-- elle est toujours vraie, et le chargement a lieu. Même motif que la garde de
-- `09-service_etat.sql`.
where exists (select 1 from imports.departement);

-- Le calcul suit le chargement, dans le même fichier, parce que ses deux lecteurs
-- en ont besoin à des moments différents : le change sqitch le joue sur une base
-- déjà peuplée, où il produit les périmètres tout de suite, et `seed.sh` le rejoue
-- sur une base neuve, où les EPCI n'existaient pas encore au moment des migrations.
-- La fonction est idempotente : l'appeler deux fois ne change rien.
--
-- Il passe après `06-complete_collectivite_with_import.sql`, qui pose le périmètre
-- principal depuis `imports.banatic` — un millésime plus ancien. C'est voulu : la
-- composition communale est plus fraîche et corrige le siège s'il a bougé.
select imports.update_epci_perimetres_from_banatic();
"""


def fail(message: str) -> None:
    raise SystemExit(f'✗ {message}')


def fetch(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=TIMEOUT_SECONDS) as response:
        return response.read()


def resource_url() -> str:
    dataset = json.loads(fetch(DATASET))

    for resource in dataset.get('resources', []):
        if resource.get('id') != RESOURCE_ID:
            continue

        url = resource['url']
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != 'https' or parsed.hostname not in ALLOWED_HOSTS:
            fail(
                f'ressource hors des domaines attendus '
                f'({", ".join(sorted(ALLOWED_HOSTS))}) : {url}'
            )
        return url

    fail(f'ressource {RESOURCE_ID} absente de {DATASET}')
    raise AssertionError('inatteignable')  # pour le typage : fail ne rend jamais


def departements_connus() -> frozenset[str]:
    """Les départements que le seed connaît, lus dans le fichier qui les porte.

    Garde-fou contre un code hors du référentiel TeT — la colonne du seed a une
    clé étrangère vers `imports.departement`, et échouer ici donne un message
    lisible plutôt qu'une violation de contrainte au chargement.
    """
    source = DATA_LAYER / 'seed' / 'imports' / '02-departement.sql'
    codes = re.findall(r"\('([0-9AB]{2,3})', '\d{2}',", source.read_text())
    if len(codes) != 101:
        fail(f'{source.name} : 101 départements attendus, {len(codes)} lus')
    return frozenset(codes)


def read_rows(content: str, url: str) -> list[dict[str, str]]:
    reader = csv.DictReader(io.StringIO(content), delimiter=';')

    manquantes = [c for c in COLUMNS if c not in (reader.fieldnames or ())]
    if manquantes:
        fail(
            f'colonnes absentes de {url} : {", ".join(manquantes)} '
            f'(en-tête lu : {reader.fieldnames})'
        )

    departements = departements_connus()
    rows: list[dict[str, str]] = []
    vues: dict[tuple[str, str], int] = {}
    sieges: dict[str, str] = {}
    declares: dict[str, int] = {}
    communes: dict[str, set[str]] = {}
    departements_membres: dict[str, set[str]] = {}

    for numero, ligne in enumerate(reader, start=2):  # 1 = en-tête
        valeurs_lues = {c: (ligne.get(c) or '').strip() for c in COLUMNS}
        siren, insee = valeurs_lues['siren'], valeurs_lues['insee']
        siege, dep_com = valeurs_lues['dept'], valeurs_lues['dep_com']

        # La source finit par une ligne vide ; toute autre ligne incomplète est
        # une anomalie.
        if not any(valeurs_lues.values()):
            continue

        for colonne in ('siren', 'insee', 'dept', 'dep_com'):
            if NON_ASCII_PATTERN.search(valeurs_lues[colonne]):
                fail(
                    f'{url}:{numero} : caractère hors ASCII dans {colonne} '
                    f'({valeurs_lues[colonne]!r}) — la source n\'est probablement '
                    f'plus encodée en {ENCODING}, ou les colonnes ont bougé'
                )

        if not SIREN_PATTERN.match(siren):
            fail(f'{url}:{numero} : SIREN d\'EPCI invalide {siren!r}')
        if not INSEE_PATTERN.match(insee):
            fail(f'{url}:{numero} : code INSEE invalide {insee!r}')
        if dep_com not in departements:
            fail(
                f'{url}:{numero} : département {dep_com!r} de la commune {insee} '
                f'absent de 02-departement.sql'
            )
        if siege not in departements:
            fail(
                f'{url}:{numero} : département de siège {siege!r} de l\'EPCI {siren} '
                f'absent de 02-departement.sql'
            )
        if (siren, insee) in vues:
            fail(
                f'{url}:{numero} : couple ({siren}, {insee}) déjà vu ligne '
                f'{vues[(siren, insee)]} — clé primaire de imports.epci_commune'
            )
        # Un EPCI a un siège et un seul : deux valeurs signeraient un tri ou une
        # fusion de lignes hasardeuse dans la source.
        if sieges.setdefault(siren, siege) != siege:
            fail(
                f'{url}:{numero} : l\'EPCI {siren} porte deux départements de '
                f'siège, {sieges[siren]!r} et {siege!r}'
            )

        nb_membres = valeurs_lues['nb_membres'].replace(' ', '').replace('\xa0', '')
        if nb_membres.isdigit():
            declares.setdefault(siren, int(nb_membres))

        vues[(siren, insee)] = numero
        communes.setdefault(siren, set()).add(insee)
        departements_membres.setdefault(siren, set()).add(dep_com)
        rows.append(
            {
                'siren_epci': siren,
                'insee_commune': insee,
                'departement_code': dep_com,
                'siege_departement_code': siege,
            }
        )

    if len(rows) < MIN_LIGNES:
        fail(f'{url} : {len(rows)} lignes, moins que les {MIN_LIGNES} attendues')
    if len(communes) < MIN_EPCI:
        fail(f'{url} : {len(communes)} EPCI, moins que les {MIN_EPCI} attendus')

    # Le département du siège doit figurer parmi ceux des communes membres. C'est
    # l'invariant sur lequel `update_epci_perimetres_from_banatic()` lève un P0001 :
    # sans ce contrôle ici, une source anormale serait écrite dans le seed, puis
    # ferait échouer le chargement et le déploiement — l'inverse de la promesse
    # « une anomalie ne touche pas au SQL existant ».
    hors_composition = [
        (siren, sieges[siren])
        for siren in sieges
        if sieges[siren] not in departements_membres.get(siren, set())
    ]
    if hors_composition:
        details = ', '.join(f'{siren} (siège {dep})' for siren, dep in hors_composition[:5])
        fail(
            f'{url} : {len(hors_composition)} EPCI dont le département de siège ne '
            f'figure pas parmi ses communes membres ({details})'
        )

    # Le recomptage des communes distinctes doit retomber sur le `nb_membres` que
    # la source déclare. C'est la preuve que rien n'a été perdu en route — et le
    # même contrôle que celui de l'import du périmètre Banatic 2025.
    ecarts = [
        (siren, len(membres), declares[siren])
        for siren, membres in communes.items()
        if siren in declares and declares[siren] != len(membres)
    ]
    if ecarts:
        details = ', '.join(f'{s} : {r} recomptées vs {d} déclarées' for s, r, d in ecarts[:5])
        fail(
            f'{url} : {len(ecarts)} EPCI dont le recomptage des communes diffère '
            f'du nb_membres déclaré ({details})'
        )

    return sorted(rows, key=lambda row: (row['siren_epci'], row['insee_commune']))


def quote(valeur: str) -> str:
    return "'" + valeur.replace("'", "''") + "'"


def main() -> None:
    url = resource_url()
    rows = read_rows(fetch(url).decode(ENCODING), url)

    valeurs = ',\n'.join(
        '        ('
        + ', '.join(
            quote(row[c])
            for c in ('siren_epci', 'insee_commune', 'departement_code', 'siege_departement_code')
        )
        + ')'
        for row in rows
    )

    # Rien n'est écrit avant que tout soit lu et validé : une source abîmée laisse
    # le SQL existant en place.
    DESTINATION.write_text(HEADER + valeurs + '\n' + FOOTER, encoding='utf-8')

    epci = len({row['siren_epci'] for row in rows})
    print(f'✓ {len(rows)} communes membres, {epci} EPCI à fiscalité propre')
    print(f'  → {DESTINATION.relative_to(DATA_LAYER.parent)}')


if __name__ == '__main__':
    main()

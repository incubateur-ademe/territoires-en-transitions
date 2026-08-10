#!/usr/bin/env python3
"""Régénère `seed/imports/08-code_siren_commune.sql` depuis la source BANATIC.

Le SIREN d'une commune n'est pas dérivable de son code INSEE (la Corse et les
DOM ne suivent pas la règle : Ajaccio = 212000046 pour l'INSEE 2A004), d'où
cette table de correspondance publiée par le ministère de l'Intérieur.

À rejouer quand la source évolue — fusions et créations de communes, soit
quelques dizaines de lignes par an — via `make seeds_rebuild_from_source`,
qui lance tous les générateurs de ce dossier. Le SQL réécrit se commite ;
`seed.sh` le rejoue avec le reste du seed (`make db-init` / `db-reset`).

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
    'https://www.data.gouv.fr/api/1/datasets/'
    'table-de-correspondance-entre-ndeg-siren-et-code-insee-des-communes/'
)
RESOURCE_FORMAT = 'csv'
# L'URL de la ressource vient de la réponse de data.gouv.fr : on la borne au
# domaine attendu plutôt que de télécharger ce qu'elle désigne.
ALLOWED_HOSTS = frozenset({'static.data.gouv.fr', 'www.data.gouv.fr'})
TIMEOUT_SECONDS = 60

# BANATIC publie en cp1252, séparateur `;`. Surtout pas latin-1 : l'octet 0x9C
# y vaut « œ » (Vandœuvre, Schœlcher, tous les Bœuf/Cœur — 109 communes), que
# latin-1 décode en caractère de contrôle invisible.
ENCODING = 'cp1252'

COLUMNS = ('siren', 'insee', 'nom_com')
# Le domaine SQL `siren` impose déjà `^\d{9}$` ; échouer ici donne un message
# lisible au moment de la génération plutôt qu'au chargement du seed.
SIREN_PATTERN = re.compile(r'^\d{9}$')
INSEE_PATTERN = re.compile(r'^(\d{5}|2[AB]\d{3})$')
# Un caractère de contrôle dans un libellé signe une erreur de décodage.
CONTROL_PATTERN = re.compile(r'[\x00-\x1f\x7f-\x9f]')

DESTINATION = (
    pathlib.Path(__file__).resolve().parents[1]
    / 'seed'
    / 'imports'
    / '08-code_siren_commune.sql'
)

HEADER = """-- Correspondance n° SIREN <-> code INSEE des communes.
--
-- Source : BANATIC (ministère de l'Intérieur), publiée sur data.gouv.fr
-- « table de correspondance entre n° Siren et code Insee des communes ».
-- Fichier généré — régénérer avec `make seeds_rebuild_from_source`
-- (script : data_layer/scripts/generate_code_siren_commune.py).
--
-- Sans cette table, `collectivite.siren` reste nul pour toutes les communes
-- (seuls les EPCI en ont un via BANATIC) : tout rapprochement par SIREN — la
-- pré-sélection de collectivité au retour du fournisseur d'identité, par
-- exemple — échoue silencieusement pour une commune.
--
-- Le SIREN d'une commune n'est PAS dérivable du code INSEE : la Corse (2A/2B)
-- et les DOM ne suivent pas la règle (Ajaccio = 212000046 / 2A004). D'où cette
-- table de correspondance plutôt qu'un calcul.

begin;

-- La source est un instantané, pas un journal : on repart d'une table vide
-- pour qu'une commune disparue (fusion) ne laisse pas de correspondance
-- périmée derrière elle.
truncate imports.code_siren_commune;

insert into imports.code_siren_commune (siren, insee, libelle)
values
"""

FOOTER = """;

-- Reporte le SIREN sur les communes. `lpad` couvre un `commune_code` privé de
-- son zéro de tête (départements 01-09) : le domaine `codegeo` est un simple
-- varchar(5) sans contrainte de format. Les codes de la source, eux, sont
-- normalisés sur 5 caractères à la génération, Corse (2A/2B) comprise.
--
-- L'absence de correspondance ne remet volontairement pas `siren` à nul : le
-- SIREN d'une commune fusionnée reste le sien, et un seed n'a pas à effacer
-- une donnée métier déjà en base.
update collectivite
set siren = ic.siren
from imports.code_siren_commune ic
where type = 'commune'
  and lpad(commune_code, 5, '0') = ic.insee
  and collectivite.siren is distinct from ic.siren;

commit;
"""


def fetch(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=TIMEOUT_SECONDS) as response:
        return response.read()


def resource_url() -> str:
    dataset = json.loads(fetch(DATASET))

    for resource in dataset.get('resources', []):
        if resource.get('format') != RESOURCE_FORMAT:
            continue

        url = resource['url']
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != 'https' or parsed.hostname not in ALLOWED_HOSTS:
            raise SystemExit(
                f'ressource {RESOURCE_FORMAT} hors des domaines attendus '
                f'({", ".join(sorted(ALLOWED_HOSTS))}) : {url}'
            )
        return url

    raise SystemExit(f'aucune ressource {RESOURCE_FORMAT} dans {DATASET}')


def read_rows(content: str, url: str) -> list[dict[str, str]]:
    reader = csv.DictReader(io.StringIO(content), delimiter=';')

    missing = [column for column in COLUMNS if column not in (reader.fieldnames or ())]
    if missing:
        raise SystemExit(
            f'colonnes absentes de {url} : {", ".join(missing)} '
            f'(en-tête lu : {reader.fieldnames})'
        )

    rows = []
    seen_siren: dict[str, str] = {}
    seen_insee: dict[str, str] = {}

    for number, row in enumerate(reader, start=2):  # 1 = en-tête
        siren = (row['siren'] or '').strip()
        insee = (row['insee'] or '').strip()
        libelle = (row['nom_com'] or '').strip()

        # La source publie sur 5 caractères ; on rétablit le zéro de tête si
        # une publication passée par un tableur l'avait perdu (1001 → 01001).
        if insee.isdigit():
            insee = insee.zfill(5)

        if not SIREN_PATTERN.match(siren):
            raise SystemExit(f'{url}:{number} : SIREN invalide {siren!r}')
        if not INSEE_PATTERN.match(insee):
            raise SystemExit(f'{url}:{number} : code INSEE invalide {insee!r}')
        if not libelle:
            raise SystemExit(f'{url}:{number} : libellé vide (SIREN {siren})')
        if CONTROL_PATTERN.search(libelle):
            raise SystemExit(
                f'{url}:{number} : caractère de contrôle dans {libelle!r} — '
                f'la source n\'est probablement plus encodée en {ENCODING}'
            )
        if siren in seen_siren:
            raise SystemExit(
                f'{url}:{number} : SIREN {siren} déjà vu ligne {seen_siren[siren]} '
                f'(clé primaire de imports.code_siren_commune)'
            )
        if insee in seen_insee:
            raise SystemExit(
                f'{url}:{number} : code INSEE {insee} déjà vu ligne {seen_insee[insee]}'
            )

        seen_siren[siren] = str(number)
        seen_insee[insee] = str(number)
        rows.append({'siren': siren, 'insee': insee, 'libelle': libelle})

    if not rows:
        raise SystemExit(f'source vide : {url}')

    return sorted(rows, key=lambda row: row['insee'])


def quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> None:
    url = resource_url()
    rows = read_rows(fetch(url).decode(ENCODING), url)

    values = ',\n'.join(
        f"        ({quote(row['siren'])}, {quote(row['insee'])}, "
        f"{quote(row['libelle'])})"
        for row in rows
    )

    DESTINATION.write_text(HEADER + values + '\n' + FOOTER, encoding='utf-8')
    print(f'{len(rows)} communes → {DESTINATION}')


if __name__ == '__main__':
    main()

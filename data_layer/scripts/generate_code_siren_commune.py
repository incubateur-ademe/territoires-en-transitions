#!/usr/bin/env python3
"""Régénère `seed/imports/08-code_siren_commune.sql` depuis la source BANATIC.

Le SIREN d'une commune n'est pas dérivable de son code INSEE (la Corse et les
DOM ne suivent pas la règle : Ajaccio = 212000046 pour l'INSEE 2A004), d'où
cette table de correspondance publiée par le ministère de l'Intérieur.

À rejouer quand la source évolue — fusions et créations de communes, soit
quelques dizaines de lignes par an — via `make seeds_rebuild_from_source`,
qui lance tous les générateurs de ce dossier. Le SQL réécrit se commite ;
`seed.sh` le rejoue avec le reste du seed (`make db-init` / `db-reset`).
"""

import csv
import io
import json
import pathlib
import urllib.request

DATASET = (
    'https://www.data.gouv.fr/api/1/datasets/'
    'table-de-correspondance-entre-ndeg-siren-et-code-insee-des-communes/'
)
RESOURCE_FORMAT = 'csv'
# Le CSV BANATIC est publié en latin-1, séparateur `;`.
ENCODING = 'latin-1'

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

insert into imports.code_siren_commune (siren, insee, libelle)
values
"""

FOOTER = """on conflict (siren) do update
    set insee = excluded.insee,
        libelle = excluded.libelle;

-- Reporte le SIREN sur les communes. Le `or` couvre les codes INSEE stockés
-- sur 4 caractères (départements 01-09 sans zéro de tête).
update collectivite
set siren = ic.siren
from imports.code_siren_commune ic
where type = 'commune'
  and (commune_code = ic.insee or commune_code = ('0' || ic.insee))
  and collectivite.siren is distinct from ic.siren;
"""


def resource_url() -> str:
    with urllib.request.urlopen(DATASET) as response:
        dataset = json.load(response)

    for resource in dataset.get('resources', []):
        if resource.get('format') == RESOURCE_FORMAT:
            return resource['url']

    raise SystemExit(f'aucune ressource {RESOURCE_FORMAT} dans {DATASET}')


def quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> None:
    url = resource_url()
    with urllib.request.urlopen(url) as response:
        content = response.read().decode(ENCODING)

    rows = sorted(
        csv.DictReader(io.StringIO(content), delimiter=';'),
        key=lambda row: row['insee'],
    )
    if not rows:
        raise SystemExit(f'source vide : {url}')

    values = ',\n'.join(
        f"        ({quote(row['siren'])}, {quote(row['insee'])}, "
        f"{quote(row['nom_com'].strip())})"
        for row in rows
    )

    DESTINATION.write_text(HEADER + values + '\n' + FOOTER, encoding='utf-8')
    print(f'{len(rows)} communes → {DESTINATION}')


if __name__ == '__main__':
    main()

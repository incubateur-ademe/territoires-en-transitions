import re
from typing import List

import pandas as pd


def stripped(value) -> str:
    """If the value is a string return a copy with trailing and leading spaces removed else return an empty string"""
    return value.strip() if isinstance(value, str) else ''


def parse_indicateurs_eci_xlsx(indicateurs_xlsx: str) -> List[dict]:
    """
    Read the indicateurs excel file
    :returns a list of indicateurs
    """
    header = [
        'axe',
        'orientation',
        'intitulé',
        'résultat',
        'indicateur',
        'unité',
        'description',
        'source',
        'obligatoire_optionnel',
    ]
    indicateurs = []

    table = pd.read_excel(indicateurs_xlsx, dtype=str, sheet_name="Propoisition 2")
    table = table.iloc[:, : len(header)]  # crop the table
    table.columns = header

    indicateur_count = 0

    # the actual parsing loop
    for index, row in table.iterrows():
        if stripped(row['intitulé']):
            indicateur_count += 1
            indicateur = {
                'id': f'eci-{indicateur_count:03d}',
                'nom': stripped(row['indicateur']),
                'description': stripped(row['description']),
                'obligation_eci': stripped(row['obligatoire_optionnel']).lower() == 'obligatoire',
                'source': stripped(row['source']),
                'unite': stripped(row['unité']),
                'actions': [],
            }
            if stripped(row['orientation']):
                indicateur['actions'].append(f"economie_circulaire/{row['orientation']}")

            indicateurs.append(indicateur)

        elif stripped(row['description']):  # description is multiline
            indicateur['description'] += f"\n{stripped(row['description'])}"

    return indicateurs

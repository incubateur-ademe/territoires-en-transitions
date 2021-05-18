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
    table = table.iloc[3:, : len(header)]  # crop the table
    table.columns = header

    # the actual parsing loop
    for index, row in table.iterrows():
        # print(f'parsing {sheet} row {index}')
        if stripped(row['orientation_n']):
            orientation = {
                'id': row['orientation_n'].strip(),
                'nom': row['orientation_titre'].strip(),
                'description': stripped(row['orientation_description']),
                'actions': [],
            }
            indicateurs.append(orientation)

        elif stripped(row['orientation_description']):  # sometime description is not on the same row
            orientation['description'] = orientation['description'] + stripped(row['orientation_description'])

        if stripped(row['description']) and row['description'].lower().startswith('niveau'):
            nom, description = row['description'].split('\n', 1)
            numero, nom = nom.split(':', 1)
            numero = re.search(r'\d+', numero).group(0)
            niveau = {
                'id': f'{orientation["id"]}.{numero}',
                'nom': nom.strip(),
                'description': description.strip(),
                # 'typologie': stripped(row['typologie']),
                'exemples': stripped(row['exemples']),
                'ponderation': row['ponderation'],
                'critère': stripped(row['critere']),
                'principe': stripped(row['principe']),
                'preuve': stripped(row['preuve']),
                'poids': stripped(row['poids']),
                'actions': [],
            }
            orientation['actions'].append(niveau)
    return indicateurs

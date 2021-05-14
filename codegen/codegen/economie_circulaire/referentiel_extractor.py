import re
from typing import List

import pandas as pd


def stripped(value) -> str:
    """If the value is a string return a copy with trailing and leading spaces removed else return an empty string"""
    return value.strip() if isinstance(value, str) else ''


def parse_referentiel_eci_xlsx(referentiel: str) -> List[dict]:
    """
    Read the référentiel excel file
    :returns a list of orientations as actions.
    """
    header = ['orientation_n', 'orientation_titre', 'orientation_description',
              '', 'referent',  # ignored columns
              'typologie', 'description', "exemples", 'ponderation', 'critere', 'unite', 'principe', 'preuve', 'poids']
    sheets = ['Axe 1', 'Axe 2', 'Axe 3', 'Axe 4', 'Axe 5']
    orientations = []

    for sheet in sheets:
        axe = pd.read_excel(referentiel, dtype=str, sheet_name=sheet, header=1)
        axe = axe.iloc[3:, : len(header)]
        axe.columns = header

        # the actual parsing loop
        for index, row in axe.iterrows():
            print(f'parsing {sheet} row {index}')
            if stripped(row['orientation_n']):
                orientation = {
                    'id': row['orientation_n'].strip(),
                    'nom': row['orientation_titre'].strip(),
                    'description': stripped(row['orientation_description']),
                    'actions': [],
                }
                orientations.append(orientation)

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
                    'typologie': stripped(row['typologie']),
                    'exemples': stripped(row['exemples']),
                    'ponderation': row['ponderation'],
                    'critere': stripped(row['critere']),
                    'principe': stripped(row['principe']),
                    'poids': stripped(row['poids']),
                    'actions': [],
                }
                orientation['actions'].append(niveau)
    return orientations

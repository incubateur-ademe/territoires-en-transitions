import re
from typing import List

import pandas as pd


def stripped(value) -> str:
    """If the value is a string return a copy with trailing and leading spaces removed else return an empty string"""
    return value.strip() if isinstance(value, str) else ''


def points_from_ponderation(ponderation) -> int:
    return int(float(ponderation) * 100)


def parse_referentiel_points(referentiel: str) -> dict:
    header = [
        'axe',
        'orientation',
        'intitulé',
        'niveau_1',
        'niveau_2',
        'niveau_3',
        'niveau_4',
        'niveau_5',
        'total',
        'pondération_orientation',
    ]

    niveaux = list(range(1, 6))

    calculs = pd.read_excel(referentiel, dtype=str, sheet_name='Calculs', header=1)
    calculs = calculs.iloc[1:22, 1: len(header) + 1]  # crop the table
    calculs.columns = header
    points = {}

    for index, row in calculs.iterrows():
        points[row['orientation']] = points_from_ponderation(row['pondération_orientation'])

        for niveau in niveaux:
            if not stripped(row[f'niveau_{niveau}']):
                continue
            points[f"{row['orientation']}.{niveau}"] = points_from_ponderation(row[f'niveau_{niveau}'])

    return points


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
    points = parse_referentiel_points(referentiel)

    for sheet in sheets:
        axe = pd.read_excel(referentiel, dtype=str, sheet_name=sheet, header=1)
        axe = axe.iloc[3:, : len(header)]  # crop the table
        axe.columns = header

        # the actual parsing loop
        for index, row in axe.iterrows():
            # print(f'parsing {sheet} row {index}')
            orientation_n = stripped(row['orientation_n'])
            if orientation_n:
                orientation = {
                    'id': orientation_n,
                    'nom': row['orientation_titre'].strip(),
                    'points': points[orientation_n] if orientation_n in points.keys() else '',
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
                niveau_n = f'{orientation["id"]}.{numero}'
                niveau = {
                    'id': niveau_n,
                    'nom': nom.strip(),
                    'description': description.strip(),
                    'exemples': stripped(row['exemples']),
                    'points': points[niveau_n] if niveau_n in points.keys() else '',
                    'critère': stripped(row['critere']),
                    'preuve': stripped(row['preuve']),
                    'actions': [],
                }
                orientation['actions'].append(niveau)

                principe = stripped(row['principe']).replace('•', '')
                tache_index = 0
                if principe:
                    principe_lines = principe.split('\n')
                    for line in principe_lines:
                        line = stripped(line)

                        if '→' in line:
                            nom, pourcentage = line.split('→')
                            nom = nom.replace('- ', '')
                            pourcentage = int(re.search(r'\d+', pourcentage).group(0))
                            if pourcentage:
                                tache_index += 1
                                tache = {
                                    'id': f'{niveau["id"]}.{tache_index}',
                                    'nom': stripped(nom).capitalize(),
                                    'poids': stripped(row['poids']),
                                    'actions': [],
                                }
                                niveau['actions'].append(tache)

    return orientations

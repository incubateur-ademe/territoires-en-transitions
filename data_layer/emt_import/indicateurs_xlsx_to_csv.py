import numpy as np
import pandas as pd
from pathlib import Path

def clean_up(value):
    value = str(value)
    value.replace(',', '. ');

    return pd.to_numeric(value, errors='coerce"')

if __name__ == '__main__':
    pathlist = Path("./").glob('**/*.xlsx')

    # Pour chaque fichier xlsx :
    for path in pathlist:
        path_in_str = str(path)
        print(f'reading {path_in_str}...')

        # on lit la 2ᵉ feuille
        df = pd.read_excel(path, 0)

        # on renomme les colonnes
        df.columns = ['id', 'action', 'nom', 'description',
                      'valeur_1', 'annee_1', 'commentaire_1',
                      'valeur_2', 'annee_2', 'commentaire_2',
                      'valeur_3', 'annee_3', 'commentaire_3',
                      'valeur_4', 'annee_4', 'commentaire_4']

        # on convertit les colonnes valeurs et années en valeurs numériques, les valeurs inconvertibles seront N/A
        df[['valeur_1', 'valeur_2', 'valeur_3', 'valeur_4', 'annee_1', 'annee_2', 'annee_3', 'annee_4']] = \
            df[['valeur_1', 'valeur_2', 'valeur_3', 'valeur_4', 'annee_1', 'annee_2', 'annee_3', 'annee_4']].apply(pd.to_numeric, errors='coerce')

        # on convertit les années en entiers
        df[['annee_1', 'annee_2', 'annee_3', 'annee_4']] = df[['annee_1', 'annee_2', 'annee_3', 'annee_4']].astype('Int64')

        # enfin on sauvegarde la dataframe en csv.
        save_path = Path("./").joinpath(path.parts[-1].replace('.xlsx', '.csv'))
        df.to_csv(save_path, index=False, header=False, encoding='UTF-8')

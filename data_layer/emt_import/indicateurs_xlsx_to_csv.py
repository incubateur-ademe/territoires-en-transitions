import numpy as np
import pandas as pd
from pathlib import Path

if __name__ == '__main__':
    pathlist = Path("./").glob('**/*.xlsx')

    # Pour chaque fichier xlsx :
    for path in pathlist:
        path_in_str = str(path)
        print(f'reading {path_in_str}...')

        # on lit la 2ᵉ feuille
        sheet = pd.read_excel(path, 1)

        # on ne conserve que les lignes à partir de la 11ᵉ ligne et jusqu'à la 12ᵉ colonne.
        df = sheet.iloc[10:, :12]

        # on renomme les colonnes
        df.columns = ['id', 'action', 'nom', 'description', 'valeur_1', 'annee_1', 'valeur_2', 'annee_2', 'source',
                      'remarque', 'pcaet', 'obligatoire']

        # on convertit les colonnes valeurs et années en valeurs numériques, les valeurs inconvertibles seront N/A
        df[['valeur_1', 'valeur_2', 'annee_1', 'annee_2']] = \
            df[['valeur_1', 'valeur_2', 'annee_1', 'annee_2']].apply(pd.to_numeric, errors='coerce')

        # on convertit les années en entiers
        df[['annee_1', 'annee_2']] = df[['annee_1', 'annee_2']].astype('Int64')

        # enfin on sauvegarde la dataframe en csv.
        save_path = Path("./").joinpath(path.parts[-1].replace('.xlsx', '.csv'))
        df.to_csv(save_path, index=False, header=False, encoding='UTF-8')

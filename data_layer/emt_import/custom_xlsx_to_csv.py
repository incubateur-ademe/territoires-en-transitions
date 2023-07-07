import pandas as pd
from pathlib import Path

"Custom import pour CC Pays de l'Aigle"
if __name__ == '__main__':
    pathlist = Path("./").glob('**/*.xlsx')

    # Pour chaque fichier xlsx :
    for path in pathlist:
        path_in_str = str(path)
        print(f'reading {path_in_str}...')

        # on lit la 1ʳᵉ feuille
        sheet = pd.read_excel(path, 0)

        # on ne conserve que les lignes à partir de la 7ᵉ ligne et jusqu'à la 12ᵉ colonne.
        df = sheet.iloc[7:, :11]

        # on renomme les colonnes
        df.columns = ['id', 'nom', 'phase',
                      'points', 'potentiel',
                      'points_fait', 'points_programme',
                      'pourcentage_fait', 'pourcentage_programme', 'statut',  # pour reconstituer le détaillé
                      'commentaire']  # à importer

        # on convertit les colonnes en valeurs numériques, les valeurs inconvertibles seront N/A
        df[['pourcentage_fait', 'pourcentage_programme']] = \
            df[['pourcentage_fait', 'pourcentage_programme']].apply(pd.to_numeric, errors='coerce')

        df['pourcentage_pas_fait'] = 1.0 - (df['pourcentage_fait'] + df['pourcentage_programme'])
        df['action_id'] = 'cae_' + df['id']
        df['concerne'] = df['statut'].apply(lambda x: False if pd.notnull(x) and ('non' in x.lower()) else True)
        df['statut'] = df.apply(lambda x:
                                'non_renseigne' if not x.concerne
                                else 'fait' if x.pourcentage_fait == 1.0
                                else 'programme' if x.pourcentage_programme == 1.0
                                else 'pas_fait' if x.pourcentage_pas_fait == 1.0
                                else 'detaille', axis=1)

        df = df[['action_id',
                 'statut',
                 'pourcentage_fait', 'pourcentage_programme', 'pourcentage_pas_fait', 'concerne',
                 'commentaire']]

        # enfin on sauvegarde la dataframe en csv.
        save_path = Path("./").joinpath(path.parts[-1].replace('.xlsx', '.csv'))
        df.to_csv(save_path, index=False, header=True, encoding='UTF-8')

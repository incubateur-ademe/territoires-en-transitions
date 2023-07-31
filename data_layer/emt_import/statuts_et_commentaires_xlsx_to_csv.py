import pandas as pd
from pathlib import Path

if __name__ == '__main__':
    pathlist = Path("./").glob('**/*.xlsx')

    # Pour chaque fichier xlsx
    for path in pathlist:
        path_in_str = str(path)
        print(f'reading {path_in_str}...')

        # On lit la premiere feuille avec les commentaires
        sheet = pd.read_excel(path, 0)
        sheet = sheet.iloc[2:, :4]
        sheet.columns = ['action_id', 'titre', 'commentaire', 'statut']
        # supprime la seconde colonne
        sheet.drop('titre', axis=1, inplace=True)
        # supprime les lignes sans commentaires ni statuts
        sheet = sheet.dropna(subset=['commentaire', 'statut'], how='all')
        # enlève un caractère chelou
        sheet.commentaire = sheet.commentaire.str.replace('_x000D_', '')
        save_path = Path("./").joinpath(path.parts[-1].replace('.xlsx', '.csv'))
        sheet.to_csv(save_path, index=False, header=False, encoding='UTF-8')

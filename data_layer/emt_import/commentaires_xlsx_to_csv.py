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
        sheet.columns = ['action_id', 'titre', 'commentaire']
        sheet.drop([0, 1], axis=0, inplace=True)  # supprime les deux premières lignes
        sheet.drop('titre', axis=1, inplace=True)  # supprime la seconde colonne
        sheet = sheet[sheet.commentaire.notnull()]  # supprime les lignes sans commentaires
        sheet.commentaire = sheet.commentaire.str.replace('_x000D_', '')  # enlève un string chelou
        save_path = Path("./").joinpath(path.parts[-1].replace('.xlsx', '.csv'))
        sheet.to_csv(save_path, index=False, header=False, encoding='UTF-8')

from typing import List

import pandas as pd


def rm_top_rows(df: pd.DataFrame, row_count: int) -> pd.DataFrame:
    """Remove the head of a dataframe."""
    df.columns = df.iloc[row_count - 1]
    return df[row_count:]


def parse_referentiel_eci_xlsx(referentiel: str) -> List[dict]:
    """Read the referentiel excel file"""
    header = ['orientation_n', 'orientation_titre', 'orientation_description',
              '', 'referent',  # ignored columns
              'typologie', 'description', "exemples", 'ponderation', 'critere', 'unite', 'principe', 'preuve', 'poids']
    axe = pd.read_excel(referentiel, dtype=str, sheet_name='Axe 1', header=1)
    axe = axe.iloc[3:, : len(header)]
    axe.columns = header
    pass

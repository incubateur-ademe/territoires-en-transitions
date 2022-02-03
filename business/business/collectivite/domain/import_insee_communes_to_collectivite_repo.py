from typing import List
import pandas as pd
from .collectivite_repo import AbstractCollectiviteRepository
from .commune import Commune

COMMUNE_PTOT_MIN = 3000  # minimum population in a commune to be considered


def import_insee_communes_to_collectivite_repo(
    collectivite_repo: AbstractCollectiviteRepository,
    input_communes_csv="business/collectivite/data/commune2021.csv",
    input_communes_data_csv="business/collectivite/data/donnees_communes2021.csv",
):
    df_communes = pd.read_csv(input_communes_csv, usecols=["COM", "LIBELLE"])
    df_communes_data = pd.read_csv(
        input_communes_data_csv, sep=";", usecols=["COM", "PTOT"]
    )
    df_communes_with_data = pd.merge(df_communes, df_communes_data).drop_duplicates(subset="COM", keep="first")  # type: ignore
    df_communes_filtered_on_ptot = df_communes_with_data[
        df_communes_with_data.PTOT > COMMUNE_PTOT_MIN
    ]
    communes: List[Commune] = list(
        df_communes_filtered_on_ptot.apply(
            lambda s: Commune(s.LIBELLE, s.COM), axis=1
        ).values
    )
    collectivite_repo.add_communes(communes)

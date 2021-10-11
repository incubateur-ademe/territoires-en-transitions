import abc
import datetime
from typing import List, Dict, Literal

from urllib.parse import urlparse
from pydantic import BaseModel
import psycopg2
from psycopg2 import OperationalError
from fastapi import APIRouter


from api.config.database import DATABASE_URL


router = APIRouter(prefix="/v2/statistics")

# Models
class DailyCount(BaseModel):
    date: datetime.date  # datetime.date
    count: int
    cumulated_count: int


class FunctionnalitiesUsageProportion(BaseModel):
    fiche_action: float
    cae_referentiel: float
    eci_referentiel: float
    indicateur_personnalise: float
    indicateur_referentiel: float


# Port (specification)
class AbstractQuery(abc.ABC):
    @abc.abstractmethod
    def get_daily_user_count(self) -> List[DailyCount]:
        pass

    @abc.abstractmethod
    def get_daily_collectivite_count(self) -> List[DailyCount]:
        pass

    @abc.abstractmethod
    def get_daily_action_referentiel_status_count(
        self, referentiel: Literal["cae", "eci"]
    ) -> List[DailyCount]:
        pass

    @abc.abstractmethod
    def get_daily_indicateur_referentiel_count(
        self, referentiel: Literal["cae", "eci"]
    ) -> List[DailyCount]:
        pass

    @abc.abstractmethod
    def get_daily_fiche_action_created_count(self) -> List[DailyCount]:
        pass

    @abc.abstractmethod
    def get_daily_indicateur_personnalise_count(self) -> List[DailyCount]:
        pass

    @abc.abstractmethod
    def get_functionnalities_usage_proportion(
        self,
    ) -> FunctionnalitiesUsageProportion:
        pass


# Adapters (actual implementation)

exampleDailyCounts = [
    DailyCount(date=datetime.date(2020, 1, 1), count=1, cumulated_count=1),
    DailyCount(date=datetime.date(2020, 1, 3), count=3, cumulated_count=13),
    DailyCount(date=datetime.date(2020, 2, 3), count=6, cumulated_count=29),
    DailyCount(date=datetime.date(2020, 2, 8), count=5, cumulated_count=34),
]


class InMemoryQuery(AbstractQuery):
    def get_daily_user_count(self) -> List[DailyCount]:
        return exampleDailyCounts

    def get_daily_collectivite_count(self) -> List[DailyCount]:
        return exampleDailyCounts

    def get_daily_action_referentiel_status_count(
        self, referentiel: Literal["cae", "eci"]
    ) -> List[DailyCount]:
        return exampleDailyCounts

    def get_daily_indicateur_referentiel_count(
        self, referentiel: Literal["cae", "eci"]
    ) -> List[DailyCount]:
        return exampleDailyCounts

    def get_daily_fiche_action_created_count(self) -> List[DailyCount]:
        return exampleDailyCounts

    def get_daily_indicateur_personnalise_count(self) -> List[DailyCount]:
        return exampleDailyCounts

    def get_functionnalities_usage_proportion(
        self,
    ) -> FunctionnalitiesUsageProportion:
        return FunctionnalitiesUsageProportion(
            fiche_action=0.3,
            cae_referentiel=0.43,
            eci_referentiel=0.2,
            indicateur_personnalise=0.01,
            indicateur_referentiel=0.09,
        )


# PG
# --
def rows_to_daily_counts(rows: List[Dict]) -> List[DailyCount]:
    return [
        DailyCount(
            date=row["date"],
            count=row["count"],
            cumulated_count=row["cumulated_count"],
        )
        for row in rows
    ]


class PostgresQuery(AbstractQuery):
    def __init__(self) -> None:
        super().__init__()
        db_params = urlparse(DATABASE_URL)

        self._connection_kwargs = dict(
            database=db_params.path[1:],
            user=db_params.username,
            password=db_params.password,
            host=db_params.hostname,
            port=db_params.port,
        )
        self._connection = self.get_new_connection()

    def get_new_connection(self):
        return psycopg2.connect(**self._connection_kwargs)

    @property
    def connection(self) :
        try:
            self._connection.isolation_level
        except OperationalError as oe:
            print("PG Connexion has expired, getting new one.")
            self._connection = self.get_new_connection()
        return self._connection

    def execute_query(self, query: str) -> List[Dict]:
        with self.connection.cursor() as cursor:
            cursor.execute(query)
            fieldsValues = cursor.fetchall()
            description = cursor.description
            return [
                {
                    fieldDesc.name: fieldValue
                    for (fieldDesc, fieldValue) in zip(description, fieldsValue)
                }
                for fieldsValue in fieldsValues
            ]

    def get_daily_user_count(self) -> List[DailyCount]:
        query = open("./sql_reports/daily_user_count.sql", "r").read()
        rows = self.execute_query(query)
        return rows_to_daily_counts(rows)

    def get_daily_collectivite_count(self) -> List[DailyCount]:
        query = open("./sql_reports/daily_active_collectivite_count.sql", "r").read()
        rows = self.execute_query(query)
        return rows_to_daily_counts(rows)

    def get_daily_action_referentiel_status_count(
        self, referentiel: Literal["cae", "eci"]
    ) -> List[DailyCount]:
        action_id_regex = "economie%" if referentiel == "eci" else "citergie%"
        query = (
            open("./sql_reports/daily_created_action_referentiel_status_count.sql", "r")
            .read()
            .replace("%action_id_regex", action_id_regex)
        )
        rows = self.execute_query(
            query,
        )
        return rows_to_daily_counts(rows)

    def get_daily_indicateur_referentiel_count(
        self, referentiel: Literal["cae", "eci"]
    ) -> List[DailyCount]:
        indicateur_id_regex = "eci%" if referentiel == "eci" else "cae%"
        query = (
            open(
                "./sql_reports/daily_created_indicateur_referentiel_resultat_count.sql",
                "r",
            )
            .read()
            .replace("%indicateur_id_regex", indicateur_id_regex)
        )
        rows = self.execute_query(
            query,
        )
        return rows_to_daily_counts(rows)

    def get_daily_fiche_action_created_count(self) -> List[DailyCount]:
        query = open("./sql_reports/daily_created_fiche_action_count.sql", "r").read()
        rows = self.execute_query(query)
        return rows_to_daily_counts(rows)

    def get_daily_indicateur_personnalise_count(self) -> List[DailyCount]:
        query = open(
            "./sql_reports/daily_created_indicateur_personnalise_count.sql", "r"
        ).read()
        rows = self.execute_query(query)
        return rows_to_daily_counts(rows)

    def get_functionnalities_usage_proportion(
        self,
    ) -> FunctionnalitiesUsageProportion:
        query = open("./sql_reports/functionnalities_usage_proportion.sql", "r").read()
        row = self.execute_query(query)[0]
        return FunctionnalitiesUsageProportion(
            fiche_action=row["fiche_action_avg"],
            cae_referentiel=row["cae_statuses_avg"],
            eci_referentiel=row["eci_statuses_avg"],
            indicateur_personnalise=row["indicateur_personnalise_avg"],
            indicateur_referentiel=row["indicateur_referentiel_avg"],
        )


# Instantiation
query = InMemoryQuery() if "sqlite" in DATABASE_URL else PostgresQuery()


@router.get("/daily_user_count", response_model=List[DailyCount])
async def get_daily_user_count():
    return query.get_daily_user_count()


@router.get("/daily_collectivite_count", response_model=List[DailyCount])
async def get_daily_collectivite_count():
    return query.get_daily_collectivite_count()


@router.get(
    "/daily_action_referentiel_status_count/eci", response_model=List[DailyCount]
)
async def get_daily_action_referentiel_status_count_eci():
    return query.get_daily_action_referentiel_status_count("eci")


@router.get("/daily_indicateur_referentiel_count/eci", response_model=List[DailyCount])
async def get_daily_indicateur_referentiel_count_eci():
    return query.get_daily_indicateur_referentiel_count("eci")


@router.get(
    "/daily_action_referentiel_status_count/cae", response_model=List[DailyCount]
)
async def get_daily_action_referentiel_status_count_cae():
    return query.get_daily_action_referentiel_status_count("cae")


@router.get("/daily_indicateur_referentiel_count/cae", response_model=List[DailyCount])
async def get_daily_indicateur_referentiel_count_cae():
    return query.get_daily_indicateur_referentiel_count("cae")


@router.get("/daily_indicateur_personnalise_count", response_model=List[DailyCount])
async def get_daily_indicateur_personnalise_count():
    return query.get_daily_indicateur_personnalise_count()


@router.get("/daily_fiche_action_created_count", response_model=List[DailyCount])
async def get_daily_fiche_action_created_count():
    return query.get_daily_fiche_action_created_count()


@router.get(
    "/functionnalities_usage_proportion", response_model=FunctionnalitiesUsageProportion
)
async def get_functionnalities_usage_proportion():
    return query.get_functionnalities_usage_proportion()

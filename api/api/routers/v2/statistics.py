import abc
import datetime
from typing import List, Dict

from urllib.parse import urlparse
from pydantic import BaseModel
import psycopg2
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
    def get_functionnalities_usage_proportion(
        self,
    ) -> FunctionnalitiesUsageProportion:
        pass


# Adapters (actual implementation)
class InMemoryQuery(AbstractQuery):
    def get_daily_user_count(self) -> List[DailyCount]:
        return [
            DailyCount(date="2020-01-01", count=10, cumulated_count=16),
            DailyCount(date="2020-01-02", count=3, cumulated_count=33),
            DailyCount(date="2020-01-04", count=6, cumulated_count=39),
            DailyCount(date="2020-02-08", count=5, cumulated_count=44),
        ]

    def get_daily_collectivite_count(self) -> List[DailyCount]:
        return [
            DailyCount(date="2020-01-01", count=10, cumulated_count=10),
            DailyCount(date="2020-01-02", count=3, cumulated_count=13),
            DailyCount(date="2020-01-04", count=6, cumulated_count=19),
            DailyCount(date="2020-02-08", count=5, cumulated_count=24),
        ]

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


class PostgresQuery(AbstractQuery):
    def __init__(self) -> None:
        super().__init__()
        db_params = urlparse(DATABASE_URL)
        self.psycopg_connection = psycopg2.connect(
            database=db_params.path[1:],
            user=db_params.username,
            password=db_params.password,
            host=db_params.hostname,
            port=db_params.port,
        )

    def execute_query(self, sql_file_path: str) -> List[Dict]:
        with self.psycopg_connection.cursor() as cursor:
            cursor.execute(open(sql_file_path, "r").read())
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
        rows = self.execute_query("./sql_reports/daily_user_count.sql")
        return [
            DailyCount(
                date=row["date"],
                count=row["count"],
                cumulated_count=row["cumulated_count"],
            )
            for row in rows
        ]

    def get_daily_collectivite_count(self) -> List[DailyCount]:
        rows = self.execute_query("./sql_reports/daily_active_collectivite_count.sql")
        return [
            DailyCount(
                date=row["date"],
                count=row["count"],
                cumulated_count=row["cumulated_count"],
            )
            for row in rows
        ]

    def get_functionnalities_usage_proportion(
        self,
    ) -> FunctionnalitiesUsageProportion:
        row = self.execute_query("./sql_reports/functionnalities_usage_proportion.sql")[
            0
        ]
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
    "/functionnalities_usage_proportion", response_model=FunctionnalitiesUsageProportion
)
async def get_functionnalities_usage_proportion():
    return query.get_functionnalities_usage_proportion()

    # with psycopg_connection.cursor() as cursor:
    #     cursor.execute(open("./sql_reports/user_count.sql", "r").read())
    #     rows = cursor.fetchall()
    # return [
    #     DailyUserCount(date=row[0], count=row[1], cumulated_count=row[2])
    #     for row in rows
    # ]


# @router.get("/user_count", response_model=List[DailyUserCount])
# async def get_all_epci_plan_action():
#     with psycopg_connection.cursor() as cursor:
#         cursor.execute(open("./sql_reports/user_count.sql", "r").read())
#         rows = cursor.fetchall()
#     return [
#         DailyUserCount(date=row[0], count=row[1], cumulated_count=row[2])
#         for row in rows
#     ]

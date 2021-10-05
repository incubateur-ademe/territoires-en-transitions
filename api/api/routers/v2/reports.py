import datetime
from typing import List

from urllib.parse import urlparse
from pydantic import BaseModel
import psycopg2
from fastapi import APIRouter


from api.config.database import DATABASE_URL

router = APIRouter(prefix="/v2/reports")
db_params = urlparse(DATABASE_URL)

psycopg_connection = psycopg2.connect(
    database=db_params.path[1:],
    user=db_params.username,
    password=db_params.password,
    host=db_params.hostname,
    port=db_params.port,
)


class DailyUserCount(BaseModel):
    date: datetime.date
    count: int
    cumulated_count: int


@router.get("/user_count", response_model=List[DailyUserCount])
async def get_all_epci_plan_action():
    with psycopg_connection.cursor() as cursor:
        cursor.execute(open("./sql_reports/user_count.sql", "r").read())
        rows = cursor.fetchall()
    return [
        DailyUserCount(date=row[0], count=row[1], cumulated_count=row[2])
        for row in rows
    ]

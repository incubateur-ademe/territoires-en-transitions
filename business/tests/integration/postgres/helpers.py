from typing import Dict, Optional

from psycopg import Cursor

from business.utils.action_id import ActionId, Referentiel


def insert_action_relation(
    cursor: Cursor,
    referentiel: Referentiel,
    action_id: ActionId,
    parent_id: Optional[ActionId],
):
    cursor.execute(
        "insert into action_relation values (%(action_id)s, %(referentiel)s, %(parent_id)s);",
        {
            "action_id": action_id,
            "referentiel": referentiel,
            "parent_id": parent_id,
        },
    )


def insert_epci(cursor: Cursor, epci_id: int):

    sql = f"insert into epci values ({epci_id}, '12345678901234', 'Yolo', default, default);"
    cursor.execute(sql)


def insert_fake_referentiel(
    cursor: Cursor,
    referentiel: Referentiel,
    parent_by_action_id: Dict[ActionId, Optional[ActionId]],
):
    for action_id, parent_action_id in parent_by_action_id.items():
        insert_action_relation(cursor, referentiel, action_id, parent_action_id)

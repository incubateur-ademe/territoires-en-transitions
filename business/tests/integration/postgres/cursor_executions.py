from uuid import uuid4
from typing import Dict, Optional

from psycopg import Cursor

from business.utils.action_id import ActionId, ActionReferentiel


def insert_action_relation(
    cursor: Cursor,
    referentiel: ActionReferentiel,
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


# def insert_epci(cursor: Cursor, epci_id: int, siren: Optional[str] = None):
#     siren = siren or f"".join([str(random.randint(1, 9)) for k in range(9)])
#     sql = f"insert into epci values ({epci_id}, %(siren)s, 'Yolo', 'CC');"
#     cursor.execute(sql, {"siren": siren})


def insert_referentiel(
    cursor: Cursor,
    referentiel: ActionReferentiel,
    parent_by_action_id: Dict[ActionId, Optional[ActionId]],
):
    for action_id, parent_action_id in parent_by_action_id.items():
        insert_action_relation(cursor, referentiel, action_id, parent_action_id)


def insert_user(cursor: Cursor, user_id: str):
    cursor.execute(
        """
            insert into auth.users(id) values (%(user_id)s);
            """,
        {"user_id": user_id},
    )


def insert_action_statut_for_collectivite(
    cursor: Cursor,
    *,
    collectivite_id: int,
    action_id: str,
    user_id: Optional[str] = None
):
    """Insert action statut with cursor
    Insert statut to an action for a given collectivite.
    If no user_id is specified, then insert a user id
    """
    if user_id is None:
        user_id = str(uuid4())
        insert_user(cursor, user_id)

    cursor.execute(
        """
        insert into
        action_statut(collectivite_id, action_id, avancement, concerne, modified_by)
        values (%(collectivite_id)s, %(action_id)s, 'fait', true, %(user_id)s);
        """,
        {
            "collectivite_id": collectivite_id,
            "action_id": action_id,
            "user_id": user_id,
        },
    )

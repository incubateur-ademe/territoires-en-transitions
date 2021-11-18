from typing import Optional


def make_sql_to_insert_action_relation(
    referentiel: str = "cae",
    action_id: str = "cae_1.1",
    parent_id: Optional[str] = None,
):
    #  Insert a fake referentiel

    sql = f"""
    insert into action_relation
    values ('{action_id}', '{referentiel}', {f"'{parent_id}'" if parent_id else "null" });
    """

    return sql


def make_sql_insert_epci(nom="Yolo", siren="12345678901234"):
    return f"""
    insert into epci(id, siren, nom) values (default, '{siren}', '{nom}');
    """


def make_sql_insert_user(user_uid="17440546-f389-4d4f-bfdb-b0c94a1bd0f9"):
    return f"""
    insert into auth.users(id) values ('{user_uid}');
    """

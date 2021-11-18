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


def make_sql_insert_score(
    epci_id=1,
    action_id="cae_1.2.3",
    points=100,
    potentiel=100,
    referentiel_points=100,
    concernee=True,
    previsionnel=100,
    total_taches_count=9,
    completed_taches_count=6,
    created_at="2021-01-01",
):
    sql = f"""insert into score (epci_id, action_id, points, potentiel, referentiel_points, concernee, previsionnel, total_taches_count, completed_taches_count, created_at)
            values ({epci_id},
                    '{action_id}',
                    {points},
                    {potentiel},
                    {referentiel_points},
                    {concernee},
                    {previsionnel},
                    {total_taches_count},
                    {completed_taches_count},
                    '{created_at}'::timestamptz);"""
    return sql

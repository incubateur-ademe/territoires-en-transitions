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


def make_sql_insert_epci(nom="Yolo", siren="123456789", nature="CC"):
    return f"""
    insert into epci(siren, nom, nature) values ('{siren}', '{nom}', '{nature}');
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


def make_sql_truncate_all_tables():
    tables = ["action_commentaire", "score", "action_relation", "auth.users"]
    sql = f"""TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE"""
    return sql


def make_sql_insert_user(user_uid: Optional[str] = None, email: Optional[str] = None):
    """Returns a user whose password is 'yolo'"""
    email = email or f"{user_uid}@gmail.com"
    return f"""INSERT INTO auth.users (id, email, encrypted_password) VALUES ('{user_uid}', '{email}', '$2a$10$n8hCY1kKn3BIX56bB3LlQuudbH0m5C7Oqr2dJ8LsIMvlr5JWNGyC.');"""


def make_sql_insert_action_commentaire(
    user_uid: str,
    commentaire="un commentaire",
    action_id="cae_1.2.3",
    collectivite_id=1,
) -> str:
    return f"""
        insert into action_commentaire(collectivite_id, action_id, commentaire, modified_by)
        values ({collectivite_id}, '{action_id}' , '{commentaire}', '{user_uid}')
    """


def make_sql_insert_action_statut(
    user_uid: str,
    action_id="cae_1.2.3",
    concerne=True,
    avancement="fait",
    collectivite_id=1,
):
    return f"""
        insert into action_statut(collectivite_id, action_id, avancement, concerne, modified_by)
        values ({collectivite_id}, '{action_id}', '{avancement}', '{concerne}', '{user_uid}')
    """

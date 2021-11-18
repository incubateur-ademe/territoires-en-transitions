from typing import Optional


def make_sql_to_insert_action_relation(
    referentiel: str, action_id: str, parent_id: Optional[str]
):
    #  Insert a fake referentiel

    sql = f"""
    insert into action_relation
    values ('{action_id}', '{referentiel}', {f"'{parent_id}'" if parent_id else "null" });
    """

    return sql

import supabase

from tests.utils.prepare_cursor import prepare_cursor
from tests.utils.sql_factories import *
from tests.utils.supabase import supabase_query_as_user


class MakeActionApiScenario:
    def __init__(
        self,
        supabase_client: supabase.Client,
        cursor,
        table_name: str,
        action_id="cae_1.2.3",
    ) -> None:
        self.table_name = table_name
        self.supabase_client = supabase_client
        self.cursor = cursor
        self.action_id = action_id
        self._prepare()

    def _prepare(self):
        self.supabase_client.auth.sign_up(email="la@la.com", password="password")
        self.authentified_user = self.supabase_client.auth.sign_in(
            email="la@la.com", password="password"
        )

        prepare_cursor(
            self.cursor, make_sql_to_insert_action_relation(action_id=self.action_id)
        )

    def assert_authentified_user_can_insert_entity(self, entity: dict):
        query = self.supabase_client.table(self.table_name).insert(entity)
        query = supabase_query_as_user(
            self.supabase_client, self.authentified_user, query
        )
        response = query.execute()
        assert response.get("status_code") == 201

        self.cursor.execute(f"select * from {self.table_name};")
        retrieved = self.cursor.fetchall()
        assert len(retrieved) == 1
        assert str(retrieved[0]["modified_by"]) == self.authentified_user["user"]["id"]

    def assert_cannot_insert_entity_with_wrong_user_uid(
        self, entity: dict, wrong_user_uid: str
    ):
        prepare_cursor(
            self.cursor,
            make_sql_insert_user(user_uid=wrong_user_uid),
        )
        query = self.supabase_client.table(self.table_name).insert(entity)
        query = supabase_query_as_user(
            self.supabase_client, self.authentified_user, query
        )

        response = query.execute()
        assert response["status_code"] == 403

    def assert_anyone_can_retrieve_entity(self, insertion_sql: str, editor_uid: str):
        prepare_cursor(
            self.cursor,
            make_sql_insert_user(user_uid=editor_uid) + insertion_sql,
        )
        query = self.supabase_client.from_(self.table_name).select("*")
        query = supabase_query_as_user(
            self.supabase_client, self.authentified_user, query
        )

        response = query.execute()
        assert response["status_code"] == 200
        assert len(response["data"]) == 1
        assert response["data"][0]["modified_by"] == editor_uid

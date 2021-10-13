from tortoise import models
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from tortoise.fields.data import (
    IntField,
    CharField,
    BooleanField,
    DatetimeField,
    JSONField,
)


class ActionMeta(models.Model):
    id = IntField(pk=True)
    action_id = CharField(max_length=36)
    epci_id = CharField(max_length=36)
    meta = JSONField()
    created_at = DatetimeField(auto_now_add=True)
    modified_at = DatetimeField(auto_now=True)
    latest = BooleanField()


ActionMeta_Pydantic = pydantic_model_creator(ActionMeta, name="ActionMeta")
ActionMetaIn_Pydantic = pydantic_model_creator(
    ActionMeta, name="ActionMetaIn", exclude_readonly=True, exclude=("latest",)
)

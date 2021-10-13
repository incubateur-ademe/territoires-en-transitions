from tortoise import models
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from tortoise.fields.data import (
    IntField,
    CharField,
    BooleanField,
    DatetimeField,
    TextField,
)


class ActionCustom(models.Model):
    id = IntField(pk=True)
    uid = CharField(max_length=36)
    epci_id = CharField(max_length=36)
    mesure_id = CharField(max_length=36)
    name = CharField(max_length=100)
    description = TextField()
    created_at = DatetimeField(auto_now_add=True)
    modified_at = DatetimeField(auto_now=True)


ActionCustom_Pydantic = pydantic_model_creator(ActionCustom, name="ActionCustom")
ActionCustomIn_Pydantic = pydantic_model_creator(
    ActionCustom, name="ActionCustomIn", exclude_readonly=True
)

from tortoise import fields, models
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from tortoise.fields.data import IntField, CharField, BooleanField, DatetimeField


class MesureCustom(models.Model):
    id = IntField(pk=True)
    uid = CharField(max_length=36)
    epci_id = CharField(max_length=36)
    climat_pratic_thematic_id = CharField(max_length=100)
    name = CharField(max_length=100)
    created_at = DatetimeField(auto_now_add=True)
    modified_at = DatetimeField(auto_now=True)


MesureCustom_Pydantic = pydantic_model_creator(MesureCustom, name="MesureCustom")
MesureCustomIn_Pydantic = pydantic_model_creator(
    MesureCustom, name="MesureCustomIn", exclude_readonly=True
)

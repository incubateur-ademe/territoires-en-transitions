from tortoise import models
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from tortoise.fields.data import IntField, CharField, BooleanField, DatetimeField, JSONField, TextField


class IndicateurPersonnalise(models.Model):
    id = IntField(pk=True)
    epci_id = CharField(max_length=36)
    uid = CharField(max_length=36)
    custom_id = CharField(max_length=36)
    nom = CharField(max_length=300)
    description = TextField()
    unite = CharField(max_length=36)
    meta = JSONField()
    created_at = DatetimeField(auto_now_add=True)
    modified_at = DatetimeField(auto_now=True)
    latest = BooleanField()
    deleted = BooleanField()


IndicateurPersonnalise_Pydantic = pydantic_model_creator(
    IndicateurPersonnalise, name="IndicateurPersonnalise"
)
IndicateurPersonnaliseIn_Pydantic = pydantic_model_creator(
    IndicateurPersonnalise,
    name="IndicateurPersonnaliseIn",
    exclude_readonly=True,
    exclude=("latest", "deleted"),
)

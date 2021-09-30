from tortoise import models
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from tortoise.fields.data import IntField, CharField, BooleanField, DatetimeField


class Epci(models.Model):
    id = IntField(pk=True)
    uid = CharField(max_length=36)
    insee = CharField(max_length=5)
    siren = CharField(max_length=9)
    nom = CharField(max_length=300)
    created_at = DatetimeField(auto_now_add=True)
    modified_at = DatetimeField(auto_now=True)
    latest = BooleanField()


Epci_Pydantic = pydantic_model_creator(Epci, name="Epci")
EpciIn_Pydantic = pydantic_model_creator(
    Epci, name="EpciIn", exclude_readonly=True, exclude=("latest",)
)

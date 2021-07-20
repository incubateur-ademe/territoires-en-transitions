from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class Epci(models.Model):
    id = fields.IntField(pk=True)
    uid = fields.CharField(max_length=36)
    insee = fields.CharField(max_length=5)
    siren = fields.CharField(max_length=9)
    nom = fields.CharField(max_length=300)
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)
    latest = fields.BooleanField()


Epci_Pydantic = pydantic_model_creator(Epci, name="Epci")
EpciIn_Pydantic = pydantic_model_creator(
    Epci,
    name="EpciIn",
    exclude_readonly=True,
    exclude=("latest",)
)

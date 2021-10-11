from tortoise import models
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from tortoise.fields.data import IntField, CharField, BooleanField, DatetimeField


class UtilisateurDroits(models.Model):
    id = IntField(pk=True)
    ademe_user_id = CharField(max_length=300)
    epci_id = CharField(max_length=36)
    ecriture = BooleanField()
    created_at = DatetimeField(auto_now_add=True)
    modified_at = DatetimeField(auto_now=True)
    latest = BooleanField()


UtilisateurDroits_Pydantic = pydantic_model_creator(
    UtilisateurDroits, name="UtilisateurDroits"
)
UtilisateurDroitsIn_Pydantic = pydantic_model_creator(
    UtilisateurDroits,
    name="UtilisateurDroitsIn",
    exclude_readonly=True,
    exclude=("latest",),
)

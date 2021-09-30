from tortoise import models
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from tortoise.fields.data import (
    IntField,
    CharField,
    BooleanField,
    DatetimeField,
    JSONField,
)


class FicheActionCategorie(models.Model):
    id = IntField(pk=True)
    epci_id = CharField(max_length=36)
    uid = CharField(max_length=36)
    parent_uid = CharField(max_length=36)
    nom = CharField(max_length=300)
    fiche_actions_uids = JSONField()
    created_at = DatetimeField(auto_now_add=True)
    modified_at = DatetimeField(auto_now=True)
    latest = BooleanField()
    deleted = BooleanField()


FicheActionCategorie_Pydantic = pydantic_model_creator(
    FicheActionCategorie, name="FicheActionCategorie"
)
FicheActionCategorieIn_Pydantic = pydantic_model_creator(
    FicheActionCategorie,
    name="FicheActionCategorieIn",
    exclude_readonly=True,
    exclude=("latest", "deleted"),
)

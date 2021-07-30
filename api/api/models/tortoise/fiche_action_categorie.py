from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class FicheActionCategorie(models.Model):
    id = fields.IntField(pk=True)
    epci_id = fields.CharField(max_length=36)
    uid = fields.CharField(max_length=36)
    parent_uid = fields.CharField(max_length=36)
    nom = fields.CharField(max_length=300)
    fiche_actions_uids = fields.JSONField()
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)
    latest = fields.BooleanField()
    deleted = fields.BooleanField()


FicheActionCategorie_Pydantic = pydantic_model_creator(
    FicheActionCategorie, name="FicheActionCategorie"
)
FicheActionCategorieIn_Pydantic = pydantic_model_creator(
    FicheActionCategorie,
    name="FicheActionCategorieIn",
    exclude_readonly=True,
    exclude=("latest", "deleted"),
)

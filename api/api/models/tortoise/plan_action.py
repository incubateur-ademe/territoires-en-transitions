from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator

from api.models.tortoise.fiche_action import FicheAction
from api.models.tortoise.fiche_action_categorie import FicheActionCategorie


class PlanAction(models.Model):
    id = fields.IntField(pk=True)
    epci_id = fields.CharField(max_length=36)
    uid = fields.CharField(max_length=36)
    nom = fields.CharField(max_length=300)
    categories = fields.JSONField()
    fiches_by_category = fields.JSONField()
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)
    latest = fields.BooleanField()
    deleted = fields.BooleanField()


PlanAction_Pydantic = pydantic_model_creator(PlanAction, name="PlanAction")
PlanActionIn_Pydantic = pydantic_model_creator(
    PlanAction,
    name="PlanActionIn",
    exclude_readonly=True,
    exclude=("latest", "deleted"),
)

from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class ActionMeta(models.Model):
    id = fields.IntField(pk=True)
    action_id = fields.CharField(max_length=36)
    epci_id = fields.CharField(max_length=36)
    meta = fields.JSONField()
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)
    latest = fields.BooleanField()


ActionMeta_Pydantic = pydantic_model_creator(ActionMeta, name="ActionMeta")
ActionMetaIn_Pydantic = pydantic_model_creator(
    ActionMeta,
    name="ActionMetaIn",
    exclude_readonly=True,
    exclude=("latest",)
)

from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class ActionCustom(models.Model):
    id = fields.IntField(pk=True)
    uid = fields.CharField(max_length=36)
    epci_id = fields.CharField(max_length=36)
    mesure_id = fields.CharField(max_length=36)
    name = fields.CharField(max_length=100)
    description = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)


ActionCustom_Pydantic = pydantic_model_creator(ActionCustom, name="ActionCustom")
ActionCustomIn_Pydantic = pydantic_model_creator(
    ActionCustom, name="ActionCustomIn", exclude_readonly=True
)

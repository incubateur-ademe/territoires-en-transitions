from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class ActionStatus(models.Model):
    id = fields.IntField(pk=True)
    action_id = fields.CharField(max_length=36)
    epci_id = fields.CharField(max_length=36)
    avancement = fields.CharField(max_length=36)
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)
    latest = fields.BooleanField()


ActionStatus_Pydantic = pydantic_model_creator(ActionStatus, name="ActionStatus")
ActionStatusIn_Pydantic = pydantic_model_creator(
    ActionStatus,
    name="ActionStatusIn",
    exclude_readonly=True,
    exclude=("latest",)
)

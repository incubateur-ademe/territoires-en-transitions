from tortoise import models
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from tortoise.fields.data import IntField, CharField, BooleanField, DatetimeField


class ActionStatus(models.Model):
    id = IntField(pk=True)
    action_id = CharField(max_length=36)
    epci_id = CharField(max_length=36)
    avancement = CharField(max_length=36)
    created_at = DatetimeField(auto_now_add=True)
    modified_at = DatetimeField(auto_now=True)
    latest = BooleanField()


ActionStatus_Pydantic = pydantic_model_creator(ActionStatus, name="ActionStatus")
ActionStatusIn_Pydantic = pydantic_model_creator(
    ActionStatus, name="ActionStatusIn", exclude_readonly=True, exclude=("latest",)
)

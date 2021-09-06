from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class MesureCustom(models.Model):
    id = fields.IntField(pk=True)
    uid = fields.CharField(max_length=36)
    epci_id = fields.CharField(max_length=36)
    climat_pratic_thematic_id = fields.CharField(max_length=100)
    name = fields.CharField(max_length=100)
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)


MesureCustom_Pydantic = pydantic_model_creator(MesureCustom, name="MesureCustom")
MesureCustomIn_Pydantic = pydantic_model_creator(
    MesureCustom, name="MesureCustomIn", exclude_readonly=True
)

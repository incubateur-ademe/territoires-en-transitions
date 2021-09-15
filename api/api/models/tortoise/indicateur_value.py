from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class IndicateurValue(models.Model):
    id = fields.IntField(pk=True)
    epci_id = fields.CharField(max_length=36)
    indicateur_id = fields.CharField(max_length=36)
    value = fields.FloatField(max_length=36)
    year = fields.IntField(max_length=4)
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)
    latest = fields.BooleanField()


IndicateurValue_Pydantic = pydantic_model_creator(
    IndicateurValue, name="IndicateurValue"
)
IndicateurValueIn_Pydantic = pydantic_model_creator(
    IndicateurValue,
    name="IndicateurValueIn",
    exclude_readonly=True,
    exclude=("latest",),
)

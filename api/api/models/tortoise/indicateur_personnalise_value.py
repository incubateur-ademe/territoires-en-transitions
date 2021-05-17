from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class IndicateurPersonnaliseValue(models.Model):
    id = fields.IntField(pk=True)
    epci_id = fields.CharField(max_length=36)
    indicateur_id = fields.CharField(max_length=136)
    value = fields.CharField(max_length=36)
    year = fields.IntField(max_length=4)
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)


IndicateurPersonnaliseValue_Pydantic = pydantic_model_creator(IndicateurPersonnaliseValue, name="IndicateurPersonnaliseValue")
IndicateurPersonnaliseValueIn_Pydantic = pydantic_model_creator(IndicateurPersonnaliseValue, name="IndicateurPersonnaliseValueIn", exclude_readonly=True)

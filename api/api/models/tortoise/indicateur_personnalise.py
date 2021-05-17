from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class IndicateurPersonnalise(models.Model):
    id = fields.IntField(pk=True)
    epci_id = fields.CharField(max_length=36)
    uid = fields.CharField(max_length=36)
    custom_id = fields.CharField(max_length=36)
    nom = fields.CharField(max_length=300)
    description = fields.TextField()
    unite = fields.CharField(max_length=36)
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)


IndicateurPersonnalise_Pydantic = pydantic_model_creator(IndicateurPersonnalise,
                                                         name="IndicateurPersonnalise")
IndicateurPersonnaliseIn_Pydantic = pydantic_model_creator(IndicateurPersonnalise,
                                                           name="IndicateurPersonnaliseIn",
                                                           exclude_readonly=True)

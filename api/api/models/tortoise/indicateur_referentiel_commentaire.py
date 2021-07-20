from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class IndicateurReferentielCommentaire(models.Model):
    id = fields.IntField(pk=True)
    epci_id = fields.CharField(max_length=36)
    indicateur_id = fields.CharField(max_length=136)
    value = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)
    latest = fields.BooleanField()


IndicateurReferentielCommentaire_Pydantic = pydantic_model_creator(
    IndicateurReferentielCommentaire,
    name="IndicateurReferentielCommentaire"
)
IndicateurReferentielCommentaireIn_Pydantic = pydantic_model_creator(
    IndicateurReferentielCommentaire,
    name="IndicateurReferentielCommentaireIn",
    exclude_readonly=True,
    exclude=("latest",),
)

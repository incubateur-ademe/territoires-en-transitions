from tortoise import fields, models
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from tortoise.fields.data import (
    IntField,
    CharField,
    BooleanField,
    DatetimeField,
    TextField,
)


class IndicateurReferentielCommentaire(models.Model):
    id = IntField(pk=True)
    epci_id = CharField(max_length=36)
    indicateur_id = CharField(max_length=136)
    value = TextField()
    created_at = DatetimeField(auto_now_add=True)
    modified_at = DatetimeField(auto_now=True)
    latest = BooleanField()


IndicateurReferentielCommentaire_Pydantic = pydantic_model_creator(
    IndicateurReferentielCommentaire, name="IndicateurReferentielCommentaire"
)
IndicateurReferentielCommentaireIn_Pydantic = pydantic_model_creator(
    IndicateurReferentielCommentaire,
    name="IndicateurReferentielCommentaireIn",
    exclude_readonly=True,
    exclude=("latest",),
)

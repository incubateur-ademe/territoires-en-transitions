from tortoise import models
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from tortoise.fields.data import (
    FloatField,
    IntField,
    CharField,
    BooleanField,
    DatetimeField,
    JSONField,
    TextField,
)


class FicheAction(models.Model):
    id = IntField(pk=True)
    epci_id = CharField(max_length=36)
    uid = CharField(max_length=36)
    custom_id = CharField(max_length=36)
    avancement = CharField(max_length=36)
    en_retard = BooleanField()
    referentiel_action_ids = JSONField()
    referentiel_indicateur_ids = JSONField()
    titre = CharField(max_length=300)
    description = TextField()
    budget = FloatField()
    personne_referente = CharField(max_length=100)
    structure_pilote = CharField(max_length=300)
    elu_referent = CharField(max_length=300)
    partenaires = CharField(max_length=300)
    commentaire = TextField()
    date_debut = CharField(max_length=36)
    date_fin = CharField(max_length=36)
    indicateur_personnalise_ids = JSONField()
    latest = BooleanField()
    deleted = BooleanField()
    created_at = DatetimeField(auto_now_add=True)
    modified_at = DatetimeField(auto_now=True)


FicheAction_Pydantic = pydantic_model_creator(
    FicheAction,
    name="FicheAction",
)
FicheActionIn_Pydantic = pydantic_model_creator(
    FicheAction,
    name="FicheActionIn",
    exclude_readonly=True,
    exclude=("latest", "deleted"),
)

from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class FicheAction(models.Model):
    id = fields.IntField(pk=True)
    epci_id = fields.CharField(max_length=36)
    uid = fields.CharField(max_length=36)

    plans_action: fields.ManyToManyRelation["PlanAction"] = fields.ManyToManyField(
        "models.PlanAction", related_name="fiches", through="fiche_plan"
    )

    custom_id = fields.CharField(max_length=36)
    avancement = fields.CharField(max_length=36)
    en_retard = fields.BooleanField()
    referentiel_action_ids = fields.JSONField()
    referentiel_indicateur_ids = fields.JSONField()
    titre = fields.CharField(max_length=300)
    description = fields.TextField()
    budget = fields.FloatField()
    personne_referente = fields.CharField(max_length=100)
    structure_pilote = fields.CharField(max_length=300)
    elu_referent = fields.CharField(max_length=300)
    partenaires = fields.CharField(max_length=300)
    commentaire = fields.TextField()
    date_debut = fields.CharField(max_length=36)
    date_fin = fields.CharField(max_length=36)
    indicateur_personnalise_ids = fields.JSONField()
    latest = fields.BooleanField()
    deleted = fields.BooleanField()
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)


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

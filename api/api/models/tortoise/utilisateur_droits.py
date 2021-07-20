from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class UtilisateurDroits(models.Model):
    id = fields.IntField(pk=True)
    ademe_user_id = fields.CharField(max_length=300)
    epci_id = fields.CharField(max_length=36)
    ecriture = fields.BooleanField()
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)
    latest = fields.BooleanField()


UtilisateurDroits_Pydantic = pydantic_model_creator(UtilisateurDroits, name="UtilisateurDroits")
UtilisateurDroitsIn_Pydantic = pydantic_model_creator(
    UtilisateurDroits,
    name="UtilisateurDroitsIn",
    exclude_readonly=True,
    exclude=('latest',),
)

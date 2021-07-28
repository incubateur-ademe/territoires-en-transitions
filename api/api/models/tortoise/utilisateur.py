from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class Utilisateur(models.Model):
    id = fields.IntField(pk=True)
    ademe_user_id = fields.CharField(max_length=300)
    vie_privee_conditions = fields.CharField(max_length=300)
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)
    latest = fields.BooleanField()


Utilisateur_Pydantic = pydantic_model_creator(Utilisateur, name="Utilisateur")
UtilisateurIn_Pydantic = pydantic_model_creator(
    Utilisateur, name="UtilisateurIn", exclude_readonly=True
)

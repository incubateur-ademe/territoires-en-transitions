from tortoise import models
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from tortoise.fields.data import IntField, CharField, BooleanField, DatetimeField


class Utilisateur(models.Model):
    id = IntField(pk=True)
    ademe_user_id = CharField(max_length=300)
    vie_privee_conditions = CharField(max_length=300)
    created_at = DatetimeField(auto_now_add=True)
    modified_at = DatetimeField(auto_now=True)


Utilisateur_Pydantic = pydantic_model_creator(Utilisateur, name="Utilisateur")
UtilisateurIn_Pydantic = pydantic_model_creator(
    Utilisateur, name="UtilisateurIn", exclude_readonly=True
)

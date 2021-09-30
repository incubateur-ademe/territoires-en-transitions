from tortoise import models
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from tortoise.fields.data import IntField, CharField, BooleanField, DatetimeField


class UtilisateurConnecte(models.Model):
    id = IntField(pk=True)
    ademe_user_id = CharField(max_length=300)
    access_token = CharField(max_length=300)
    refresh_token = CharField(max_length=300)
    email = CharField(max_length=300)
    nom = CharField(max_length=300)
    prenom = CharField(max_length=300)
    created_at = DatetimeField(auto_now_add=True)
    modified_at = DatetimeField(auto_now=True)
    latest = BooleanField()


UtilisateurConnecte_Pydantic = pydantic_model_creator(
    UtilisateurConnecte, name="UtilisateurConnecte"
)
UtilisateurConnecterIn_Pydantic = pydantic_model_creator(
    UtilisateurConnecte, name="UtilisateuConnecterIn", exclude_readonly=True
)

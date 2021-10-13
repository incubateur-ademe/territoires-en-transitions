from tortoise import models
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from tortoise.fields.data import IntField, CharField, DatetimeField


class AdemeUtilisateur(models.Model):
    id = IntField(pk=True)
    ademe_user_id = CharField(max_length=300)
    email = CharField(max_length=300)
    nom = CharField(max_length=300)
    prenom = CharField(max_length=300)
    created_at = DatetimeField(auto_now_add=True)
    modified_at = DatetimeField(auto_now=True)


AdemeUtilisateur_Pydantic = pydantic_model_creator(
    AdemeUtilisateur, name="AdemeUtilisateur"
)
AdemeUtilisateurrIn_Pydantic = pydantic_model_creator(
    AdemeUtilisateur, name="AdemeUtilisateurIn", exclude_readonly=True
)

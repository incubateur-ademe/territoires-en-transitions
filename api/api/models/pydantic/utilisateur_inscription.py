from pydantic import BaseModel

from api.models.pydantic.ademe_user_registration import AdemeUserRegistration


class UtilisateurInscription(BaseModel):
    """User data retrieved from OpenId token"""
    email: str
    nom: str
    prenom: str
    vie_privee_conditions: str

    def to_registration(self) -> AdemeUserRegistration:
        return AdemeUserRegistration(email=self.email, lastname=self.nom, firstname=self.prenom)

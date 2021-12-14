from pydantic import BaseModel


class AdemeUtilisateur(BaseModel):
    """
    Represent a connected user.

    Used client side to keep as `session` data.
    Used server side to use access token Personally Identifiable Information.
    """

    ademe_user_id: str
    email: str
    nom: str
    prenom: str

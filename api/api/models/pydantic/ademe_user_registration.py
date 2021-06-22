from pydantic import BaseModel


class AdemeUserRegistration(BaseModel):
    """Data sent to the ADEME users API auth/register endpoint to create a new user"""
    email: str
    firstname: str
    lastname: str

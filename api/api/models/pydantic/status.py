from pydantic import BaseModel


class Status(BaseModel):
    message: str

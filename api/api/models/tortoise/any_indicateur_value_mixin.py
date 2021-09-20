from tortoise import fields


class IndicateurValueMixin:
    id = fields.IntField(pk=True)
    epci_id = fields.CharField(max_length=36)
    indicateur_id = fields.CharField(max_length=36)
    value = fields.FloatField()
    year = fields.IntField(max_length=4)
    created_at = fields.DatetimeField(auto_now_add=True)
    modified_at = fields.DatetimeField(auto_now=True)
    latest = fields.BooleanField()

from .indicateur_value_mixin import IndicateurValueMixin
from tortoise.models import Model


class IndicateurResultat(IndicateurValueMixin, Model):
    pass


# class IndicateurObjectif(IndicateurValueGeneric):
#     pass


class IndicateurPersonnaliseResultat(IndicateurValueMixin, Model):
    pass


# class IndicateurPersonnaliseObjectif(IndicateurValueGeneric):
#     pass

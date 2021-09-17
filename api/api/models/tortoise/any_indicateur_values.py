from .indicateur_value_mixin import IndicateurValueMixin
from tortoise.models import Model


class IndicateurResultat(IndicateurValueMixin, Model):
    pass


class IndicateurObjectif(IndicateurValueMixin, Model):
    pass


class IndicateurPersonnaliseResultat(IndicateurValueMixin, Model):
    pass


class IndicateurPersonnaliseObjectif(IndicateurValueMixin, Model):
    pass

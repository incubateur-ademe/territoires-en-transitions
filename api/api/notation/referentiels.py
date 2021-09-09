from api.data.generated.referentiels import actions
from api.notation.referentiel import Referentiel
from api.utils.get_referentiel import get_referentiel_from_action


referentiel_eci = Referentiel(
    next(action for action in actions if get_referentiel_from_action(action) == "eci"),
    mesure_depth=2,
)

# referentiel_cae = Referentiel(
#     next(action for action in actions if get_referentiel_from_action(action) == "cae"),
#     mesure_level=3,
# )

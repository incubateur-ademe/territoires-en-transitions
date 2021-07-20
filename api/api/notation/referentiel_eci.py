from api.data.generated.referentiels import actions
from api.notation.referentiel import Referentiel

referentiel_eci = Referentiel(
    next(action for action in actions if action.id.startswith("economie_circulaire"))
)

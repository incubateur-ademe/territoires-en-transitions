from dataclasses import dataclass

from business.domain.models.litterals import ReferentielId


class DataLayerEvent:
    pass


@dataclass
class UserUpdatedActionStatusForEpci(DataLayerEvent):
    epci_id: str
    referentiel_id: ReferentielId
    # user_id: str (If we wanted to keep trace also in the scores)

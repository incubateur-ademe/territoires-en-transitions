# from dataclasses import dataclass
# from typing import Any, Literal, Dict, Type, Union

# from business.domain.models.litterals import ReferentielId

# DataLayerTopic = Literal["epci_action_statut_update"]


# class DataLayerEvent:
#     pass


# @dataclass
# class EpciActionStatutUpdatedEvent(DataLayerEvent):
#     epci_id: str
#     referentiel_id: ReferentielId
#     # created_at: str
#     # user_id: str (If we wanted to keep trace also in the scores)


# from rx.core.typing import Mapper


# def get_mapper_from_topic(topic: DataLayerTopic) -> Mapper:
#     if topic == "epci_action_statut_update":
#         return lambda d: EpciActionStatutUpdatedEvent(
#             **d["record"]  # TODO : validate schema !
#             # epci_id=d["record"]["epci_id"],
#             # referentiel_id=d["record"]["referentiel_id"],
#         )
#     raise ValueError

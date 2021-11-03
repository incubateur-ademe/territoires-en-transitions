from data_layer.realtime import Realtime
from data_layer.repositories import EpciRepository


class Business:
    """The stuff that should happen business side"""

    def __init__(self, realtime: Realtime, epci_repo: EpciRepository) -> None:
        super().__init__()
        self.realtime = realtime
        self.epci_repo = epci_repo

        # todo

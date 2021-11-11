import abc
from typing import List


from business.domain.models.indicateur import Indicateur, IndicateurId


class AbstractIndicateurRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def add_indicateur(
        self,
        indicateurs: List[Indicateur],
    ):
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_indicateur_ids(
        self,
    ) -> List[IndicateurId]:
        raise NotImplementedError


class InMemoryIndicateurRepository(AbstractIndicateurRepository):
    def __init__(self) -> None:
        self._indicateurs: List[Indicateur] = []

    def add_indicateur(
        self,
        indicateurs: List[Indicateur],
    ):
        self._indicateurs += indicateurs

    def get_all_indicateur_ids(
        self,
    ) -> List[IndicateurId]:
        return [indicateur.indicateur_id for indicateur in self._indicateurs]

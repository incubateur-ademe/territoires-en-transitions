import abc
from typing import List

from business.domain.models.action_definition import ActionDefinition


class AbstractActionDefinitionRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    # def add_node(self, entity: MarkdownActionNode):
    #     entities = markdown_action_node_to_markdown_actions(entity)
    #     for entity in entities:
    #         self._add(entity)

    @abc.abstractmethod
    def add_entities(self, entities=List[ActionDefinition]):
        raise NotImplementedError


class InMemoryActionDefinitionRepository(AbstractActionDefinitionRepository):
    def __init__(self, entities: List[ActionDefinition] = None) -> None:
        self._entities = entities or []

    def add_entities(self, entities=List[ActionDefinition]):
        self._entities += entities

    # For test purposes only
    @property
    def entities(self) -> List[ActionDefinition]:
        return self._entities

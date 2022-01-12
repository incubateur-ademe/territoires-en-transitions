import math
from typing import Any, Dict, List

from business.referentiel.domain.models.markdown_action_node import MarkdownActionNode

from ..models import events
from ..models.action_children import ActionChildren
from ..models.action_definition import ActionDefinition

# from ..models.markdown_action_node import MarkdownActionNode
from ..models.action_points import ActionPoints
from business.core.domain.models.referentiel import ActionReferentiel
from business.utils.action_id import ActionId

from business.core.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
)
from business.utils.action_id import build_action_id
from business.utils.use_case import UseCase


class MarkdownReferentielNodeInconsistent(Exception):
    pass


class ConvertMarkdownReferentielNodeToEntities(UseCase):
    points_round_digits = 2

    def __init__(self, bus: AbstractDomainMessageBus) -> None:
        self.bus = bus

    def execute(self, trigger: events.MarkdownReferentielFolderParsed):
        root_node = trigger.referentiel_node

        # self.forward_nodes = self._build_forward_nodes(self.referentiel_node)
        # self.backward_nodes = self.forward_nodes[::-1]

        if root_node is None or root_node.referentiel is None:
            self.bus.publish_event(
                events.MarkdownReferentielNodeInconsistencyFound(
                    f"L'action racine (dont l'identifiant est '') doit avoir un `referentiel` renseigné.'"
                )
            )
            return

        referentiel: ActionReferentiel = root_node.referentiel
        try:
            definition_entities = (
                self.infer_action_definition_entities_from_markdown_root_node(
                    root_node, referentiel
                )
            )
            children_entities = (
                self.infer_action_children_entities_from_markdown_root_node(
                    root_node, referentiel
                )
            )

            self.check_children_definition_percentages_sum_to_100(
                children_entities, definition_entities
            )

            points_by_action_id = self.infer_points_by_id_from_markdown_action_node(
                children_entities, definition_entities, referentiel
            )

            self.check_action_points_values_are_not_nan(points_by_action_id)
            self.check_actions_children_points_sum_to_parent_points(  # TODO
                points_by_action_id, children_entities
            )
        except MarkdownReferentielNodeInconsistent as inconsistency:
            self.bus.publish_event(
                events.MarkdownReferentielNodeInconsistencyFound(str(inconsistency))
            )
            return

        points_entities = [
            ActionPoints(
                referentiel=referentiel,
                action_id=action_id,
                value=points_value if points_value is not None else math.nan,
            )
            for action_id, points_value in points_by_action_id.items()
        ]
        self.bus.publish_event(
            events.MarkdownReferentielNodeConvertedToEntities(
                points=points_entities,
                definitions=list(definition_entities.values()),
                children=list(children_entities.values()),
                referentiel=referentiel,
            )
        )

    # def check_all_identifiant_are_unique(
    #     self,
    # ):
    #     all_identifiants = [node.identifiant for node in self.forward_nodes]

    #     if len(all_identifiants) != len(set(all_identifiants)):
    #         raise MarkdownReferentielNodeInconsistent(
    #             f"Tous les identifiants devraient être uniques. Doublons: "
    #         )

    @staticmethod
    def check_children_definition_percentages_sum_to_100(
        children_entities: Dict[ActionId, ActionChildren],
        definition_entities: Dict[ActionId, ActionDefinition],
    ):
        for children_entity in children_entities.values():
            children_ids = children_entity.children
            children_definitions = [
                definition_entities[child_id] for child_id in children_ids
            ]
            if children_definitions and children_definitions[0].pourcentage is not None:
                children_percentages = [
                    child_definition.pourcentage or 0.0
                    for child_definition in children_definitions
                ]
                sum_children_percentages = sum(children_percentages)
                if sum_children_percentages != 100:
                    raise MarkdownReferentielNodeInconsistent(
                        f"Les valeurs des actions {', '.join(children_ids)} sont renseignées en pourcentage, mais leur somme fait {sum_children_percentages} au lieu de 100."
                    )

    def check_actions_children_points_sum_to_parent_points(
        self,
        points_by_action_id: Dict[ActionId, float],
        children_entities: Dict[ActionId, ActionChildren],
    ):
        for children_entity in children_entities.values():
            children_ids = children_entity.children
            if children_ids:
                parent_point = points_by_action_id[children_entity.action_id]
                children_point_sum = self._round(
                    sum([points_by_action_id[child_id] for child_id in children_ids])
                )
                if not math.isclose(parent_point, children_point_sum, abs_tol=1e-1):
                    raise MarkdownReferentielNodeInconsistent(
                        f"Les valeurs des actions de l'action {children_entity.action_id} sont renseignées en points, mais leur somme fait {children_point_sum} au lieu de {parent_point}."
                    )

    def check_action_points_values_are_not_nan(
        self, points_by_identifiant: Dict[ActionId, float]
    ):
        for action_id, point_value in points_by_identifiant.items():
            if math.isnan(point_value):
                raise MarkdownReferentielNodeInconsistent(
                    f"Les points de l'action {action_id} n'ont pas pu être inférés. "
                )

    def infer_points_by_id_from_markdown_action_node(
        self,
        children_entities: Dict[ActionId, ActionChildren],
        definition_entities: Dict[ActionId, ActionDefinition],
        referentiel: ActionReferentiel,
    ) -> Dict[ActionId, float]:
        """Infer points of all actions given definitions

        First, consider all points that are specified in the definitions.
        Then, propagate the points backward (from children to parents)
        Finaly, propagate the points forward (from parents to children) using pourcentage or equi-distribution
        """

        forward_ids = list(children_entities.keys())
        backward_ids = forward_ids[::1]

        # First, report points that are written in the definitions
        points_by_identifiant = {
            definition.identifiant: definition.points
            for definition in definition_entities.values()
            if definition.points is not None
        }

        # Then, fill actions with 0 points
        for action_id in forward_ids:  # Forward
            children_ids = children_entities[action_id].children
            children_definitions = [
                definition_entities[child_id] for child_id in children_ids
            ]
            some_points_defined = any(
                [child.points is not None for child in children_definitions]
            )
            if some_points_defined:
                for child_definition in children_definitions:
                    if child_definition.points is None:
                        points_by_identifiant[child_definition.identifiant] = 0.0

        # Then, fill parent points from children
        for action_id in backward_ids:
            children_ids = children_entities[action_id].children
            action_definition = definition_entities[action_id]

            if (
                action_definition.identifiant not in points_by_identifiant
                and action_definition.pourcentage is None
            ):
                children_definitions = [
                    definition_entities[child_id] for child_id in children_ids
                ]
                if (
                    children_definitions
                    and children_definitions[0].identifiant in points_by_identifiant
                ):
                    points_by_identifiant[action_definition.identifiant] = sum(
                        [
                            points_by_identifiant[child.identifiant]
                            for child in children_definitions
                        ]
                    )

        # Then, replace percentages by points
        for action_id in forward_ids:  # self.forward_nodes:
            action_definition = definition_entities[action_id]
            action_points = points_by_identifiant[action_definition.identifiant]
            children_definitions = [
                definition_entities[child_id]
                for child_id in children_entities[action_id].children
            ]
            if (
                children_definitions
                and children_definitions[0].identifiant not in points_by_identifiant
            ):
                percentage_equidistributed = all(
                    [child.points is None for child in children_definitions]
                )  # if pourcentage is not specified, then points are equi-distributed within siblings
                for child_definition in children_definitions:
                    pourcentage = (
                        100 / len(children_definitions)
                        if percentage_equidistributed
                        else (child_definition.pourcentage or 0.0)
                    )  # if some pourcentage amongst siblings are specified, then those that are not have a pourcentage of 0.
                    child_points = self._round((pourcentage / 100) * action_points)
                    points_by_identifiant[child_definition.identifiant] = child_points

        return {
            build_action_id(referentiel, identifiant): points
            for (identifiant, points) in points_by_identifiant.items()
        }

    @staticmethod
    def infer_action_definition_entities_from_markdown_root_node(
        root_node: MarkdownActionNode, referentiel: ActionReferentiel
    ) -> Dict[ActionId, ActionDefinition]:
        """Convert a MarkdownActionNode to a list of ActionDefinition"""
        action_definition_entities: Dict[ActionId, ActionDefinition] = {}

        def _recursively_add_definition(node: MarkdownActionNode):
            action_id = build_action_id(referentiel, node.identifiant)
            if action_id in action_definition_entities:
                raise MarkdownReferentielNodeInconsistent(
                    f"Tous les identifiants devraient être uniques. Doublons: {node.identifiant}"
                )
            action_definition_entity = ActionDefinition(
                referentiel=referentiel,
                action_id=action_id,
                identifiant=node.identifiant,
                nom=node.nom,
                contexte=node.contexte,
                description=node.description,
                exemples=node.exemples,
                ressources=node.ressources,
                points=node.points,
                pourcentage=node.pourcentage,
            )
            action_definition_entities[action_id] = action_definition_entity
            for child_node in node.actions:
                _recursively_add_definition(child_node)
            return action_definition_entities

        return _recursively_add_definition(root_node)

    @staticmethod
    def infer_action_children_entities_from_markdown_root_node(
        root_node: MarkdownActionNode, referentiel: ActionReferentiel
    ) -> Dict[ActionId, ActionChildren]:
        """Convert a MarkdownActionNode to a list of ActionDefinition"""
        action_children_entities: Dict[ActionId, ActionChildren] = {}

        def _recursively_add_children(node: MarkdownActionNode):
            action_id = build_action_id(referentiel, node.identifiant)
            action_children_entity = ActionChildren(
                referentiel=referentiel,
                action_id=action_id,
                children=[
                    build_action_id(referentiel, child.identifiant)
                    for child in node.actions
                ],
            )
            action_children_entities[action_id] = action_children_entity
            for child_node in node.actions:
                _recursively_add_children(child_node)
            return action_children_entities

        return _recursively_add_children(root_node)

    @staticmethod
    def _format_action_identifiants(actions: List[Any]) -> str:
        return ", ".join([action.identifiant for action in actions])

    def _round(self, value: float) -> float:
        return round(value, self.points_round_digits)

    # @staticmethod
    # def _build_forward_nodes(node: MarkdownActionNode) -> List[MarkdownActionNode]:
    #     forward_nodes: List[MarkdownActionNode] = []

    #     def _append_node(node: MarkdownActionNode):
    #         forward_nodes.append(node)
    #         if node.actions:
    #             list(map(_append_node, node.actions))

    #     _append_node(node)
    #     return forward_nodes

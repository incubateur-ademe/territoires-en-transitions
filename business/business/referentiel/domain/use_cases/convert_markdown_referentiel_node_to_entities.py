from cmath import nan
import math
from typing import Any, Dict, List

from business.referentiel.domain.models.markdown_action_node import MarkdownActionNode
from business.utils.action_tree import ActionTree

from ..models import events
from ..models.action_children import ActionChildren
from ..models.action_definition import ActionDefinition

from ..models.action_computed_point import ActionComputedPoint
from business.referentiel.domain.models.referentiel import ActionReferentiel
from business.utils.action_id import ActionId

from business.utils.domain_message_bus import (
    AbstractDomainMessageBus,
)
from business.utils.action_id import build_action_id
from business.utils.use_case import UseCase


class MarkdownReferentielNodeInconsistent(Exception):
    pass


class ConvertMarkdownReferentielNodeToEntities(UseCase):
    # points_round_digits = 4

    def __init__(self, bus: AbstractDomainMessageBus) -> None:
        self.bus = bus

    def execute(self, trigger: events.MarkdownReferentielFolderParsed):
        root_node = trigger.referentiel_node

        if root_node is None or root_node.referentiel is None:
            self.bus.publish_event(
                events.MarkdownReferentielNodeInconsistencyFound(
                    f"L'action racine (dont l'identifiant est '') doit avoir un `referentiel` renseigné.'"
                )
            )
            return

        referentiel: ActionReferentiel = root_node.referentiel
        try:
            definition_entities = self.infer_definitions_by_id_from_markdown_root_node(
                root_node, referentiel
            )
            children_entities = self.infer_children_by_id_from_markdown_root_node(
                root_node, referentiel
            )

            action_tree = ActionTree(list(children_entities.values()))

            points_by_action_id = self.infer_points_by_id_from_definitions_and_children(
                action_tree, definition_entities
            )

            self.check_all_action_points_have_been_infered(
                action_tree, points_by_action_id
            )
            self.check_all_children_points_sum_to_parent_points(
                points_by_action_id, children_entities
            )
        except MarkdownReferentielNodeInconsistent as inconsistency:
            self.bus.publish_event(
                events.MarkdownReferentielNodeInconsistencyFound(str(inconsistency))
            )
            return

        points_entities = [
            ActionComputedPoint(
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

    def check_all_children_points_sum_to_parent_points(
        self,
        points_by_action_id: Dict[ActionId, float],
        children_entities: Dict[ActionId, ActionChildren],
    ):
        for children_entity in children_entities.values():
            children_ids = children_entity.children
            if children_ids:
                parent_point = points_by_action_id[children_entity.action_id]
                children_point_sum = sum(
                    [points_by_action_id[child_id] for child_id in children_ids]
                )
                if not math.isclose(parent_point, children_point_sum, rel_tol=1e-5):
                    raise MarkdownReferentielNodeInconsistent(
                        f"Les valeurs des actions de l'action {children_entity.action_id} sont renseignées en points, mais leur somme fait {children_point_sum} au lieu de {parent_point}."
                    )

    def check_all_action_points_have_been_infered(
        self, action_tree: ActionTree, points_by_identifiant: Dict[ActionId, float]
    ):
        for action_id in action_tree.forward_ids:
            point_value = points_by_identifiant.get(action_id, nan)
            if math.isnan(point_value):
                raise MarkdownReferentielNodeInconsistent(
                    f"Les points de l'action {action_id} n'ont pas pu être inféré. "
                )

    def infer_points_by_id_from_definitions_and_children(
        self,
        action_tree: ActionTree,
        definition_entities: Dict[ActionId, ActionDefinition],
    ) -> Dict[ActionId, float]:
        """Infer points of all actions given definitions

        First, consider all points that are specified in the definitions.
        Then, propagate the points backward (from children to parents)
        Finaly, propagate the points forward (from parents to children) using pourcentage or equi-distribution
        """

        # First, report points that are written in the definitions
        points_by_id = {
            action_id: definition.points
            for action_id, definition in definition_entities.items()
            if definition.points is not None
        }

        # Then, fill actions with 0 points if siblings have defined points (@florian : should this happen ?)
        for action_id in action_tree._forward_ids:  # Forward
            children_ids = action_tree.get_children(action_id)

            some_points_defined = any(
                [
                    definition_entities[child_id].points is not None
                    for child_id in children_ids
                ]
            )
            if some_points_defined:
                for child_id in children_ids:
                    child_definition = definition_entities[child_id]
                    if child_definition.points is None:
                        points_by_id[child_id] = 0.0

        # Then, fill parent points from children
        for action_id in action_tree.backward_ids:
            children_ids = action_tree.get_children(action_id)
            action_definition = definition_entities[action_id]

            if action_id not in points_by_id and action_definition.pourcentage is None:
                if children_ids and children_ids[0] in points_by_id:
                    points_by_id[action_id] = sum(
                        [points_by_id[child_id] for child_id in children_ids]
                    )
        # Then, replace percentages by points
        for action_id in action_tree._forward_ids:
            action_points = points_by_id[action_id]
            children_ids = action_tree.get_children(action_id)
            if children_ids and children_ids[0] not in points_by_id:
                percentage_equidistributed = all(
                    [
                        definition_entities[child_id].pourcentage in [None, 0.0]
                        for child_id in children_ids
                    ]
                )  # if pourcentage is not specified, then points are equi-distributed within siblings

                if not percentage_equidistributed:
                    sum_children_percentages = sum(
                        [
                            definition_entities[child_id].pourcentage or 0.0
                            for child_id in children_ids
                        ]
                    )
                    if sum_children_percentages != 100:
                        raise MarkdownReferentielNodeInconsistent(
                            f"Les valeurs des actions {', '.join(children_ids)} sont renseignées en pourcentage, mais leur somme fait {sum_children_percentages} au lieu de 100."
                        )
                child_ids_with_percentage_0 = [
                    child_id
                    for child_id in children_ids
                    if definition_entities[child_id].pourcentage == 0
                ]
                for child_id in children_ids:
                    if percentage_equidistributed:
                        if child_id in child_ids_with_percentage_0:
                            child_points = 0.0
                        else:
                            child_points = action_points / (
                                len(children_ids) - len(child_ids_with_percentage_0)
                            )
                    else:
                        child_points = (
                            (definition_entities[child_id].pourcentage or 0.0) / 100
                        ) * action_points
                        # if some pourcentage amongst siblings are specified, then those that are not have a pourcentage of 0.
                    points_by_id[child_id] = child_points
        return points_by_id

    @staticmethod
    def infer_definitions_by_id_from_markdown_root_node(
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
                perimetre_evaluation=node.perimetre_de_levaluation,
                reduction_potentiel=node.reduction_de_potentiel,
                points=node.points,
                pourcentage=node.pourcentage,
                categorie=node.categorie,
            )
            action_definition_entities[action_id] = action_definition_entity
            for child_node in node.actions:
                _recursively_add_definition(child_node)
            return action_definition_entities

        return _recursively_add_definition(root_node)

    @staticmethod
    def infer_children_by_id_from_markdown_root_node(
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

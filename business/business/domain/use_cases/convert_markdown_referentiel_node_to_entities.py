import math
from typing import Dict, List, Optional

from business.domain.models import events
from business.domain.models.action_children import ActionChildren
from business.domain.models.action_definition import ActionDefinition
from business.domain.models.markdown_action_node import MarkdownActionNode
from business.domain.models import commands
from business.domain.models.markdown_action_node import 
from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
)


class CheckingMarkdownReferentielNodeFailed(events.DomainFailureEvent):
    pass


class ConvertMarkdownReferentielNodeToEntities:
    def __init__(self, bus: AbstractDomainMessageBus) -> None:
        self.bus = bus

    def execute(self, command: commands.ConvertMarkdownReferentielNodeToEntities):
        referentiel_node = command.referentiel_node
        
        self.check_all_identifiant_are_unique(referentiel_node)
        self.check_actions_children_percentages_sum_to_100(referentiel_node)

        definition_entities = (
            self.infer_action_definition_entities_from_markdown_action_node(
                referentiel_node
            )
        )
        children_entities = (
            self.infer_action_children_entities_from_markdown_action_node(
                referentiel_node
            )
        )

        points_by_action_id = self.infer_points_by_id_from_markdown_action_node(
            definition_entities
        )

        self.check_action_points_values_are_not_nan(points_by_action_id)
        self.check_actions_children_points_sum_to_parent_points(
            points_by_action_id, children_entities
        )

        points_entities = [
            ActionPoints(
                action_id=self.build_action_id(action_identifiant),
                value=points_value or math.nan,
            )
            for action_identifiant, points_value in points_by_action_id.items()
        ]

    def build_action_id(self, identifiant: str) -> ActionId:
        return ActionId(f"{self.referentiel_id}_{identifiant}")

    @staticmethod
    def check_all_identifiant_are_unique(
        markdown_action_referentiel: MarkdownActionNode,
    ):
        all_identifiants = []

        def _append_action_identifiant(action: MarkdownActionNode):
            all_identifiants.append(action.identifiant)
            if action.actions:
                list(map(_append_action_identifiant, action.actions))

        _append_action_identifiant(markdown_action_referentiel)
        if len(all_identifiants) != len(set(all_identifiants)):
            raise CheckingMarkdownReferentielNodeFailed(
                f"Tous les identifiants devraient être uniques. Doublons: "
            )

    def check_actions_children_percentages_sum_to_100(
        self,
        action: MarkdownActionNode,
    ):
        action_children = action.actions
        if not action_children:
            return
        if action_children[0].percentage is not None:
            children_percentages = [action.percentage for action in action_children]
            if None in children_percentages:
                raise CheckingMarkdownReferentielNodeFailed(
                    f"Les valeurs des actions de l'action {action.identifiant} n'ont pas tous un pourcentage de renseigné"
                )
            sum_children_percentages = sum(children_percentages)
            if sum_children_percentages != 100:
                raise CheckingMarkdownReferentielNodeFailed(
                    f"Les valeurs des actions de l'action {action.identifiant} sont renseignées en pourcentage, mais leur somme fait {sum_children_percentages} au lieu de 100."
                )
        return list(
            map(self.check_actions_children_percentages_sum_to_100, action_children)
        )

    def check_actions_children_points_sum_to_parent_points(
        self,
        points_by_action_id: Dict[ActionId, float],
        children_entities: List[ActionChildren],
    ):
        for children_entity in children_entities:
            children_ids = children_entity.children_ids
            if children_ids:
                parent_point = points_by_action_id[children_entity.action_id]
                children_point_sum = sum(
                    [points_by_action_id[child_id] for child_id in children_ids]
                )
                if parent_point != children_point_sum:
                    raise CheckingMarkdownReferentielNodeFailed(
                        f"Les valeurs des actions de l'action {children_entity.action_id} sont renseignées en points, mais leur somme fait {children_point_sum} au lieu de {parent_point}."
                    )

    def check_action_points_values_are_not_nan(
        self, points_by_identifiant: Dict[ActionId, float]
    ):
        for action_id, point_value in points_by_identifiant.items():
            if math.isnan(point_value):
                raise CheckingMarkdownReferentielNodeFailed(
                    f"Les points de l'action {action_id} n'ont pas pu être inférés. "
                )

    def infer_points_by_id_from_markdown_action_node(
        self, definitions: List[ActionDefinition]
    ) -> Dict[ActionId, float]:
        """Infer points of all actions given definitions

        First, consider all points that are specified in the definitions.
        Then, propagate the points backward (from children to parents)
        Finaly, propagate the points forward (from parents to children) using percentage or equi-distribution
        """
        # First, report points that are written in the definitions
        points_by_identifiant = {
            definition.identifiant: definition.points
            for definition in definitions
            if definition.points is not None
        }

        # Then, fill parent points from children
        self._infer_points_from_descendants(points_by_identifiant)

        # Then, replace percentages by points
        self._infer_points_given_in_percentages_from_parent(points_by_identifiant)

        return {
            self.build_action_id(identifiant): points
            for (identifiant, points) in points_by_identifiant.items()
        }

    def _infer_points_from_descendants(
        self,
        points_by_identifiant: Dict[str, float],
    ):
        """Add points infered from descendants

        If an action has no points, but its children have, then set action points to the sum of its children's points
        Note that this method mutates its input argument `points_by_action_id` by adding points of action that can be infered from their children
        """

        markdown_action = referentiel_node

        action_without_points_and_children_with = (
            self._search_next_parent_action_without_points_and_chidren_with(
                markdown_action, points_by_identifiant
            )
        )
        if action_without_points_and_children_with:
            children_points_sum = sum(
                [
                    action_child.points
                    or 0.0  # This should not be None (cf search condition)
                    for action_child in action_without_points_and_children_with.actions
                ]
            )
            points_by_identifiant[
                action_without_points_and_children_with.identifiant
            ] = children_points_sum
            self._infer_points_from_descendants(points_by_identifiant)

    def _infer_points_given_in_percentages_from_parent(
        self,
        points_by_identifiant: Dict[str, float],
    ):
        """Add points infered from percentages

        If action children are given in percentage, then distribute the action points according to the percentage
        Note that this method mutates its input argument `points_by_action_id` by adding points of action that can be infered from their children
        """

        def _infer_for_action(action: MarkdownActionNode):
            action_children = action.actions
            action_points = action.points
            if not action_children or not action_points:
                return
            children_have_points = (
                action_children[0].identifiant in points_by_identifiant
            )
            if children_have_points:
                return

            if action_children[0].points is None:
                for action_child in action_children:
                    percentage = action_child.percentage or action_points / len(
                        action_children
                    )  # if percentage is not specified, then points are equi-distributed within siblings
                    action_child_points = (percentage / 100) * action_points
                    points_by_identifiant[
                        action_child.identifiant
                    ] = action_child_points
            list(map(_infer_for_action, action_children))
            return points_by_identifiant

        _infer_for_action(referentiel_node)

    def _search_next_parent_action_without_points_and_chidren_with(
        self,
        markdown_action: MarkdownActionNode,
        already_known_points_by_identifiant: Dict[str, float],
    ) -> Optional[MarkdownActionNode]:
        if (
            markdown_action.identifiant not in already_known_points_by_identifiant
            and markdown_action.points is None
            and markdown_action.percentage is None
            and markdown_action.actions
            and markdown_action.actions[0].points is not None
        ):
            return markdown_action
        for child in markdown_action.actions:
            next = self._search_next_parent_action_without_points_and_chidren_with(
                child, already_known_points_by_identifiant
            )
            if next:
                return next

    def infer_action_definition_entities_from_markdown_action_node(
        self, markdown_action_node: MarkdownActionNode
    ) -> List[ActionDefinition]:
        """Convert a MarkdownActionNode to a list of ActionDefinition"""
        action_definition_entities: List[ActionDefinition] = []

        def _increment_list(
            markdown_action_node: MarkdownActionNode,
        ) -> List[ActionDefinition]:
            action_definition_entity = ActionDefinition(
                referentiel_id=self.referentiel_id,
                thematique_id=markdown_action_node.thematique_id,
                action_id=self.build_action_id(markdown_action_node.identifiant),
                identifiant=markdown_action_node.identifiant,
                nom=markdown_action_node.nom,
                contexte=markdown_action_node.contexte,
                description=markdown_action_node.description,
                exemples=markdown_action_node.exemples,
                ressources=markdown_action_node.ressources,
                points=markdown_action_node.points,
                percentage=markdown_action_node.percentage,
            )
            action_definition_entities.append(action_definition_entity)
            children_nodes = markdown_action_node.actions
            if children_nodes:
                list(map(_increment_list, children_nodes))
            return action_definition_entities

        return _increment_list(markdown_action_node)

    def infer_action_children_entities_from_markdown_action_node(
        self,
        markdown_action_node: MarkdownActionNode,
    ) -> List[ActionChildren]:
        """Convert a MarkdownActionNode to a list of ActionDefinition"""
        action_children_entities: List[ActionChildren] = []

        def _increment_list(
            markdown_action_node: MarkdownActionNode,
        ) -> List[ActionChildren]:
            action_children_entity = ActionChildren(
                action_id=self.build_action_id(markdown_action_node.identifiant),
                children_ids=[
                    self.build_action_id(child.identifiant)
                    for child in markdown_action_node.actions
                ],
            )
            action_children_entities.append(action_children_entity)
            children_nodes = markdown_action_node.actions
            if children_nodes:
                list(map(_increment_list, children_nodes))
            return action_children_entities

        return _increment_list(markdown_action_node)

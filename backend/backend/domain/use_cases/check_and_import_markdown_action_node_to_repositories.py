import math
from typing import Dict, List, Optional

from backend.domain.models.action_children import ActionChildren
from backend.domain.models.action_definition import ActionDefinition
from backend.domain.models.action_points import ActionPoints
from backend.domain.models.litterals import ActionId
from backend.domain.ports.action_children_repo import AbstractActionChildrenRepository
from backend.domain.ports.action_points_repo import AbstractActionPointsRepository
from backend.domain.ports.action_definition_repo import (
    AbstractActionDefinitionRepository,
)
from backend.utils.markdown_import.markdown_action_node import (
    MarkdownActionNode,
)
from backend.utils.markdown_import.infer_from_markdown_action_node import (
    infer_action_children_entities_from_markdown_action_node,
    infer_action_definition_entities_from_markdown_action_node,
)


class ReferentielQuotationsError(Exception):
    pass


class CheckAndImportMarkdownActionNodeToRepositories:
    def __init__(
        self,
        markdown_action_referentiel: MarkdownActionNode,
        action_definition_repo: AbstractActionDefinitionRepository,
        action_chidren_repo: AbstractActionChildrenRepository,
        action_points_repo: AbstractActionPointsRepository,
    ) -> None:
        self.markdown_action_referentiel = markdown_action_referentiel
        self.action_definition_repo = action_definition_repo
        self.action_chidren_repo = action_chidren_repo
        self.action_points_repo = action_points_repo

    def execute(self):

        self.check_all_identifiant_are_unique(self.markdown_action_referentiel)
        self.check_actions_children_percentages_sum_to_100(
            self.markdown_action_referentiel
        )

        definition_entities = (
            infer_action_definition_entities_from_markdown_action_node(
                self.markdown_action_referentiel
            )
        )
        children_entities = infer_action_children_entities_from_markdown_action_node(
            self.markdown_action_referentiel
        )

        points_by_action_id = self.infer_points_by_action_id_from_markdown_action_node(
            definition_entities
        )

        self.check_action_points_values_are_not_nan(points_by_action_id)
        self.check_actions_children_points_sum_to_parent_points(
            points_by_action_id, children_entities
        )

        points_entities = [
            ActionPoints(action_id=action_id, value=points_value or math.nan)
            for action_id, points_value in points_by_action_id.items()
        ]

        # At this point, the referentiel is coherent, we add it to the repositories !
        # Should be transactionnal
        self.action_definition_repo.add_entities(definition_entities)
        self.action_chidren_repo.add_entities(children_entities)
        self.action_points_repo.add_entities(points_entities)

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
            raise ReferentielQuotationsError(
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
                raise ReferentielQuotationsError(
                    f"Les valeurs des actions de l'action {action.identifiant} n'ont pas tous un pourcentage de renseigné"
                )
            sum_children_percentages = sum(children_percentages)
            if sum_children_percentages != 100:
                raise ReferentielQuotationsError(
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
                    raise ReferentielQuotationsError(
                        f"Les valeurs des actions de l'action {children_entity.action_id} sont renseignées en points, mais leur somme fait {children_point_sum} au lieu de {parent_point}."
                    )

    def check_action_points_values_are_not_nan(
        self, points_by_action_id: Dict[ActionId, float]
    ):
        for action_id, point_value in points_by_action_id.items():
            if math.isnan(point_value):
                raise ReferentielQuotationsError(
                    f"Les points de l'action {action_id} n'ont pas pu être inférés. "
                )

    def infer_points_by_action_id_from_markdown_action_node(
        self, definitions: List[ActionDefinition]
    ) -> Dict[ActionId, float]:
        """Infer points of all actions given definitions

        First, consider all points that are specified in the definitions.
        Then, propagate the points backward (from children to parents)
        Finaly, propagate the points forward (from parents to children) using percentage or equi-distribution
        """
        # First, report points that are written in the definitions
        points_by_id = {
            definition.action_id: definition.points
            for definition in definitions
            if definition.points is not None
        }

        # Then, fill parent points from children
        self._infer_points_from_descendants(points_by_id)

        # Then, replace percentages by points
        self._infer_points_given_in_percentages_from_parent(points_by_id)

        return points_by_id

    def _infer_points_from_descendants(
        self,
        points_by_action_id: Dict[ActionId, float],
    ):
        """Add points infered from descendants

        If an action has no points, but its children have, then set action points to the sum of its children's points
        Note that this method mutates its input argument `points_by_action_id` by adding points of action that can be infered from their children
        """

        markdown_action = self.markdown_action_referentiel

        action_without_points_and_children_with = (
            self._search_next_parent_action_without_points_and_chidren_with(
                markdown_action, points_by_action_id
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
            points_by_action_id[
                action_without_points_and_children_with.action_id
            ] = children_points_sum
            self._infer_points_from_descendants(points_by_action_id)

    def _infer_points_given_in_percentages_from_parent(
        self,
        points_by_action_id: Dict[ActionId, float],
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
            children_have_points = action_children[0].action_id in points_by_action_id
            if children_have_points:
                return

            if action_children[0].points is None:
                for action_child in action_children:
                    percentage = action_child.percentage or action_points / len(
                        action_children
                    )  # if percentage is not specified, then points are equi-distributed within siblings
                    action_child_points = (percentage / 100) * action_points
                    points_by_action_id[action_child.action_id] = action_child_points
            list(map(_infer_for_action, action_children))
            return points_by_action_id

        _infer_for_action(self.markdown_action_referentiel)

    def _search_next_parent_action_without_points_and_chidren_with(
        self,
        markdown_action: MarkdownActionNode,
        already_known_points_by_id: Dict[ActionId, float],
    ) -> Optional[MarkdownActionNode]:
        if (
            markdown_action.action_id not in already_known_points_by_id
            and markdown_action.points is None
            and markdown_action.percentage is None
            and markdown_action.actions
            and markdown_action.actions[0].points is not None
        ):
            return markdown_action
        for child in markdown_action.actions:
            next = self._search_next_parent_action_without_points_and_chidren_with(
                child, already_known_points_by_id
            )
            if next:
                return next

from dataclasses import dataclass
from typing import Dict, List

from attr import s

from business.domain.models.action_status import (
    ActionStatus,
)
from business.domain.models.action_notation import ActionNotation
from business.domain.models.litterals import ReferentielId
from business.domain.ports.action_children_repo import AbstractActionChildrenRepository
from business.domain.ports.action_points_repo import AbstractActionPointsRepository
from business.domain.ports.action_status_repo import AbstractActionStatusRepository
from business.utils.action_points_tree import ActionPointsNode, ActionsPointsTree


class ComputeReferentielNotationError(Exception):
    pass


@dataclass
class ComputeReferentielScoreEvent:
    epci_id: str
    referentiel_id: ReferentielId


class ComputeReferentielNotation:
    def __init__(
        self,
        eci_points_tree,
        # action_points_repo: AbstractActionPointsRepository,
        # action_children_repo: AbstractActionChildrenRepository,
        action_status_repo: AbstractActionStatusRepository,
    ) -> None:
        self.action_status_repo = action_status_repo
        # actions_points = action_points_repo.get_all()
        # action_children = action_children_repo.get_all()
        self.action_points_tree = ActionsPointsTree(actions_points, action_children)

    def execute(self, event: ComputeReferentielScoreEvent):

        action_statuses = self.action_status_repo.get_all(event.epci_id)

        status_by_action_id: Dict[str, ActionStatus] = {
            action_status.action_id: action_status
            for action_status in action_statuses
            if action_status.is_renseigne
        }

        actions_non_concernees_ids: List[str] = [
            action_status.action_id
            for action_status in action_statuses
            if not action_status.concernee
        ]

        notation: Dict[str, ActionNotation] = {}

        self.action_points_tree.map_on_taches(
            lambda tache: self.update_notation_from_tache_given_statuses(
                notation, tache, status_by_action_id, actions_non_concernees_ids
            )
        )

        self.action_points_tree.map_from_sous_actions_to_root(
            lambda action: self.update_notation_for_action_given_children_notation(
                notation, action
            )
        )

        # TODO : add score entities to repo
        return notation

    def update_notation_from_tache_given_statuses(
        self,
        notation: Dict[str, ActionNotation],
        tache_points_node: ActionPointsNode,
        status_by_action_id: Dict[str, ActionStatus],
        actions_non_concernees_ids: List[str],
    ):
        # sibling_taches = sous_action.actions
        # for tache in sibling_taches:
        # TODO : find a softer way to tell that points cannot be None once they have been filled by referentiel constructor.
        assert tache_points_node.value is not None

        tache_potentiel = (
            tache_points_node.value
        )  # TODO : handle concerne/non-concerne here

        tache_status = status_by_action_id.get(tache_points_node.action_id)
        tache_concernee = tache_points_node.action_id not in actions_non_concernees_ids

        if not tache_concernee:
            notation[tache_points_node.action_id] = ActionNotation(
                action_id=tache_points_node.action_id,
                points=0,
                potentiel=0,
                previsionnel=0,
                completude_ratio=(1, 1),
                referentiel_points=tache_points_node.value,
                concernee=tache_concernee,
            )
            return

        if tache_status:
            tache_points = (
                tache_potentiel if tache_concernee and tache_status.is_done else 0.0
            )
            tache_previsionnel = (
                tache_potentiel
                if tache_concernee
                and (tache_status.is_done or tache_status.will_be_done)
                else 0.0
            )
            notation[tache_points_node.action_id] = ActionNotation(
                action_id=tache_points_node.action_id,
                points=tache_points,
                potentiel=tache_potentiel,
                previsionnel=tache_previsionnel,
                completude_ratio=(1, 1),
                referentiel_points=tache_points_node.value,
                concernee=tache_concernee,
            )

    def update_notation_for_action_given_children_notation(
        self, notation: Dict[str, ActionNotation], action: ActionPointsNode
    ):
        action_children = action.children
        action_referentiel_points = action.value
        action_children_with_notation = [
            child for child in action_children if child.action_id in notation
        ]
        points = sum(
            [
                notation[child.action_id].points
                for child in action_children_with_notation
            ]
        )
        potentiel = sum(
            [
                notation[child.action_id].potentiel
                if child.action_id in notation
                else child.value
                for child in action_children
            ]
        )
        previsionnel = sum(
            [
                notation[child.action_id].previsionnel
                for child in action_children_with_notation
            ]
        )
        concernee = (
            any(
                [
                    notation[child.action_id].concernee
                    for child in action_children_with_notation
                ]
            )
            if action_children_with_notation
            else True
        )  # concernee if any action children is concernee
        completude_numerator = sum(
            [
                notation[child.action_id].completude_ratio[0]
                for child in action_children_with_notation
            ]
        )
        completude_denominator = sum(
            [
                notation[child.action_id].completude_ratio[1]
                if child.action_id in notation
                else 1
                for child in action_children
            ]
        )

        notation[action.action_id] = ActionNotation(
            action_id=action.action_id,
            points=points,
            potentiel=potentiel,
            previsionnel=previsionnel,
            completude_ratio=(
                completude_numerator,
                completude_denominator,
            ),
            referentiel_points=action_referentiel_points,
            concernee=concernee,
        )

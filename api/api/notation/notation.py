from __future__ import annotations

from enum import Enum, unique
from typing import Tuple, Dict, List, Literal

from api.models.generated.action_referentiel_score import (
    ActionReferentielScore,
)
from api.notation.referentiel import Referentiel


@unique
class Status(Enum):
    """Represent the status of an action"""

    pas_faite = 0
    faite = 1
    non_concernee = 2
    vide = 3

    @classmethod
    def from_action_status_avancement(
        cls,
        action_status_avancement: Literal[
            "faite", "programmee", "pas_faite", "non_concernee"
        ],  # Should be generated
    ) -> Status:
        """Returns a Status from the avancement of ActionStatus

        Note there is no 'programmée' or 'en_cours', as it does not count toward notation.
        """
        if action_status_avancement == "non_concernee":
            return Status.non_concernee
        elif action_status_avancement == "pas_faite":
            return Status.pas_faite
        elif action_status_avancement == "faite":
            return Status.faite
        return Status.vide

    def to_action_status_selected_value(
        self,
    ) -> Literal["faite", "programmee", "pas_faite", "non_concernee", ""]:
        if self == Status.pas_faite:
            return "pas_faite"
        elif self == Status.faite:
            return "faite"
        elif self == Status.non_concernee:
            return "non_concernee"
        return ""


class UnknownActionIndex(Exception):
    pass


class Notation:
    """Allows to score a 'collectivité' from its actions status

    Use set_status for every collectivité avancement status then retrieve scores.
    """

    def __init__(self, referentiel: Referentiel) -> None:
        self.referentiel = referentiel
        self.potentiels: Dict[Tuple, float] = {}
        self.points: Dict[Tuple, float] = {}
        self.percentages: Dict[Tuple, float] = {}
        self.statuses: Dict[Tuple, Status] = {}
        self.reset()

    def reset(self):
        self.potentiels: Dict[Tuple, float] = self.referentiel.points.copy()
        self.statuses: Dict[Tuple, Status] = {
            index: Status.vide for index in self.referentiel.indices
        }
        self.points: Dict[Tuple, float] = {
            index: 0.0 for index in self.referentiel.indices
        }
        self.percentages: Dict[Tuple, float] = {
            index: 0.0 for index in self.referentiel.indices
        }

    def set_status(self, index: Tuple, status: Status):
        """Set the status of an action"""
        if index not in self.statuses:
            raise UnknownActionIndex(
                f"Cannot set status of an unknown action index {index}"
            )
        self.statuses[index] = status

    def compute(self):
        self.__propagate_statuses()
        self.__compute_potentiels()
        self.__compute_points()
        self.__compute_percentages()

    def compute_and_get_scores(self) -> List[ActionReferentielScore]:
        self.compute()
        return [
            ActionReferentielScore(
                action_id=self.referentiel.actions[index].id,
                action_nomenclature_id=self.referentiel.actions[index].id_nomenclature,
                avancement=self.statuses[index].to_action_status_selected_value(),
                points=self.points[index],
                potentiel=self.potentiels[index],
                percentage=self.percentages[index],
                referentiel_points=self.referentiel.points[index],
                referentiel_percentage=self.referentiel.percentages[index],
            )
            for index in self.referentiel.indices
        ]

    def __propagate_statuses(self):
        """Propagate `statuts` in the tree so there is no more `vide`

        Start with forward propagation, to override children status.
        For example if an orientation is marked as 'fait' its niveaux would be marked 'fait' as well.

        Then ends with backward propagation to set parent statuts from its children.
        For example if all niveaux of an orientation are marked as 'fait', the orientation would be
         marked 'fait' as well.

        The 'vide' statut is not propagated.
        """

        def compute_parent_status(chidren_statuses: List[Status]) -> Status:
            """parent status from its children"""
            if chidren_statuses.count(Status.non_concernee) == len(chidren_statuses):
                return Status.non_concernee
            elif chidren_statuses.count(Status.faite) + chidren_statuses.count(
                Status.non_concernee
            ) == len(chidren_statuses):
                return Status.faite
            return Status.pas_faite

        # forward propagation
        for index in self.referentiel.forward:
            if len(index) == 0:
                continue
            parent_statut = self.statuses[index[:-1]]
            if parent_statut != Status.vide:
                self.statuses[index] = parent_statut

        # backward propagation
        for index in self.referentiel.backward:
            if self.statuses[index] != Status.vide:
                continue
            children = self.referentiel.children(index)
            if children:
                self.statuses[index] = compute_parent_status(
                    [self.statuses[child] for child in children]
                )

    def __compute_potentiels(self):
        """Redistribute `points` of actions with a status `non_concernee`

        That is if every action siblings had a status `non_concernee` except one,
        this remaining action would inherit all points of its siblings.

        However if we are at the mesure_level points are not redistributed, so the root potentiel is less than
        the referentiel root points.
        """
        for index in self.referentiel.backward:
            # take care of children
            children = self.referentiel.children(index)

            non_concernee_children = [
                child
                for child in children
                if self.statuses[child] == Status.non_concernee
            ]
            if len(non_concernee_children) == 0:
                # no exclusions, we don't change potentiels.
                pass
            elif len(non_concernee_children) == len(children):
                # all children are excluded, set their potentiels to 0.
                for child in children:
                    self.potentiels[child] = 0.0
                pass
            elif len(index) >= self.referentiel.mesure_depth:
                # redistribution happens during next pass
                pass
            else:
                # larger than mesure, update potentiels without redistribution.
                for child in non_concernee_children:
                    self.potentiels[child] = 0.0

            # sum potentiels
            if children:
                if len(index) == self.referentiel.mesure_depth and len(
                    non_concernee_children
                ) != len(children):
                    # do not change the potentiels at the mesure level
                    # when not all children are non-concernés
                    pass
                else:
                    self.potentiels[index] = sum(
                        [self.potentiels[child] for child in children]
                    )

        # forward pass, redistribute points down to children from the mesure level.
        for index in self.referentiel.forward:
            children = self.referentiel.children(index)
            non_concernee_children = [
                child
                for child in children
                if self.statuses[child] == Status.non_concernee
            ]
            if len(non_concernee_children) == len(children):
                pass
            elif len(index) >= self.referentiel.mesure_depth:
                # smaller action than mesure, we redistribute potentiels equally amongst remaining children.
                non_concernee_points = sum(
                    [self.referentiel.points[index] for index in non_concernee_children]
                )
                concernes_count = len(children) - len(non_concernee_children)
                diff_from_points = (
                    self.potentiels[index] - self.referentiel.points[index]
                )
                redistribution = (
                    non_concernee_points + diff_from_points
                ) / concernes_count

                for child in children:
                    if child in non_concernee_children:
                        self.potentiels[child] = 0.0
                    else:
                        self.potentiels[child] = (
                            self.referentiel.points[child] + redistribution
                        )
            else:
                # larger than mesure, update potentiels without redistribution.
                for child in non_concernee_children:
                    self.potentiels[child] = 0.0

    def __compute_points(self):
        """Compute points from potentiels the propagate the sums"""
        # first pass
        for index in self.referentiel.indices:
            progress = 1.0 if self.statuses[index] == Status.faite else 0.0
            self.points[index] = progress * self.potentiels[index]

        # second pass
        for index in self.referentiel.backward:
            children = self.referentiel.children(index)
            if children:
                self.points[index] = sum([self.points[child] for child in children])

    def __compute_percentages(self):
        """Compute percentage for display purposes see ActionReferentielScore"""
        for index in self.referentiel.indices:
            if self.potentiels[index] != 0:
                self.percentages[index] = self.points[index] / self.potentiels[index]
            if self.points[index] == 0 and self.statuses[index] == Status.faite:
                self.percentages[index] = 1.0

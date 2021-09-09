from __future__ import annotations

from typing import Tuple, Dict, List

from api.models.generated.action_referentiel import ActionReferentiel


class ReferentielValueError(Exception):
    pass


defaut_referentiel_root_points_value = 500.0  # TODO: this should not be hard-coded


class Referentiel:
    """Referentiel.

    Takes the root action of a referentiel and compute tables and indices.
    - points are used by Notation to compute scores.
    - percentages are used to display/test computation
    - actions allows for index to

    ## Indices
    indices, forward and backward are indices list for iterating either
    in no particular order, forward (from root to tâches) or backward (tâches to root) respectively.

    :argument mesure_depth the depth of mesure defined in the mardown used for potentiel redistribution.
        ex action 1.1 is a mesure in eci, so mesure_level is 2.
            - This means that actions 1.1.1, 1.1.2, 1.1.1.1, (...) points are expressed in percentages.
            - This also means that for actions bellow this depth, the notation should redistribute `potentiel` when some are `non concernee`
        The sum of all the measure points should be 500.
    """

    def __init__(self, root_action: ActionReferentiel, mesure_depth: int):
        self.__sanity_check(root_action)
        self.root_action: ActionReferentiel = root_action
        self.mesure_depth: int = mesure_depth
        self.points: Dict[Tuple, float] = {}
        self.percentages: Dict[Tuple, float] = {}
        self.actions: Dict[Tuple, ActionReferentiel] = {}
        self.indices: List[Tuple]
        self.forward: List[Tuple]
        self.backward: List[Tuple]
        self.__build_indices_and_actions()
        self.__fix_actions_points()
        self.__build_points()
        self.__build_percentages()

    def children(self, parent: tuple) -> List[tuple]:
        """Returns the children indices"""
        return [index for index in self.indices if index[:-1] == parent and len(index)]

    def siblings(self, index: tuple) -> List[tuple]:
        """Returns the index siblings including index"""
        parent = index[:-1]
        return self.children(parent)

    def __build_indices_and_actions(self):
        """Build all indices lists"""
        self.indices: List[Tuple] = []

        def add_action(action: ActionReferentiel):
            index = tuple(
                [element for element in action.id_nomenclature.split(".") if element]
            )
            self.indices.append(index)
            self.actions[index] = action

            for action in action.actions:
                add_action(action)

        add_action(self.root_action)

        self.forward: List[Tuple] = sorted(self.indices, key=lambda i: len(i))
        self.backward: List[Tuple] = self.forward[::-1]

    def __fix_actions_points(self):
        """Convert percentage to points for actions after mesure level
        Note : this step will not be required once it's possible to specify either points or percentage for an action
        ----
        """
        for index in self.forward:
            if len(index) > self.mesure_depth:
                points = self.actions[index].points
                if points != -1:
                    parent_points = self.actions[index[:-1]].points
                    # print(
                    #     f"{index} = {self.actions[index].points} * {parent_points} / 100"
                    # )
                    self.actions[index].points = (
                        self.actions[index].points * parent_points / 100
                    )

    def __build_points(self):
        """Build points
        A référentiel is worth 500 points thus if every actions had a been done
        perfectly a collectivité would obtain 500 points.

        If mesure_level is 3, then actions points of 1, 1.1 and 1.1.1 are expressed in points. Hence, should some to 500.
        """

        # propagation
        for index in self.backward:
            self.points[index] = self.actions[index].points
            if len(index) < self.mesure_depth:
                self.points[index] = sum(
                    [self.points[child] for child in self.children(index)]
                )

        for index in self.forward:
            if len(index) >= self.mesure_depth:

                children = self.children(index)
                unspecified_children = [
                    child for child in children if self.actions[child].points == -1
                ]

                if unspecified_children:
                    # Points are expressed in percentage
                    distributed_points = sum(
                        [max(0, self.actions[child].points) for child in children]
                    )
                    remaining_points = self.points[index] - distributed_points
                    points_to_distribute_amongst_unspecified_children = (
                        remaining_points / len(unspecified_children)
                    )
                    for child in unspecified_children:
                        self.points[
                            child
                        ] = points_to_distribute_amongst_unspecified_children

    def __build_percentages(self):
        """Build percentages

        Percentages are relative to parents. If an action had 4 children, each would be .25 that is 25%"""
        for index in self.points:
            if len(index) > 0:
                p = self.points[index]
                if p == 0:
                    self.percentages[index] = 0
                else:
                    self.percentages[index] = (
                        self.points[index] / self.points[index[:-1]]
                    )
        self.percentages[tuple()] = 1

    @staticmethod
    def __sanity_check(root_action: ActionReferentiel):
        if root_action.id_nomenclature != "":
            raise ReferentielValueError(
                f"Root action should have '' as `id_nomenclature`, received {root_action.id_nomenclature} instead. "
            )
        # Todo : check it's all 500

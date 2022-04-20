from typing import List
from business.personnalisation.find_regles_errors import (
    find_regles_errors,
    Question as EngineQuestion,
)
from business.referentiel.domain.models import events
from business.referentiel.domain.models import personnalisation
from business.referentiel.domain.models.personnalisation import Regle
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.utils.domain_message_bus import AbstractDomainMessageBus
from business.utils.use_case import UseCase


class CheckPersonnalisation(UseCase):
    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        referentiel_repo: AbstractReferentielRepository,
    ) -> None:
        self.bus = bus
        self.referentiel_repo = referentiel_repo

    def execute(
        self, trigger: events.QuestionAndPersonnalisationMarkdownConvertedToEntities
    ):

        engine_questions = [
            EngineQuestion(
                question.id,
                question.type,
                [choix.id for choix in question.choix] if question.choix else None,
            )
            for question in trigger.questions
        ]
        personnalisation_action_ids = [
            personnalisation.action_id for personnalisation in trigger.regles
        ]
        duplicated_personnalisation_action_ids = find_duplicates(
            personnalisation_action_ids
        )
        if duplicated_personnalisation_action_ids:
            self.bus.publish_event(
                events.QuestionAndReglesCheckingFailed(
                    f"Duplicats dans les règles pour les actions {', '.join(duplicated_personnalisation_action_ids)} ."
                )
            )
            return

        action_ids_with_duplicated_regles_types = [
            regle.action_id
            for regle in trigger.regles
            if find_duplicates([regle.type for regle in regle.regles])
        ]
        if action_ids_with_duplicated_regles_types:
            self.bus.publish_event(
                events.QuestionAndReglesCheckingFailed(
                    f"Duplicats dans les types (désactivation, réduction, score) pour les règles des actions suivantes {', '.join(action_ids_with_duplicated_regles_types)}. Il ne faut qu'une seule formule par type et par action. "
                )
            )
            return

        regles: List[Regle] = sum(
            [personnalisation.regles for personnalisation in trigger.regles],
            [],
        )
        all_action_ids = self.referentiel_repo.get_all_action_ids()
        regles_errors = find_regles_errors(
            regles=regles, questions=engine_questions, action_ids=all_action_ids
        )
        if regles_errors:
            self.bus.publish_event(
                events.QuestionAndReglesCheckingFailed(
                    f"Incompatiblité dans les formulations des questions et des régles : {', '.join(regles_errors)}"
                )
            )
        else:
            self.bus.publish_event(
                events.QuestionAndReglesChecked(trigger.questions, trigger.regles)
            )


def find_duplicates(l: List) -> List:
    return [x for n, x in enumerate(l) if x in l[:n]]

from business.personnalisation.find_regles_errors import (
    find_regles_errors,
    Question as EngineQuestion,
)
from business.referentiel.domain.models import events
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
        regles = sum(
            [personnalisation.regles for personnalisation in trigger.regles],
            [],
        )
        regles_errors = find_regles_errors(regles=regles, questions=engine_questions)
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

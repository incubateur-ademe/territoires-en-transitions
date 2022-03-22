from business.personnalisation.check_regles import find_regles_errors
from business.referentiel.domain.models import events
from business.personnalisation.engine.models import Question
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

    def execute(self, trigger: events.PersonnalisationMarkdownConvertedToEntities):
        referentiel_questions = self.referentiel_repo.get_questions()
        regles = sum(
            [personnalisation.regles for personnalisation in trigger.personnalisations],
            [],
        )
        regles_errors = find_regles_errors(
            regles=regles,
            questions=[
                Question(ref_question.id, ref_question.type, [])
                for ref_question in referentiel_questions
            ],
        )
        breakpoint()
        if regles_errors:
            self.bus.publish_event(
                events.PersonnalisationReglesCheckingFailed(
                    f"Erreurs dans la formulation de certaines règles : {', '.join(regles_errors)}"
                )
            )
        else:
            self.bus.publish_event(
                events.PersonnalisationReglesChecked(trigger.personnalisations)
            )

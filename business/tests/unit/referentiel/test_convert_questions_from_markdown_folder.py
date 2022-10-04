import pytest

from business.utils.models.actions import ActionId
from business.utils.models.questions import Choix, Question
from business.utils.exceptions import MarkdownError
from business.referentiel.parse_questions import convert_questions_markdown_folder


def test_convert_markdown_referentiel_questions_from_ok_folder():
    questions = convert_questions_markdown_folder(
        "./tests/data/md_questions_example_ok"
    )
    assert len(questions) == 5

    assert questions == [
        Question(
            id="dechets_1",
            thematique_id="dechets",
            formulation="Question 1 binaire",
            description="<p>Quelques détails sur cette question pour aider les collectivités à répondre.</p>\n",
            action_ids=[],
            type="binaire",
            choix=None,
            ordonnnancement=1,
            types_collectivites_concernees=["EPCI"],
        ),
        Question(
            id="dechets_2",
            thematique_id="dechets",
            formulation="Question 2 proportion",
            description="<p>Quelques détails sur cette question pour aider les collectivités à répondre.</p>\n",
            action_ids=[],
            type="proportion",
            choix=None,
            ordonnnancement=2,
            types_collectivites_concernees=["commune", "EPCI"],
        ),
        Question(
            id="dechets_3",
            thematique_id="dechets",
            formulation="Question 3 avec actions liées",
            description="<p>Quelques détails sur cette question pour aider les collectivités à répondre.</p>\n",
            action_ids=[ActionId("eci_1"), ActionId("eci_2")],
            type="proportion",
            choix=None,
            ordonnnancement=3,
            types_collectivites_concernees=None,
        ),
        Question(
            id="dechets_4",
            thematique_id="dechets",
            formulation="Question 4 choix",
            description="<p>Quelques détails sur cette question pour aider les collectivités à répondre.</p>\n",
            action_ids=[],
            type="choix",
            choix=[
                Choix(
                    id="dechets_4_a", formulation="Le premier choix", ordonnancement=1
                ),
                Choix(
                    id="dechets_4_b", formulation="Le second choix", ordonnancement=2
                ),
            ],
            ordonnnancement=None,
            types_collectivites_concernees=None,
        ),
        Question(
            id="mobilite_1",
            thematique_id="mobilite",
            formulation="Question 5 binaire",
            description="<p>Quelques détails sur cette question pour aider les collectivités à répondre.</p>\n",
            action_ids=[],
            type="binaire",
            choix=None,
            ordonnnancement=None,
            types_collectivites_concernees=None,
        ),
    ]


def test_parse_and_convert_markdown_referentiel_questions_when_wrong_type():
    with pytest.raises(
        MarkdownError,
    ) as exc:
        convert_questions_markdown_folder(
            "./tests/data/md_questions_examples_nok/wrong_type"
        )
    assert (
        "Erreurs dans le format des fichiers questions :\n- Dans le fichier question_example.md {'type': ['Must be one of: binaire, proportion, choix.']}"
        in str(exc.value)
    )


def test_parse_and_convert_markdown_referentiel_questions_when_choix_missing():
    with pytest.raises(
        MarkdownError,
    ) as exc:
        convert_questions_markdown_folder(
            "./tests/data/md_questions_examples_nok/missing_choix"
        )

    assert (
        "Les questions suivantes sont de types 'choix' mais ne spécifient aucun choix: question_missing_choix"
        in str(exc.value)
    )

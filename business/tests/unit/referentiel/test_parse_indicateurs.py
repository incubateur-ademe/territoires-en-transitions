from business.referentiel.convert_indicateurs import (
    MarkdownIndicateur,
    parse_markdown_indicateurs_from_folder,
)
from business.utils.models.actions import ActionId


def test_parse_markdown_indicateurs_from_ok_folder():
    markdown_indicateurs, errors = parse_markdown_indicateurs_from_folder(
        "./tests/data/md_indicateurs_example_ok"
    )
    assert len(errors) == 0
    assert markdown_indicateurs == [
        MarkdownIndicateur(
            id="cae_1.a",
            identifiant="1.a",
            valeur=None,
            nom="Nom de l'indicateur 1.a",
            unite="CO2",
            description="<p>Description de l'indicateur 1.a</p>\n",
            obligation_cae=True,
            actions=["cae_1.1.1"],
            programmes=["cae", "pcaet"],
            climat_pratic_ids=["strategie"],
            source=None,
            obligation_eci=None,
        ),
        MarkdownIndicateur(
            id="cae_1.b",
            identifiant="1.b",
            valeur=None,
            nom="Nom de l'indicateur 1.b",
            unite="CO2/hab",
            description="<p>Description de l'indicateur 1.b</p>\n",
            obligation_cae=None,
            actions=["cae_1.1.3"],
            programmes=["cae"],
            climat_pratic_ids=["strategie"],
            source=None,
            obligation_eci=None,
        ),
    ]

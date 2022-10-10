from business.referentiel.parse_preuves import (
    parse_preuves_from_markdown,
)


def test_parse_and_convert_markdown_preuves_to_entities_from_ok_folder():
    preuves, errors = parse_preuves_from_markdown(
        "./tests/data/md_preuves_example_ok/preuve_example.md"
    )
    assert errors == []
    assert preuves == [
        {
            "nom": "Nom de la preuve 1.a",
            "id": "cae_preuve_1.a",
            "actions": ["cae_1.1.1"],
            "description": "<p>Description de la preuve 1.a</p>\n",
        },
        {
            "nom": "Nom de la preuve 1.b",
            "id": "cae_preuve_1.b",
            "actions": ["cae_1.1.2"],
            "description": "<p>Description de la preuve 1.b</p>\n",
        },
        {
            "nom": "Nom de la preuve 1.c",
            "id": "cae_preuve_1.c",
            "actions": ["cae_1.1.2"],
            "description": "",
        },
    ]

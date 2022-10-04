from typing import Optional

from business.referentiel.parse_regles import (
    convert_regles_from_markdown_folder,
    ActionRegles,
    Regle,
)
from business.utils.models.actions import ActionId


def test_convert_regles_from_ok_folder():
    actions_regles = convert_regles_from_markdown_folder(
        "./tests/data/md_personnalisation_example_ok",
    )

    assert actions_regles == [
        ActionRegles(
            action_id=ActionId("cae_4.1.1"),
            titre="Petit titre sur la personnalisation de la cae 4.1.1",
            regles=[
                Regle(
                    formule="si reponse(mobilite_1, OUI) alors max(reponse(dechets_2), 0.5) \n",
                    type="reduction",
                    description="<p>Pour une collectivité AOM, la réduction est proportionnelle</p>\n<p>à la participation dans la collectivité AOM dans la limite de 5 points (50%)</p>\n",
                ),
                Regle(
                    formule="reponse(dechets_1, NON) \n",
                    type="desactivation",
                    description="",
                ),
            ],
            description="",
        )
    ]

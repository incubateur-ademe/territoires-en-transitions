from tortoise.contrib.pydantic import pydantic_model_creator


def get_pydantic_in_model_creator(IndicateurPersonnaliseValue):
    return pydantic_model_creator(
        IndicateurPersonnaliseValue,
        exclude_readonly=True,
        exclude=("latest", "deleted"),
    )

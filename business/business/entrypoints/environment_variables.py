from dataclasses import dataclass
import os
from typing import List, Literal, Optional, TypeVar

from dotenv import load_dotenv

load_dotenv()


class UnexpectedEnvironmentVariableException(Exception):
    pass


GenericVariable = TypeVar("GenericVariable", bound=str)


def get_env_variable(
    variable_name: str,
    variable_options: List[GenericVariable],
    default: Optional[str] = None,
) -> GenericVariable:
    variable: Optional[GenericVariable] = os.environ.get(variable_name) or default
    if not variable in variable_options:
        raise UnexpectedEnvironmentVariableException(
            f"\n \n Got {variable} for {variable_name}, expected one of {variable_options}"
        )
    return variable


ReferetielRepository = Literal["IN_MEMORY", "SUPABASE"]
referentiel_repository_options: List[ReferetielRepository] = ["IN_MEMORY", "SUPABASE"]

LabelisationRepositories = Literal["IN_MEMORY", "SUPABASE"]
labelisation_repositories_options: List[LabelisationRepositories] = [
    "IN_MEMORY",
    "SUPABASE",
]

DataLayer = Literal["IN_MEMORY", "SUPABASE"]
data_layer_options: List[DataLayer] = ["IN_MEMORY", "SUPABASE"]


@dataclass
class EnvironmentVariables:
    referentiel_repository: ReferetielRepository
    labelisation_repositories: LabelisationRepositories
    data_layer: DataLayer

    def __str__(self):
        return f"\
            referentiel_repository: {self.referentiel_repository} \n\
            labelisation_repositories: {self.labelisation_repositories} \n\
            data_layer: {self.data_layer} \n\
            "


REFERENRIELS_REPOSITORY = "IN_MEMORY"  # options: "IN_MEMORY", "SUPABASE", ("CSV" ? )
LABELISATION_REPOSITORIES = "IN_MEMORY"  # options: "IN_MEMORY", "SUPABASE", ("CSV" ? )
DATA_LAYER_BUS = "FAKE"  # options: "SUPABASE", "FAKE"


def get_env_variables() -> EnvironmentVariables:

    return EnvironmentVariables(
        referentiel_repository=get_env_variable(
            "REFERENRIELS_REPOSITORY", referentiel_repository_options
        ),
        labelisation_repositories=get_env_variable(
            "LABELISATION_REPOSITORIES", labelisation_repositories_options
        ),
        data_layer=get_env_variable("DATA_LAYER_BUS", data_layer_options),
    )

from dataclasses import dataclass
import os
from typing import List, Literal, Optional, TypeVar
import logging

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger()


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
        logger.warning(
            f"\n \n Got {variable} for {variable_name}, expected one of {variable_options}"
        )
    return variable


ReferentielsRepository = Literal["JSON", "SUPABASE", "SQL"]
referentiels_repository_options: List[ReferentielsRepository] = [
    "JSON",
    "SUPABASE",
    "SQL",
]

LabelisationRepositories = Literal["IN_MEMORY", "SUPABASE"]
labelisation_repositories_options: List[LabelisationRepositories] = [
    "IN_MEMORY",
    "SUPABASE",
]

Realtime = Literal["REPLAY", "SUPABASE"]
realtime_options: List[Realtime] = ["REPLAY", "SUPABASE"]


@dataclass
class EnvironmentVariables:
    referentiels_repository: Optional[ReferentielsRepository] = None
    labelisation_repositories: Optional[LabelisationRepositories] = None
    realtime: Optional[Realtime] = None
    referentiels_repo_file: Optional[str] = None

    def __str__(self):
        return f"\
            referentiels_repository: {self.referentiels_repository} \n\
            labelisation_repositories: {self.labelisation_repositories} \n\
            realtime: {self.realtime} \n\
            "


def get_env_variables() -> EnvironmentVariables:

    return EnvironmentVariables(
        referentiels_repository=get_env_variable(
            "REFERENTIELS_REPOSITORY", referentiels_repository_options
        ),
        labelisation_repositories=get_env_variable(
            "LABELISATION_REPOSITORIES", labelisation_repositories_options
        ),
        realtime=get_env_variable("REALTIME", realtime_options),
        referentiels_repo_file=os.getenv("REFERENTIELS_REPO_JSON"),
    )

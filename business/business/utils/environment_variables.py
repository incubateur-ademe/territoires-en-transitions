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

Repositories = Literal["IN_MEMORY", "SUPABASE"]
repositories_options: List[Repositories] = [
    "IN_MEMORY",
    "SUPABASE",
]

Realtime = Literal["REPLAY", "SUPABASE"]
realtime_options: List[Realtime] = ["REPLAY", "SUPABASE"]


@dataclass
class EnvironmentVariables:
    referentiels_repository: Optional[ReferentielsRepository] = None
    repositories: Optional[Repositories] = None
    realtime: Optional[Realtime] = None
    referentiels_repo_file: Optional[str] = None

    def __str__(self):
        return f"\
            referentiels_repository: {self.referentiels_repository} \n\
            repositories_options: {self.repositories} \n\
            realtime: {self.realtime} \n\
            "


def get_env_variables() -> EnvironmentVariables:

    return EnvironmentVariables(
        referentiels_repository=get_env_variable(
            "REFERENTIELS_REPOSITORY", referentiels_repository_options
        ),
        repositories=get_env_variable("REPOSITORIES", repositories_options),
        realtime=get_env_variable("REALTIME", realtime_options),
        referentiels_repo_file=os.getenv("REFERENTIELS_REPO_JSON"),
    )

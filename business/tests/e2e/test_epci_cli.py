from business.epci.cli_import_epci import cli_import_epci
from tests.integration.postgres.fixtures import test_postgres_url

expected_nb_of_epcis = 12

# Should work if DB is already initialized.
# TODO : decide what to do with test docker-compose !
def skip_test_update_referentiels():
    try:
        cli_import_epci(
            [
                "--repo-option",
                "POSTGRES",
                "--postgres-url",
                test_postgres_url,
            ]
        )
    except SystemExit:
        pass

from business.epci.cli_import_epci import cli_import_epci

expected_nb_of_epcis = 12

# Should work if DB is already initialized.
# TODO : decide what to do with test docker-compose !
def skip_test_update_referentiels():
    try:
        cli_import_epci(
            [
                "--repo-option",
                "POSTGRES",
                "--output-path",
                "./tests/data/tmp/epcis.sql",
            ]
        )
    except SystemExit:
        pass

    # TODO : Should we check that the SQL file can be executed ? To do so, we need to expose a DB without EPCIs already inserted...

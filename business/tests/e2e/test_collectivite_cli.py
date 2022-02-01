from business.collectivite.cli_import_collectivite import cli_import_collectivite


# Should work if DB is already initialized.
# TODO : decide what to do with test docker-compose !
def skip_test_update_referentiels():
    try:
        cli_import_collectivite(
            [
                "--repo-option",
                "POSTGRES",
                "--output-epci-path",
                "./tests/data/tmp/epcis.sql",
                "--output-commune-path",
                "./tests/data/tmp/communes.sql",
            ]
        )
    except SystemExit:
        pass

    # TODO : Should we check that the SQL file can be executed ? To do so, we need to expose a DB without EPCIs already inserted...

/**
 * Run pytest in codegen.
 */
job("codegen pytest") {
    startOn {
        gitPush {
            pathFilter {
                +"codegen/**"
            }
        }
    }

    container("python:3.9.1") {
        workDir = "$mountDir/work/territoiresentransitions.fr/codegen/"
        shellScript {
            content = """
                bin/install
                poetry run pytest
            """
        }
    }
}

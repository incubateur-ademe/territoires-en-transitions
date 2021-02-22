/**
 * Shared commands
 */
val install_poetry = """
    pip install --upgrade pip
    pip --no-cache-dir install poetry
    poetry install
"""

val pytest = """
    $install_poetry
    poetry run pytest
"""

val npmTest = """
    npm i
    npm run test
"""

/**
 * Run tests in parallel on all branches except `main`:
 *   1- Run pytest if there are some modified files in codegen.
 *   2- Run JS tests if there are some modified files in /client.
 */
job("codegen pytest") {
    startOn {
        gitPush {
            pathFilter {
                +"codegen/**"
            }

            branchFilter {
                // Run tests an all branches except `main`
                +"refs/heads/*"
                -"refs/heads/main"
            }
        }
    }

    container("python:3.9.1") {
        workDir = "$mountDir/work/territoiresentransitions.fr/codegen/"
        shellScript {
            content = "$pytest"
        }
    }
}

job("client tests") {
    startOn {
        gitPush {
            pathFilter {
                +"client/**"
            }

            branchFilter {
                // Run tests an all branches except `main`
                +"refs/heads/*"
                -"refs/heads/main"
            }
        }
    }

    container("node:15.6") {
        workDir = "$mountDir/work/territoiresentransitions.fr/client/"
        shellScript {
            content = "$npmTest"
        }
    }
}

/**
 * Build, test and deploy staging.territoiresentransitions.fr
 *
 * This job runs only on the branch `main` with the following steps:
 *   1- Install codegen dependencies
 *   2- Run tests in codegen
 *   3- Generate html files in shared directory
 *   4- Install client dependencies
 *   5- Run client tests
 *   6- Download generated files from shared directory to client/dist
 *   7- Build client
 *   8- Deploy client on Scaleway bucket named staging.territoiresentransitions.fr
 */
job("Staging pipeline: build/test/deploy") {
    startOn {
        gitPush {
            // run on changes in `main` branch
            branchFilter {
                +"refs/heads/main"
            }
        }
    }

    // 1- Install codegen dependencies
    // 2- Run tests
    // 3- Generate html files in shared client directory
    container("python:3.9.1") {
        workDir = "$mountDir/work/territoiresentransitions.fr/codegen/"
        shellScript {
            content = """
                set -e
                $pytest
                poetry run generate indicateurs -o $mountDir/share/client
                poetry run generate mesures -o $mountDir/share/client
            """
        }
    }

    // 4- Install client dependencies
    // 5- Run client tests
    // 6- Build client in shared client directory
    container("node:15.6") {
        workDir = "$mountDir/work/territoiresentransitions.fr/client/"
        shellScript {
            content = """
                set -e
                npm i
                $npmTest
                npm run build:prod
                cp dist/* $mountDir/share/client
            """
        }
    }

    // 8- Deploy client on Scaleway bucket named staging.territoiresentransitions.fr
    container("python:3.9.1") {
        workDir = "$mountDir/work/territoiresentransitions.fr/tools/"
        env["AWS_ACCESS_KEY_ID"] = Secrets("aws_access_key_id")
        env["AWS_SECRET_ACCESS_KEY"] = Secrets("aws_secret_access_key")
        env["AWS_CONFIG_FILE"] = "$mountDir/work/territoiresentransitions.fr/awscli_config"

        shellScript {
            content = """
                set -e
                $pytest
                poetry run deploy --subdomain staging --client $mountDir/share/client
            """
        }
    }
}

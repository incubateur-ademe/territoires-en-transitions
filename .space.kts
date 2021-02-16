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
                "refs/heads/main"
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
                // TODO: change to `main` branch
                +"refs/heads/main"
            }
        }
    }

    // 1- Install codegen dependencies
    // 2- Run tests
    // 3- Generate html files in client directory
    container("python:3.9.1") {
        workDir = "$mountDir/work/territoiresentransitions.fr/codegen/"
        shellScript {
            content = """
                $pytest
                poetry run generate indicateurs -o $mountDir/share/generated
            """
        }
    }

    // 4- Install client dependencies
    // 5- Run client tests
    // 6- Download generated files from shared directory to client/dist
    // 7- Build client
    container("node:15.6") {
        workDir = "$mountDir/work/territoiresentransitions.fr/client/"
        shellScript {
            content = """
                npm i
                $npmTest
                npm run build:prod
                cp dist/* $mountDir/share/generated
            """
        }
    }

    // 8- Deploy client on Scaleway bucket named staging.territoiresentransitions.fr
    container("python:3.9.1") {
        workDir = "$mountDir/work/territoiresentransitions.fr/client"
        env["AWS_ACCESS_KEY_ID"] = Secrets("aws_access_key_id")
        env["AWS_SECRET_ACCESS_KEY"] = Secrets("aws_secret_access_key")
        env["AWS_CONFIG_FILE"] = "$mountDir/work/territoiresentransitions.fr/awscli_config"

        shellScript {
            content = """
                cp -R $mountDir/share/generated/* dist
                pip3 install awscli
                pip3 install awscli-plugin-endpoint

                aws configure list
                aws s3api put-object --bucket staging.territoiresentransitions.fr --key indicateurs.html --body dist/indicateurs.html --content-type text/html --acl public-read
                aws s3api put-object --bucket staging.territoiresentransitions.fr --key styles.css --body dist/styles.css --content-type text/css --acl public-read
                aws s3api put-object --bucket staging.territoiresentransitions.fr --key main.js --body dist/main.js --content-type application/javascript --acl public-read
            """
        }
    }
}

/**
 * Run pytest in codegen.
 */
job("codegen pytest") {
    container("python:3.9.1") {
        workDir = "/mnt/space/work/territoiresentransitions.fr/codegen/"
        shellScript {
            content = """
            	pip install --upgrade pip
				pip --no-cache-dir install poetry
                poetry install
                poetry run pytest
            """
        }
    }
}



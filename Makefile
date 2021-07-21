deploy_all_on_sandbox: test generate build_sandbox deploy_on_sandbox

test:
	cd codegen && poetry run pytest

generate:
	cd codegen && poetry run generate all

build_sandbox:
	cd app.territoiresentransitions.fr && npm run build_sandbox

deploy_on_sandbox:
	cd tools && poetry run deploy

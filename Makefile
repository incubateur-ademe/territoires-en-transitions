all: test generate build
deploy_all_on_sandbox: test generate build deploy_on_sandbox
deploy_all_on_app: test generate build deploy_on_app

test:
	cd codegen && poetry run pytest

generate:
	cd codegen && poetry run generate all

build:
	cd app.territoiresentransitions.fr && npm run export

deploy_on_sandbox:
	aws s3 cp app.territoiresentransitions.fr/__sapper__/export s3://sandbox.territoiresentransitions.fr --recursive --acl public-read

deploy_on_app:
	aws s3 cp app.territoiresentransitions.fr/__sapper__/export s3://app.territoiresentransitions.fr --recursive --acl public-read

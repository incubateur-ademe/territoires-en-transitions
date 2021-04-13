all: test generate build
deploy_all_on_sandbox: test generate build deploy_on_sandbox

test:
	cd codegen && poetry run pytest
	cd client && npm test

generate:
	cd codegen && poetry run generate all

build:
	cd client && npm run build:prod
	cd client_new && npm run export

deploy_on_sandbox:
	cd tools && poetry run deploy
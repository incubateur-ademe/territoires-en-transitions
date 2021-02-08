all: generate build

generate:
	cd codegen && poetry run generate indicateurs

build:
	cp codegen/generated/indicateurs_citergie/all.html client/dist/indicateurs.html
	cd client && npm run build

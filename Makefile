.PHONY: ci-pr
ci-pr: resolve

.PHONY: ci-master
ci-master: resolve build

setup:
	apt update && apt upgrade
	apt install libgtk-3-dev
	apt install libnss3-dev
	apt install libasound2

resolve:
	npm install
	npm install -g typescript gulp
	npm run postinstall

validate:
	npm test

build:
	npm install -g vsce
	vsce package

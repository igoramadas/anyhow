# MAKE HELPERS

build:
	npm run build

test:
	npm run build
	npm test

docs:
	npm run build
	npm run docs
	cp CNAME docs/
	cp .nojekyll docs/

clean:
	rm -rf ./coverage
	rm -rf ./node_modules
	rm -f package-lock.json

publish:
	npm publish

update:
	-ncu -u -x axios,chalk
	npm install
	npm run build

.PHONY: docs test

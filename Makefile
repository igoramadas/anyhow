COVERALLS :=./node_modules/coveralls/bin/coveralls.js
MOCHA:= ./node_modules/.bin/mocha
MOCHAEXEC:= ./node_modules/.bin/_mocha
ISTANBUL:= ./node_modules/.bin/nyc
TYPEDOC:= ./node_modules/.bin/typedoc
TSC:= ./node_modules/.bin/tsc

build:
	$(TSC)

test:
	npm run build
	npm test

test-cover:
	$(TSC)
	@NODE_ENV=test $(ISTANBUL) $(MOCHAEXEC) --exit --report lcovonly -R spec && \
	cat ./coverage/lcov.info | $(COVERALLS) || true

docs:
	$(TYPEDOC)
	cp CNAME docs/
	cp .nojekyll docs/

clean:
	rm -rf ./node_modules
	rm -f package-lock.json

publish:
	npm publish

update:
	-ncu -u -x axios,chalk
	-npm install
	$(TSC)

.PHONY: docs test

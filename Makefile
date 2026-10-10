# MAKE ANYHOW

all: clean update build

build:
	npm run build

clean:
	npm run clean

publish:
	npm publish

test:
	npm test

# Update dependencies and rebuild. Chalk is the only exception: it stays
# pinned at 4.1.2 (chalk 5+ is ESM-only and breaks require() on Node < 22.12),
# so it's excluded from the ncu updates below.
update:
	-ncu -u -x chalk
	-rm -rf ./node_modules
	-rm -f package-lock.json
	npm install
	npm run build

.PHONY: test

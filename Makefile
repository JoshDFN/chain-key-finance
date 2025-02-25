.PHONY: all clean build test deploy-local deploy-testnet deploy-mainnet

all: clean build

clean:
	rm -rf .dfx/local
	rm -rf dist

build:
	npm ci
	npm run build

test:
	npm test

deploy-local: build
	dfx deploy --network=local

deploy-testnet: build
	dfx deploy --network=testnet

deploy-mainnet: build
	./deploy-mainnet.sh

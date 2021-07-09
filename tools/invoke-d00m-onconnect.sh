#!/usr/bin/env sh

sam local invoke \
    --template ./.aws-sam/build/template.yaml \
    --event ./events/d00m-onconnect.json \
    --env-vars ./tools/env.json \
    OnConnectFunction

#!/bin/bash
[ -d ~/.pyenv ] && rm -fr ~/.pyenv
curl https://pyenv.run | bash
eval "$(pyenv init --path)"
eval "$(pyenv init -)"
pyenv install 3.11.10
pyenv virtualenv 3.11.10 SOModelo
~/.pyenv/versions/SOModelo/bin/pip install -U tensorflowjs
~/.pyenv/versions/SOModelo/bin/tensorflowjs_converter \
 --input_format=tf_saved_model \
 --saved_model_tags=serve \
 --signature_name=serving_default \
 "$(pwd)/model/data/saved_model" "$(pwd)/model/tsjs"
cd ./model
ln -sf ./tsjs/model.json model.json
ln -sf ./tsjs/group1-shard1of1.bin group1-shard1of1.bin

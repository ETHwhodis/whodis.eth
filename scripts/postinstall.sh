TARGET="node_modules/websnark/src/groth16.js"
sed -i'' -e 's/NodeWorker = /\/\/NodeWorker = /' $TARGET;
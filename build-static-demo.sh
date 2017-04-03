# This script builds a static version of the example app from `example/` into
# the docs folder for commiting to git. The static demo will be hosted out of
# github pages.

cd example/
npm install
npm run build
cd ../
rm -rf docs/build/
rm -rf docs/index.html
cp -r example/build docs/build
cp example/index.html ./docs/index.html

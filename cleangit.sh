#! /bin/bash -ex

export REPO=git@github.com-suse:dsohk/suse-container-workshop.git
rm -rf .git
git init
git add .
git commit -m 'Lesson 1'
git remote add origin $REPO
git push --mirror --force

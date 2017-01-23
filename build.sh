#!/bin/bash

for f in src/*.js; do
  fn=$(basename $f)
  babel $f > $fn
done

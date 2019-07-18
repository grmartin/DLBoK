#!/usr/bin/env bash
pbjs -t static-module pixels.proto > pbuff.js
pbts pbuff.js > pbuff.d.ts

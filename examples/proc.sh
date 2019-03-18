pbjs -t static-module pixels.proto > pbuff.js
pbts pbuff.js > pbuff.d.ts

#flatc --proto pixels.proto
flatc -T pixels.fbs

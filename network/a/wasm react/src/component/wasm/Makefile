matrix.wasm: matrix.mjs
matrix.mjs: matrix.c
	emcc --no-entry matrix.c -o matrix.mjs  \
	  --pre-js locateFile.js  \
	  -s ENVIRONMENT='web'  \
	  -s EXPORT_NAME='make_module'  \
	  -s USE_ES6_IMPORT_META=0  \
	  -s EXPORTED_FUNCTIONS='["_add", "_multiply", "_malloc", "_free"]'  \
	  -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]'  \
	  -O3
	mv matrix.wasm ../../../public/matrix.wasm

.PHONY: clean
clean:
	rm ../../../public/matrix.wasm front-end/src/component/wasm/matrix.mjs
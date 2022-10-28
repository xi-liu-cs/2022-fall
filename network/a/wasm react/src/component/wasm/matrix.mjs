let make_module = (() => {
    let _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;

    return (
        function(make_module) {
            make_module = make_module || {};

            let Module = typeof make_module != "undefined" ? make_module : {};
            let readyPromiseResolve, readyPromiseReject;
            Module["ready"] = new Promise(function(resolve, reject) {
                readyPromiseResolve = resolve;
                readyPromiseReject = reject
            });
            Module["locateFile"] = function(path, arg) {
                return path
            };
            let moduleOverrides = Object.assign({}, Module);
            let arguments_ = [];
            let thisProgram = "./this.program";
            let quit_ = (status, toThrow) => {
                throw toThrow
            };
            let ENVIRONMENT_IS_WEB = true;
            let ENVIRONMENT_IS_WORKER = false;
            let scriptDirectory = "";

            function locateFile(path) {
                if (Module["locateFile"]) {
                    return Module["locateFile"](path, scriptDirectory)
                }
                return scriptDirectory + path
            }
            let read_, readAsync, readBinary, setWindowTitle;
            if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
                if (ENVIRONMENT_IS_WORKER) {
                    scriptDirectory = window.self.location.href
                } else if (typeof document != "undefined" && document.currentScript) {
                    scriptDirectory = document.currentScript.src
                }
                if (_scriptDir) {
                    scriptDirectory = _scriptDir
                }
                if (scriptDirectory.indexOf("blob:") !== 0) {
                    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1)
                } else {
                    scriptDirectory = ""
                } {
                    read_ = url => {
                        let xhr = new XMLHttpRequest;
                        xhr.open("GET", url, false);
                        xhr.send(null);
                        return xhr.responseText
                    };
                    if (ENVIRONMENT_IS_WORKER) {
                        readBinary = url => {
                            let xhr = new XMLHttpRequest;
                            xhr.open("GET", url, false);
                            xhr.responseType = "arraybuffer";
                            xhr.send(null);
                            return new Uint8Array(xhr.response)
                        }
                    }
                    readAsync = (url, onload, onerror) => {
                        let xhr = new XMLHttpRequest;
                        xhr.open("GET", url, true);
                        xhr.responseType = "arraybuffer";
                        xhr.onload = () => {
                            if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                                onload(xhr.response);
                                return
                            }
                            onerror()
                        };
                        xhr.onerror = onerror;
                        xhr.send(null)
                    }
                }
                setWindowTitle = title => document.title = title
            } else {}
            let out = Module["print"] || console.log.bind(console);
            let err = Module["printErr"] || console.warn.bind(console);
            Object.assign(Module, moduleOverrides);
            moduleOverrides = null;
            if (Module["arguments"]) arguments_ = Module["arguments"];
            if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
            if (Module["quit"]) quit_ = Module["quit"];
            let wasmBinary;
            if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
            let noExitRuntime = Module["noExitRuntime"] || true;
            if (typeof WebAssembly != "object") {
                abort("no native wasm support detected")
            }
            let wasmMemory;
            let ABORT = false;
            let EXITSTATUS;
            let UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

            function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
                let endIdx = idx + maxBytesToRead;
                let endPtr = idx;
                while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
                if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
                    return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr))
                }
                let str = "";
                while (idx < endPtr) {
                    let u0 = heapOrArray[idx++];
                    if (!(u0 & 128)) {
                        str += String.fromCharCode(u0);
                        continue
                    }
                    let u1 = heapOrArray[idx++] & 63;
                    if ((u0 & 224) == 192) {
                        str += String.fromCharCode((u0 & 31) << 6 | u1);
                        continue
                    }
                    let u2 = heapOrArray[idx++] & 63;
                    if ((u0 & 240) == 224) {
                        u0 = (u0 & 15) << 12 | u1 << 6 | u2
                    } else {
                        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63
                    }
                    if (u0 < 65536) {
                        str += String.fromCharCode(u0)
                    } else {
                        let ch = u0 - 65536;
                        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
                    }
                }
                return str
            }

            function UTF8ToString(ptr, maxBytesToRead) {
                return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
            }

            function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
                if (!(maxBytesToWrite > 0)) return 0;
                let startIdx = outIdx;
                let endIdx = outIdx + maxBytesToWrite - 1;
                for (let i = 0; i < str.length; ++i) {
                    let u = str.charCodeAt(i);
                    if (u >= 55296 && u <= 57343) {
                        let u1 = str.charCodeAt(++i);
                        u = 65536 + ((u & 1023) << 10) | u1 & 1023
                    }
                    if (u <= 127) {
                        if (outIdx >= endIdx) break;
                        heap[outIdx++] = u
                    } else if (u <= 2047) {
                        if (outIdx + 1 >= endIdx) break;
                        heap[outIdx++] = 192 | u >> 6;
                        heap[outIdx++] = 128 | u & 63
                    } else if (u <= 65535) {
                        if (outIdx + 2 >= endIdx) break;
                        heap[outIdx++] = 224 | u >> 12;
                        heap[outIdx++] = 128 | u >> 6 & 63;
                        heap[outIdx++] = 128 | u & 63
                    } else {
                        if (outIdx + 3 >= endIdx) break;
                        heap[outIdx++] = 240 | u >> 18;
                        heap[outIdx++] = 128 | u >> 12 & 63;
                        heap[outIdx++] = 128 | u >> 6 & 63;
                        heap[outIdx++] = 128 | u & 63
                    }
                }
                heap[outIdx] = 0;
                return outIdx - startIdx
            }

            function stringToUTF8(str, outPtr, maxBytesToWrite) {
                return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
            }
            let buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

            function updateGlobalBufferAndViews(buf) {
                buffer = buf;
                Module["HEAP8"] = HEAP8 = new Int8Array(buf);
                Module["HEAP16"] = HEAP16 = new Int16Array(buf);
                Module["HEAP32"] = HEAP32 = new Int32Array(buf);
                Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
                Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
                Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
                Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
                Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
            }
            let INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;
            let wasmTable;
            let __ATPRERUN__ = [];
            let __ATINIT__ = [];
            let __ATPOSTRUN__ = [];
            let runtimeInitialized = false;

            function preRun() {
                if (Module["preRun"]) {
                    if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
                    while (Module["preRun"].length) {
                        addOnPreRun(Module["preRun"].shift())
                    }
                }
                callRuntimeCallbacks(__ATPRERUN__)
            }

            function initRuntime() {
                runtimeInitialized = true;
                callRuntimeCallbacks(__ATINIT__)
            }

            function postRun() {
                if (Module["postRun"]) {
                    if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
                    while (Module["postRun"].length) {
                        addOnPostRun(Module["postRun"].shift())
                    }
                }
                callRuntimeCallbacks(__ATPOSTRUN__)
            }

            function addOnPreRun(cb) {
                __ATPRERUN__.unshift(cb)
            }

            function addOnInit(cb) {
                __ATINIT__.unshift(cb)
            }

            function addOnPostRun(cb) {
                __ATPOSTRUN__.unshift(cb)
            }
            let runDependencies = 0;
            let runDependencyWatcher = null;
            let dependenciesFulfilled = null;

            function addRunDependency(id) {
                runDependencies++;
                if (Module["monitorRunDependencies"]) {
                    Module["monitorRunDependencies"](runDependencies)
                }
            }

            function removeRunDependency(id) {
                runDependencies--;
                if (Module["monitorRunDependencies"]) {
                    Module["monitorRunDependencies"](runDependencies)
                }
                if (runDependencies == 0) {
                    if (runDependencyWatcher !== null) {
                        clearInterval(runDependencyWatcher);
                        runDependencyWatcher = null
                    }
                    if (dependenciesFulfilled) {
                        let callback = dependenciesFulfilled;
                        dependenciesFulfilled = null;
                        callback()
                    }
                }
            }

            function abort(what) {
                {
                    if (Module["onAbort"]) {
                        Module["onAbort"](what)
                    }
                }
                what = "Aborted(" + what + ")";
                err(what);
                ABORT = true;
                EXITSTATUS = 1;
                what += ". Build with -sASSERTIONS for more info.";
                let e = new WebAssembly.RuntimeError(what);
                readyPromiseReject(e);
                throw e
            }
            let dataURIPrefix = "data:application/octet-stream;base64,";

            function isDataURI(filename) {
                return filename.startsWith(dataURIPrefix)
            }
            let wasmBinaryFile;
            wasmBinaryFile = "matrix.wasm";
            if (!isDataURI(wasmBinaryFile)) {
                wasmBinaryFile = locateFile(wasmBinaryFile)
            }

            function getBinary(file) {
                try {
                    if (file == wasmBinaryFile && wasmBinary) {
                        return new Uint8Array(wasmBinary)
                    }
                    if (readBinary) {
                        return readBinary(file)
                    }
                    throw "both async and sync fetching of the wasm failed"
                } catch (err) {
                    abort(err)
                }
            }

            function getBinaryPromise() {
                if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
                    if (typeof fetch == "function") {
                        return fetch(wasmBinaryFile, {
                            credentials: "same-origin"
                        }).then(function(response) {
                            if (!response["ok"]) {
                                throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
                            }
                            return response["arrayBuffer"]()
                        }).catch(function() {
                            return getBinary(wasmBinaryFile)
                        })
                    }
                }
                return Promise.resolve().then(function() {
                    return getBinary(wasmBinaryFile)
                })
            }

            function createWasm() {
                let info = {
                    "a": asmLibraryArg
                };

                function receiveInstance(instance, module) {
                    let exports = instance.exports;
                    Module["asm"] = exports;
                    wasmMemory = Module["asm"]["b"];
                    updateGlobalBufferAndViews(wasmMemory.buffer);
                    wasmTable = Module["asm"]["k"];
                    addOnInit(Module["asm"]["c"]);
                    removeRunDependency("wasm-instantiate")
                }
                addRunDependency("wasm-instantiate");

                function receiveInstantiationResult(result) {
                    receiveInstance(result["instance"])
                }

                function instantiateArrayBuffer(receiver) {
                    return getBinaryPromise().then(function(binary) {
                        return WebAssembly.instantiate(binary, info)
                    }).then(function(instance) {
                        return instance
                    }).then(receiver, function(reason) {
                        err("failed to asynchronously prepare wasm: " + reason);
                        abort(reason)
                    })
                }

                function instantiateAsync() {
                    if (!wasmBinary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(wasmBinaryFile) && typeof fetch == "function") {
                        return fetch(wasmBinaryFile, {
                            credentials: "same-origin"
                        }).then(function(response) {
                            let result = WebAssembly.instantiateStreaming(response, info);
                            return result.then(receiveInstantiationResult, function(reason) {
                                err("wasm streaming compile failed: " + reason);
                                err("falling back to ArrayBuffer instantiation");
                                return instantiateArrayBuffer(receiveInstantiationResult)
                            })
                        })
                    } else {
                        return instantiateArrayBuffer(receiveInstantiationResult)
                    }
                }
                if (Module["instantiateWasm"]) {
                    try {
                        let exports = Module["instantiateWasm"](info, receiveInstance);
                        return exports
                    } catch (e) {
                        err("Module.instantiateWasm callback failed with error: " + e);
                        readyPromiseReject(e)
                    }
                }
                instantiateAsync().catch(readyPromiseReject);
                return {}
            }

            function callRuntimeCallbacks(callbacks) {
                while (callbacks.length > 0) {
                    callbacks.shift()(Module)
                }
            }

            function writeArrayToMemory(array, buffer) {
                HEAP8.set(array, buffer)
            }

            function abortOnCannotGrowMemory(requestedSize) {
                abort("OOM")
            }

            function _emscripten_resize_heap(requestedSize) {
                let oldSize = HEAPU8.length;
                requestedSize = requestedSize >>> 0;
                abortOnCannotGrowMemory(requestedSize)
            }

            function getCFunc(ident) {
                let func = Module["_" + ident];
                return func
            }

            function ccall(ident, returnType, argTypes, args, opts) {
                let toC = {
                    "string": str => {
                        let ret = 0;
                        if (str !== null && str !== undefined && str !== 0) {
                            let len = (str.length << 2) + 1;
                            ret = stackAlloc(len);
                            stringToUTF8(str, ret, len)
                        }
                        return ret
                    },
                    "array": arr => {
                        let ret = stackAlloc(arr.length);
                        writeArrayToMemory(arr, ret);
                        return ret
                    }
                };

                function convertReturnValue(ret) {
                    if (returnType === "string") {
                        return UTF8ToString(ret)
                    }
                    if (returnType === "boolean") return Boolean(ret);
                    return ret
                }
                let func = getCFunc(ident);
                let cArgs = [];
                let stack = 0;
                if (args) {
                    for (let i = 0; i < args.length; i++) {
                        let converter = toC[argTypes[i]];
                        if (converter) {
                            if (stack === 0) stack = stackSave();
                            cArgs[i] = converter(args[i])
                        } else {
                            cArgs[i] = args[i]
                        }
                    }
                }
                let ret = func.apply(null, cArgs);

                function onDone(ret) {
                    if (stack !== 0) stackRestore(stack);
                    return convertReturnValue(ret)
                }
                ret = onDone(ret);
                return ret
            }

            function cwrap(ident, returnType, argTypes, opts) {
                argTypes = argTypes || [];
                let numericArgs = argTypes.every(type => type === "number" || type === "boolean");
                let numericRet = returnType !== "string";
                if (numericRet && numericArgs && !opts) {
                    return getCFunc(ident)
                }
                return function() {
                    return ccall(ident, returnType, argTypes, arguments, opts)
                }
            }
            let asmLibraryArg = {
                "a": _emscripten_resize_heap
            };
            let asm = createWasm();
            let ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
                return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["c"]).apply(null, arguments)
            };
            let _multiply = Module["_multiply"] = function() {
                return (_multiply = Module["_multiply"] = Module["asm"]["d"]).apply(null, arguments)
            };
            let _add = Module["_add"] = function() {
                return (_add = Module["_add"] = Module["asm"]["e"]).apply(null, arguments)
            };
            let _malloc2 = Module["_malloc2"] = function() {
                return (_malloc2 = Module["_malloc2"] = Module["asm"]["f"]).apply(null, arguments)
            };
            let _malloc = Module["_malloc"] = function() {
                return (_malloc = Module["_malloc"] = Module["asm"]["g"]).apply(null, arguments)
            };
            let _determinant = Module["_determinant"] = function() {
                return (_determinant = Module["_determinant"] = Module["asm"]["h"]).apply(null, arguments)
            };
            let _tran = Module["_tran"] = function() {
                return (_tran = Module["_tran"] = Module["asm"]["i"]).apply(null, arguments)
            };
            let _cofactor = Module["_cofactor"] = function() {
                return (_cofactor = Module["_cofactor"] = Module["asm"]["j"]).apply(null, arguments)
            };
            let _free = Module["_free"] = function() {
                return (_free = Module["_free"] = Module["asm"]["l"]).apply(null, arguments)
            };
            let stackSave = Module["stackSave"] = function() {
                return (stackSave = Module["stackSave"] = Module["asm"]["m"]).apply(null, arguments)
            };
            let stackRestore = Module["stackRestore"] = function() {
                return (stackRestore = Module["stackRestore"] = Module["asm"]["n"]).apply(null, arguments)
            };
            let stackAlloc = Module["stackAlloc"] = function() {
                return (stackAlloc = Module["stackAlloc"] = Module["asm"]["o"]).apply(null, arguments)
            };
            Module["ccall"] = ccall;
            Module["cwrap"] = cwrap;
            let calledRun;
            dependenciesFulfilled = function runCaller() {
                if (!calledRun) run();
                if (!calledRun) dependenciesFulfilled = runCaller
            };

            function run(args) {
                args = args || arguments_;
                if (runDependencies > 0) {
                    return
                }
                preRun();
                if (runDependencies > 0) {
                    return
                }

                function doRun() {
                    if (calledRun) return;
                    calledRun = true;
                    Module["calledRun"] = true;
                    if (ABORT) return;
                    initRuntime();
                    readyPromiseResolve(Module);
                    if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
                    postRun()
                }
                if (Module["setStatus"]) {
                    Module["setStatus"]("Running...");
                    setTimeout(function() {
                        setTimeout(function() {
                            Module["setStatus"]("")
                        }, 1);
                        doRun()
                    }, 1)
                } else {
                    doRun()
                }
            }
            if (Module["preInit"]) {
                if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
                while (Module["preInit"].length > 0) {
                    Module["preInit"].pop()()
                }
            }
            run();


            return make_module.ready
        }
    );
})();
export default make_module;
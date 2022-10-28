import React, {useState, useEffect} from "react";
import make_module from "./matrix.mjs";

function wrap_multiply(Module)
{
  return function(a, b)
  {
    let n = a.length,
    a_flat = new Float32Array(a.flat()),
    b_flat = new Float32Array(b.flat()),
    sz = a_flat.length * a_flat.BYTES_PER_ELEMENT,
    buf1 = Module._malloc(sz),
    buf2 = Module._malloc(sz);
    Module.HEAPF32.set(a_flat, buf1 >> 2);
    Module.HEAPF32.set(b_flat, buf2 >> 2);
    let c = Module._malloc(sz);
    Module.ccall
    (
      'multiply',
      'number',
      ['number', 'number', 'number', 'number'],
      [buf1, buf2, c, n]
    );
    let result_flat = [];
    for(let i = 0; i < n ** 2; ++i)
      result_flat.push(Module.HEAPF32[c / Float32Array.BYTES_PER_ELEMENT + i]);
    let result = [];
    while(result_flat.length)
      result.push(result_flat.splice(0, n));
    Module._free(buf1);
    Module._free(buf2);
    Module._free(c);
    return result;
  };
}

function Mat(props)
{
  let a = props.a;
  let [add, set_add] = useState(),
  [matrix_multiply, set_matrix_multiply] = useState();
  useEffect
  (
    () =>
    {
      make_module().then((Module) =>
      {
        set_add(() => Module.cwrap('add', 'number', ['number', 'number']));
        set_matrix_multiply(() => wrap_multiply(Module));
      });
    },
    []
  );

  if(!add || !matrix_multiply)
    return 'loading webassembly';

  let result = matrix_multiply(props.a[0], props.a[1]);

  console.log('a', props.a[0]);
  console.log('b', props.a[1]);
  console.log(JSON.stringify(result));
  return(
    <div>
      <div>1 + 1 = {add(1, 1)}</div>
      <div>[[0, 1], [2, 3]] * [[4, 5], [6, 7]] = {JSON.stringify(result)}</div>
    </div>
  );
}

export default Mat;
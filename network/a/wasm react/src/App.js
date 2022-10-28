import React from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import Mat from './component/wasm/Mat';

function App()
{
  let a = [[[0, 1], [2, 3]], [[4, 5], [6, 7]]];
  return(
    <>
      <Routes>
        <Route path = '/' element={<Mat a = {a}></Mat>}></Route>
      </Routes>
    </>
  );
}

export default App;
import { BrowserRouter } from 'react-router-dom';
import { useState } from 'react';
import AllRoutes from './Router';
function App() {

  return (
    <div className='md:w-auto md:h-auto'>
      
      <BrowserRouter>
        <AllRoutes />
      </BrowserRouter>
    </div>
  );
}

export default App;
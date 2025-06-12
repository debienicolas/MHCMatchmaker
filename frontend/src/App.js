import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import InputInstructions from './inputInstructions.js';
import AlternativeLayout from './newMain.js';
import LicensingPage from './LicensingPage.js';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AlternativeLayout />} />
        <Route path="/input-instructions" element={<InputInstructions />}/>
        <Route path="/licensing" element={<LicensingPage />}/>
      </Routes>
    </Router>
  );
}

export default App;
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { FocusProvider } from './context/FocusContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FocusProvider>
      <App />
    </FocusProvider>
  </StrictMode>,
);

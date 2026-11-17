import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerVehicleTexts } from './i18n';
import { App } from './ui/App';
import { defaultVehicle } from './vehicles/registry';
import './style.css';

registerVehicleTexts(defaultVehicle);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App vehicle={defaultVehicle} />
  </StrictMode>,
);

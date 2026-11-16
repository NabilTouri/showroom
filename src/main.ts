import { exposeDebugHandle } from './debug';
import { mountBrand, mountDomUi, partCard } from './ui/dom-ui';
import { defaultVehicle } from './vehicles/registry';
import { Viewer } from './viewer/viewer';

const vehicle = defaultVehicle;
mountBrand(vehicle);
const viewer = new Viewer(document.querySelector<HTMLCanvasElement>('#view')!, vehicle);
await viewer.load();
mountDomUi(viewer, vehicle);
document.querySelector('#loading')!.classList.add('done');
exposeDebugHandle({
  viewer,
  partName: (id) => partCard(vehicle, vehicle.locales.it, id)?.name ?? null,
});

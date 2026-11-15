import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildBody } from './car/body.js';
import { buildWheels } from './car/wheels.js';
import { L } from './car/surface.js';

const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1d22);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
const camera = new THREE.PerspectiveCamera(22, 1, 0.05, 100);
camera.position.set(-5, 2.2, 5.5);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.6, 0);
const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(3, 6, 4); scene.add(sun);
const ground = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.9 }));
ground.rotation.x = -Math.PI / 2; scene.add(ground);

const car = { root: new THREE.Group(), parts: {}, openables: {} };
car.root.position.x = -L / 2;
scene.add(car.root);
buildBody(car); buildWheels(car);
window.__app = { camera, controls, car, THREE };

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

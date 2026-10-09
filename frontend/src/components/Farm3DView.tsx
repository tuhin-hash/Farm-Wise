import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronRight,
  AlertTriangle,
  Info
} from 'lucide-react';

export interface HotspotData {
  id: string;
  title: string;
  category: 'Barn Environment' | 'Nutrition & Silo' | 'Hydration & Water' | 'Livestock Vitals';
  status: 'normal' | 'warning' | 'critical';
  metrics: { label: string; value: string; delta?: string }[];
  description: string;
  recommendation: string;
  actionText: string;
  actionRoute: 'arena' | 'simulator' | 'trends';
  position: [number, number, number];
}

const HOTSPOTS: HotspotData[] = [
  {
    id: 'barn',
    title: 'Main Dairy Barn — Stalls 1-12',
    category: 'Barn Environment',
    status: 'critical',
    metrics: [
      { label: 'Ambient Temp', value: '34.5°C' },
      { label: 'Relative Humidity', value: '68%' },
      { label: 'THI Index', value: '86.8', delta: '+14.8 above comfort' },
      { label: 'Ventilation', value: 'Natural Draft (Insufficient)' }
    ],
    description: 'Current temperature-humidity index (THI 86.8) is causing moderate-to-severe heat stress in lactating HF crossbred cows.',
    recommendation: 'Deploy shade mesh cloths, turn on circulation fans, and spray misting intervals between 11 AM and 4 PM.',
    actionText: 'Evaluate Cooling in Decision Arena',
    actionRoute: 'arena',
    position: [0, 4.2, 0]
  },
  {
    id: 'silo',
    title: 'Feed Silo & Ration Storage',
    category: 'Nutrition & Silo',
    status: 'warning',
    metrics: [
      { label: 'Concentrate Stock', value: '3,200 kg' },
      { label: 'Current Price', value: '₹28.00/kg', delta: '+12% vs baseline' },
      { label: 'Crude Protein (CP)', value: '20.5%' },
      { label: 'Daily Consumption', value: '108 kg / herd' }
    ],
    description: 'Commercial concentrate prices increased by ₹3.00/kg this month, driving total daily herd feed cost to ₹5,414/day.',
    recommendation: 'Test partial 20-30% substitution with De-oiled Rice Bran (₹18.50/kg) or Cottonseed Cake to preserve crude protein and trim expenses.',
    actionText: 'Simulate Ration Blends',
    actionRoute: 'simulator',
    position: [-10, 6.5, -6]
  },
  {
    id: 'water',
    title: 'Hydration Station #1 — Loafing Yard',
    category: 'Hydration & Water',
    status: 'warning',
    metrics: [
      { label: 'Water Intake', value: '82 L / cow / day', delta: '+20.6% vs baseline' },
      { label: 'Trough Temp', value: '29.2°C (Warm)' },
      { label: 'Flow Rate', value: 'Adequate' },
      { label: 'Cleaning Cycle', value: '48h ago' }
    ],
    description: 'Cows are drinking 82 litres/day (+14 L over normal) to combat internal thermal load, leading to rapid trough depletion.',
    recommendation: 'Install shade canopy over drinking troughs and flush fresh groundwater twice daily to keep water cool (< 24°C).',
    actionText: 'View Water Intake History',
    actionRoute: 'trends',
    position: [8, 1.8, 6]
  },
  {
    id: 'cow-004',
    title: 'Cow #004 — HF Cross (Lactating)',
    category: 'Livestock Vitals',
    status: 'critical',
    metrics: [
      { label: 'Rectal Temp', value: '40.2°C', delta: 'High Fever (>39.5°C)' },
      { label: 'Respiration Rate', value: '82 bpm', delta: 'Severe Polypnea' },
      { label: 'Days in Milk', value: '112 days' },
      { label: 'Daily Milk Drop', value: '-3.8 L / day' }
    ],
    description: 'Cow #004 is exhibiting signs of systemic heat exhaustion combined with reduced rumination and open-mouth panting.',
    recommendation: 'Immediate veterinary clinical triage required. Move to isolated shaded recovery stall and provide electrolyte drench.',
    actionText: 'View Clinical Triage in Trends',
    actionRoute: 'trends',
    position: [2.5, 1.6, 7]
  },
  {
    id: 'cow-019',
    title: 'Cow #019 — Jersey Cross (Lactating)',
    category: 'Livestock Vitals',
    status: 'warning',
    metrics: [
      { label: 'Rectal Temp', value: '39.8°C', delta: 'Elevated' },
      { label: 'Respiration Rate', value: '74 bpm', delta: 'Moderate Polypnea' },
      { label: 'Days in Milk', value: '85 days' },
      { label: 'Feed Intake', value: '-15% dry matter' }
    ],
    description: 'Cow #019 shows thermal discomfort and reduced feed intake during peak afternoon sunlight.',
    recommendation: 'Provide targeted water misting and adjust feeding schedule to cooler dawn/dusk hours.',
    actionText: 'Open Decision Arena',
    actionRoute: 'arena',
    position: [-5, 1.6, 8]
  }
];

interface Farm3DProps {
  onNavigate?: (tab: string) => void;
  compact?: boolean;
}

export const Farm3DView: React.FC<Farm3DProps> = ({ onNavigate, compact = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotData | null>(HOTSPOTS[0]);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);
  const [activeCameraView, setActiveCameraView] = useState<'overview' | 'barn' | 'silo' | 'yard'>('overview');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const interactiveObjectsRef = useRef<{ mesh: THREE.Object3D; data: HotspotData }[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebGLSupported(false);
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!webGLSupported || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#dbece2');
    scene.fog = new THREE.FogExp2('#dbece2', 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(24, 18, 28);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1; // Don't go below ground
    controls.minDistance = 8;
    controls.maxDistance = 65;
    controls.target.set(0, 2, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 1.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#fefce8', '#86efac', 0.9);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fffbeb', 1.8);
    sunLight.position.set(30, 45, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // 6. Build Farm World Elements
    interactiveObjectsRef.current = [];

    // Terrain Ground (Rolling green pasture)
    const groundGeo = new THREE.PlaneGeometry(80, 80, 32, 32);
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      // Gentle subtle undulation
      const vz = Math.sin(vx * 0.1) * Math.cos(vy * 0.1) * 0.4;
      posAttr.setZ(i, vz);
    }
    groundGeo.computeVertexNormals();
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#7bb77a',
      roughness: 0.85,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Barn Compound Base Pad (warm stone / gravel)
    const padGeo = new THREE.BoxGeometry(22, 0.2, 18);
    const padMat = new THREE.MeshStandardMaterial({ color: '#cfcfc4', roughness: 0.9 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0, 0.05, 0);
    pad.receiveShadow = true;
    scene.add(pad);

    // Gravel Pathway
    const pathGeo = new THREE.BoxGeometry(4, 0.15, 26);
    const pathMat = new THREE.MeshStandardMaterial({ color: '#e5e5dc', roughness: 0.95 });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.position.set(0, 0.06, 17);
    path.receiveShadow = true;
    scene.add(path);

    // === MAIN BARN ===
    const barnGroup = new THREE.Group();
    // Barn Main Body
    const barnBodyGeo = new THREE.BoxGeometry(14, 6, 10);
    const barnBodyMat = new THREE.MeshStandardMaterial({ color: '#a83a32', roughness: 0.7 });
    const barnBody = new THREE.Mesh(barnBodyGeo, barnBodyMat);
    barnBody.position.y = 3;
    barnBody.castShadow = true;
    barnBody.receiveShadow = true;
    barnGroup.add(barnBody);

    // Barn Gambrel Roof
    const roofGeo = new THREE.CylinderGeometry(0.1, 8.5, 14.6, 4, 1, false, Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: '#7f2620', roughness: 0.6 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.z = Math.PI / 2;
    roof.position.set(0, 7.8, 0);
    roof.castShadow = true;
    barnGroup.add(roof);

    // Barn Trim & White Sliding Doors
    const doorGeo = new THREE.BoxGeometry(4.2, 4.5, 0.3);
    const doorMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5 });
    const barnDoor = new THREE.Mesh(doorGeo, doorMat);
    barnDoor.position.set(0, 2.25, 5.1);
    barnDoor.castShadow = true;
    barnGroup.add(barnDoor);

    // Barn Vent Cupola / Weather Vane
    const cupolaGeo = new THREE.BoxGeometry(1.6, 1.2, 1.6);
    const cupolaMat = new THREE.MeshStandardMaterial({ color: '#f8fafc' });
    const cupola = new THREE.Mesh(cupolaGeo, cupolaMat);
    cupola.position.set(0, 9.2, 0);
    cupola.castShadow = true;
    barnGroup.add(cupola);

    scene.add(barnGroup);
    interactiveObjectsRef.current.push({ mesh: barnBody, data: HOTSPOTS[0] });

    // === GRAIN SILO ===
    const siloGroup = new THREE.Group();
    siloGroup.position.set(-10, 0, -6);
    // Cylinder tower
    const siloTowerGeo = new THREE.CylinderGeometry(2.2, 2.2, 10, 24);
    const siloMat = new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      roughness: 0.3,
      metalness: 0.65
    });
    const siloTower = new THREE.Mesh(siloTowerGeo, siloMat);
    siloTower.position.y = 5;
    siloTower.castShadow = true;
    siloTower.receiveShadow = true;
    siloGroup.add(siloTower);

    // Silo Dome Cap
    const domeGeo = new THREE.SphereGeometry(2.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.3, metalness: 0.7 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 10;
    dome.castShadow = true;
    siloGroup.add(dome);

    scene.add(siloGroup);
    interactiveObjectsRef.current.push({ mesh: siloTower, data: HOTSPOTS[1] });

    // === WATER TROUGH ===
    const troughGroup = new THREE.Group();
    troughGroup.position.set(8, 0, 6);
    const troughGeo = new THREE.BoxGeometry(3.5, 1.1, 1.8);
    const troughMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.4, metalness: 0.7 });
    const trough = new THREE.Mesh(troughGeo, troughMat);
    trough.position.y = 0.55;
    trough.castShadow = true;
    trough.receiveShadow = true;
    troughGroup.add(trough);

    // Water surface
    const waterGeo = new THREE.PlaneGeometry(3.2, 1.5);
    const waterMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 1.0;
    troughGroup.add(water);

    scene.add(troughGroup);
    interactiveObjectsRef.current.push({ mesh: trough, data: HOTSPOTS[2] });

    // === LOAFING YARD SHADE NET CANOPY ===
    const shadeGroup = new THREE.Group();
    shadeGroup.position.set(0, 0, 11);
    // 4 Wooden support poles
    const poleMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    const polePositions = [
      [-6, 2.5, -4],
      [6, 2.5, -4],
      [-6, 2.5, 4],
      [6, 2.5, 4]
    ];
    polePositions.forEach(p => {
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 5, 8);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(p[0], p[1], p[2]);
      pole.castShadow = true;
      shadeGroup.add(pole);
    });

    // Dark green mesh shade netting
    const netGeo = new THREE.BoxGeometry(13, 0.1, 9);
    const netMat = new THREE.MeshStandardMaterial({
      color: '#14532d',
      roughness: 0.9,
      transparent: true,
      opacity: 0.88
    });
    const net = new THREE.Mesh(netGeo, netMat);
    net.position.y = 4.9;
    net.castShadow = true;
    shadeGroup.add(net);
    scene.add(shadeGroup);

    // === STYLIZED COWS ===
    const cowsList: { x: number; z: number; rotY: number; scale: number; hotspot?: HotspotData }[] = [
      { x: 2.5, z: 7, rotY: 0.4, scale: 1.1, hotspot: HOTSPOTS[3] }, // Cow 004
      { x: -5, z: 8, rotY: -0.8, scale: 1.0, hotspot: HOTSPOTS[4] }, // Cow 019
      { x: -2, z: 12, rotY: 1.2, scale: 1.05 },
      { x: 5, z: 11, rotY: -0.3, scale: 0.95 },
      { x: -9, z: 14, rotY: 2.1, scale: 1.0 },
      { x: 10, z: 15, rotY: -1.7, scale: 1.1 }
    ];

    const cowMeshes: THREE.Group[] = [];

    cowsList.forEach((cfg) => {
      const cowGroup = new THREE.Group();
      cowGroup.position.set(cfg.x, 0, cfg.z);
      cowGroup.rotation.y = cfg.rotY;
      cowGroup.scale.set(cfg.scale, cfg.scale, cfg.scale);

      // Body (White with black patches)
      const bodyGeo = new THREE.BoxGeometry(2.4, 1.4, 1.1);
      const cowBodyMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.8 });
      const cowBody = new THREE.Mesh(bodyGeo, cowBodyMat);
      cowBody.position.y = 1.3;
      cowBody.castShadow = true;
      cowGroup.add(cowBody);

      // Black patch spot
      const spotGeo = new THREE.BoxGeometry(0.9, 0.8, 1.12);
      const spotMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 });
      const spot = new THREE.Mesh(spotGeo, spotMat);
      spot.position.set(0.2, 1.4, 0);
      cowGroup.add(spot);

      // Head
      const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.7);
      const head = new THREE.Mesh(headGeo, spotMat);
      head.position.set(1.4, 1.8, 0);
      head.castShadow = true;
      cowGroup.add(head);

      // Pink Muzzle
      const muzzleGeo = new THREE.BoxGeometry(0.4, 0.4, 0.6);
      const muzzleMat = new THREE.MeshStandardMaterial({ color: '#fda4af', roughness: 0.6 });
      const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
      muzzle.position.set(1.8, 1.6, 0);
      cowGroup.add(muzzle);

      // 4 Legs
      const legGeo = new THREE.BoxGeometry(0.25, 0.9, 0.25);
      const legMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.8 });
      const legOffsets = [
        [-0.8, 0.45, -0.35],
        [-0.8, 0.45, 0.35],
        [0.8, 0.45, -0.35],
        [0.8, 0.45, 0.35]
      ];
      legOffsets.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(pos[0], pos[1], pos[2]);
        leg.castShadow = true;
        cowGroup.add(leg);
      });

      scene.add(cowGroup);
      cowMeshes.push(cowGroup);

      if (cfg.hotspot) {
        interactiveObjectsRef.current.push({ mesh: cowBody, data: cfg.hotspot });
      }
    });

    // === PROCEDURAL TREES & FENCES ===
    // Trees
    const treePositions = [
      [-16, 0, -12],
      [-18, 0, 5],
      [-14, 0, 18],
      [16, 0, -14],
      [18, 0, 2],
      [15, 0, 18],
      [22, 0, -5]
    ];
    treePositions.forEach(p => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(p[0], 0, p[2]);

      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: '#573016', roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.5;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Low poly layered foliage
      const f1Geo = new THREE.ConeGeometry(2.4, 3.2, 7);
      const fMat = new THREE.MeshStandardMaterial({ color: '#2d6a4f', roughness: 0.8 });
      const f1 = new THREE.Mesh(f1Geo, fMat);
      f1.position.y = 3.6;
      f1.castShadow = true;
      treeGroup.add(f1);

      const f2Geo = new THREE.ConeGeometry(1.8, 2.6, 7);
      const f2Mat = new THREE.MeshStandardMaterial({ color: '#40916c', roughness: 0.8 });
      const f2 = new THREE.Mesh(f2Geo, f2Mat);
      f2.position.y = 5.2;
      f2.castShadow = true;
      treeGroup.add(f2);

      scene.add(treeGroup);
    });

    // Paddock Fences (Stylized post & rail)
    const fenceMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });
    for (let x = -14; x <= 14; x += 4) {
      const postGeo = new THREE.BoxGeometry(0.15, 1.4, 0.15);
      const post = new THREE.Mesh(postGeo, fenceMat);
      post.position.set(x, 0.7, 20);
      post.castShadow = true;
      scene.add(post);
    }
    const railGeo = new THREE.BoxGeometry(28, 0.08, 0.08);
    const rail1 = new THREE.Mesh(railGeo, fenceMat);
    rail1.position.set(0, 0.6, 20);
    const rail2 = new THREE.Mesh(railGeo, fenceMat);
    rail2.position.set(0, 1.1, 20);
    scene.add(rail1);
    scene.add(rail2);

    // === FLOATING 3D HOTSPOT PINS ===
    const pinGroup = new THREE.Group();
    HOTSPOTS.forEach(h => {
      const pinSphereGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const pinMat = new THREE.MeshStandardMaterial({
        color: h.status === 'critical' ? '#ef4444' : h.status === 'warning' ? '#f59e0b' : '#10b981',
        emissive: h.status === 'critical' ? '#b91c1c' : h.status === 'warning' ? '#b45309' : '#047857',
        emissiveIntensity: 0.6,
        roughness: 0.2
      });
      const pin = new THREE.Mesh(pinSphereGeo, pinMat);
      pin.position.set(h.position[0], h.position[1], h.position[2]);

      // Stem
      const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(h.position[0], h.position[1] - 0.45, h.position[2]);

      pinGroup.add(pin);
      pinGroup.add(stem);
      interactiveObjectsRef.current.push({ mesh: pin, data: h });
    });
    scene.add(pinGroup);

    // 7. Raycasting Click Interaction
    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const interactiveMeshes = interactiveObjectsRef.current.map(i => i.mesh);
      const intersects = raycasterRef.current.intersectObjects(interactiveMeshes, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const match = interactiveObjectsRef.current.find(i => i.mesh === hit || i.mesh.children.includes(hit));
        if (match) {
          setSelectedHotspot(match.data);
          // Gently focus camera target on hotspot
          controls.target.set(match.data.position[0], 2, match.data.position[2]);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 8. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle cow idle tail & head swaying
      cowMeshes.forEach((cow, i) => {
        const offset = i * 1.3;
        cow.rotation.y += Math.sin(elapsedTime * 1.5 + offset) * 0.0006;
      });

      // Hotspot pin bobbing
      pinGroup.children.forEach((child, idx) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
          child.position.y += Math.sin(elapsedTime * 3 + idx) * 0.003;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 480;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [webGLSupported]);

  // Camera preset transitions
  const setCameraView = (view: 'overview' | 'barn' | 'silo' | 'yard') => {
    setActiveCameraView(view);
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (view === 'overview') {
      camera.position.set(24, 18, 28);
      controls.target.set(0, 2, 0);
    } else if (view === 'barn') {
      camera.position.set(6, 9, 14);
      controls.target.set(0, 3, 2);
      setSelectedHotspot(HOTSPOTS[0]);
    } else if (view === 'silo') {
      camera.position.set(-6, 8, 4);
      controls.target.set(-10, 5, -6);
      setSelectedHotspot(HOTSPOTS[1]);
    } else if (view === 'yard') {
      camera.position.set(12, 6, 16);
      controls.target.set(3, 1.5, 8);
      setSelectedHotspot(HOTSPOTS[3]);
    }
  };

  const resetCamera = () => setCameraView('overview');

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm bg-stone-900 transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl h-[calc(100vh-2rem)]' : compact ? 'h-[360px]' : 'h-[520px]'
      }`}
    >
      {/* 3D Canvas Mounting Container */}
      {webGLSupported ? (
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        /* WebGL Fallback: 2.5D Interactive Schematic Map */
        <div className="w-full h-full bg-gradient-to-b from-[#e8f3ec] to-[#d6ebd9] p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/90 px-2.5 py-1 rounded-full">
                Interactive Farm Schematic (2.5D Mode)
              </span>
              <h3 className="text-lg font-bold text-stone-800 mt-1">Sri Lakshmi Dairy Farm — Mandya, Karnataka</h3>
            </div>
            <span className="text-xs text-stone-500 bg-white/80 px-2.5 py-1 rounded-lg border border-stone-200">
              WebGL Hardware Accelerated Fallback Active
            </span>
          </div>

          {/* Schematic Hotspots Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-auto z-10">
            {HOTSPOTS.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedHotspot(h)}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  selectedHotspot?.id === h.id
                    ? 'bg-white shadow-md border-emerald-600 ring-2 ring-emerald-500/30'
                    : 'bg-white/80 border-stone-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      h.status === 'critical' ? 'bg-rose-500' : h.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-[10px] font-semibold text-stone-400 uppercase">{h.category.split(' ')[0]}</span>
                </div>
                <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{h.title}</h4>
                <div className="mt-2 text-[11px] font-mono text-emerald-700 font-semibold">{h.metrics[0].value}</div>
              </button>
            ))}
          </div>

          <div className="text-xs text-stone-500 z-10 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>Select any farm structure or livestock group above to inspect live telemetry.</span>
          </div>
        </div>
      )}

      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        {/* Left: View Presets */}
        <div className="flex items-center gap-1.5 bg-stone-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-stone-700/60 shadow-lg pointer-events-auto">
          <button
            onClick={() => setCameraView('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeCameraView === 'overview'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setCameraView('barn')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeCameraView === 'barn'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            Main Barn
          </button>
          <button
            onClick={() => setCameraView('silo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeCameraView === 'silo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            Feed Silo
          </button>
          <button
            onClick={() => setCameraView('yard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeCameraView === 'yard'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            Loafing Yard
          </button>
        </div>

        {/* Right: Reset & Expand */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={resetCamera}
            title="Reset Camera Position"
            className="p-2 bg-stone-900/85 backdrop-blur-md text-stone-200 hover:text-white rounded-xl border border-stone-700/60 shadow-lg hover:bg-stone-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Exit Fullscreen' : 'Expand 3D Farm'}
            className="p-2 bg-stone-900/85 backdrop-blur-md text-stone-200 hover:text-white rounded-xl border border-stone-700/60 shadow-lg hover:bg-stone-800 transition"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating 3D Interaction Tip Pill */}
      <div className="absolute top-16 left-4 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1 bg-stone-900/70 backdrop-blur-md rounded-full border border-stone-700/50 text-[11px] text-stone-300 shadow">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Drag to rotate • Scroll to zoom • Click building or cow for live sensors</span>
      </div>

      {/* Bottom Floating Hotspot Drawer / Contextual Inspector */}
      {selectedHotspot && (
        <div className="absolute bottom-4 left-4 right-4 max-w-xl bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-stone-200/90 shadow-2xl z-20 transition-all duration-300">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedHotspot.status === 'critical'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : selectedHotspot.status === 'warning'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {selectedHotspot.category}
                </span>
                <span className="text-xs font-semibold text-stone-500">Live IoT & Farm Registry</span>
              </div>
              <h3 className="text-base font-bold text-stone-900 mt-1">{selectedHotspot.title}</h3>
            </div>

            {selectedHotspot.status === 'critical' && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" /> Thermal Alert
              </span>
            )}
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 pt-3 border-t border-stone-100">
            {selectedHotspot.metrics.map((m, idx) => (
              <div key={idx} className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-100">
                <div className="text-[10px] text-stone-400 font-medium truncate">{m.label}</div>
                <div className="text-xs font-bold text-stone-800 font-mono mt-0.5">{m.value}</div>
                {m.delta && <div className="text-[9px] text-rose-600 font-medium truncate mt-0.5">{m.delta}</div>}
              </div>
            ))}
          </div>

          <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">{selectedHotspot.description}</p>

          <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-stone-100">
            <div className="text-[11px] text-stone-500 italic hidden sm:block truncate max-w-xs">
              💡 {selectedHotspot.recommendation}
            </div>

            <button
              onClick={() => onNavigate && onNavigate(selectedHotspot.actionRoute)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition shrink-0 ml-auto"
            >
              <span>{selectedHotspot.actionText}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

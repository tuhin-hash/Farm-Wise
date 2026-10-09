import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Info, AlertTriangle, Thermometer, Droplets, Wheat, ShieldAlert } from 'lucide-react';

interface Farm3DProps {
  onSelectFeature?: (featureId: string) => void;
}

export const Farm3DView: React.FC<Farm3DProps> = ({ onSelectFeature }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    title: string;
    category: string;
    status: 'normal' | 'warning' | 'critical';
    details: string;
    metric?: string;
  } | null>({
    id: 'shed',
    title: 'Main Dairy Barn (Shed 1)',
    category: 'Environment & Shelter',
    status: 'warning',
    details: 'Naturally ventilated shed with corrugated roofing. High ambient thermal load (35.5°C, 68% RH) pushes THI to 86.8 (Moderate-to-Severe Heat Stress).',
    metric: 'THI 86.8 | Temp 35.5°C'
  });

  const [webGLFailed, setWebGLFailed] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      console.warn('WebGL initialization failed, using interactive 2D fallback', e);
      setWebGLFailed(true);
      return;
    }

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 450;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(24, 20, 26);
    camera.lookAt(0, 2, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    sunLight.position.set(20, 30, 15);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Ground Pasture
    const groundGeo = new THREE.PlaneGeometry(50, 50);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Barn Ground Pad
    const padGeo = new THREE.BoxGeometry(16, 0.2, 12);
    const padMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.9 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0, 0.1, 0);
    scene.add(pad);

    // Barn Structure
    const barnGeo = new THREE.BoxGeometry(14, 5, 10);
    const barnMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
    const barn = new THREE.Mesh(barnGeo, barnMat);
    barn.position.set(0, 2.6, 0);
    barn.castShadow = true;
    barn.userData = {
      id: 'shed',
      title: 'Main Dairy Barn (Shed 1)',
      category: 'Environment & Shelter',
      status: 'warning',
      details: 'Naturally ventilated shed with corrugated roofing. High ambient thermal load (35.5°C, 68% RH) pushes THI to 86.8 (Moderate-to-Severe Heat Stress).',
      metric: 'THI 86.8 | Temp 35.5°C'
    };
    scene.add(barn);

    // Barn Roof
    const roofGeo = new THREE.ConeGeometry(9.5, 3, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 6.6, 0);
    roof.rotation.y = Math.PI / 4;
    scene.add(roof);

    // Silo (Feed Storage)
    const siloGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
    const siloMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.4, roughness: 0.3 });
    const silo = new THREE.Mesh(siloGeo, siloMat);
    silo.position.set(-10, 4, -4);
    silo.castShadow = true;
    silo.userData = {
      id: 'silo',
      title: 'Feed Silo & Storage',
      category: 'Feed Inventory',
      status: 'warning',
      details: 'Commercial Concentrate 20% CP inventory. Price spiked +17.86% (₹28 to ₹33/kg). Alternative agro-byproducts (DORB, Maize) needed for ration cost dilution.',
      metric: 'Price: ₹33/kg (+17.9%)'
    };
    scene.add(silo);

    const siloCapGeo = new THREE.ConeGeometry(2.1, 1.8, 16);
    const siloCapMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const siloCap = new THREE.Mesh(siloCapGeo, siloCapMat);
    siloCap.position.set(-10, 8.9, -4);
    scene.add(siloCap);

    // Water Trough
    const troughGeo = new THREE.BoxGeometry(4.5, 1, 1.8);
    const troughMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 });
    const trough = new THREE.Mesh(troughGeo, troughMat);
    trough.position.set(0, 0.6, 8);
    trough.castShadow = true;
    trough.userData = {
      id: 'water_trough',
      title: 'Water Trough System',
      category: 'Hydration Monitoring',
      status: 'critical',
      details: 'Water intake anomaly detected: herd average down to 64 L/cow (-17.95%) during severe summer heat. Cows require 95-110 L. Clean shaded cool water access needed.',
      metric: '64 L/cow (-17.9% Drop)'
    };
    scene.add(trough);

    // Dairy Cows (3D Stylized Voxels)
    const createCow = (x: number, z: number, tag: string, isFlagged: boolean = false, flagReason?: string) => {
      const cowGroup = new THREE.Group();
      cowGroup.position.set(x, 0, z);

      // Body
      const bodyGeo = new THREE.BoxGeometry(2, 1.2, 1);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: isFlagged ? 0xf87171 : 0xf8fafc,
        roughness: 0.6
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(0, 1.1, 0);
      body.castShadow = true;
      cowGroup.add(body);

      // Head
      const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.7);
      const headMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(1.2, 1.6, 0);
      cowGroup.add(head);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const positions = [
        [-0.7, 0.4, 0.35],
        [-0.7, 0.4, -0.35],
        [0.7, 0.4, 0.35],
        [0.7, 0.4, -0.35]
      ];
      positions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, ly, lz);
        cowGroup.add(leg);
      });

      cowGroup.userData = {
        id: `cow_${tag}`,
        title: `Cow ${tag} (${isFlagged ? 'Attention Needed' : 'Normal Herd Member'})`,
        category: 'Individual Livestock Monitor',
        status: isFlagged ? 'critical' : 'normal',
        details: isFlagged
          ? (flagReason || 'Requires physical examination by certified veterinarian.')
          : 'Normal grazing and rumination behavior observed in herd records.',
        metric: isFlagged ? 'Veterinary Flag' : 'Normal Yield'
      };

      scene.add(cowGroup);
      return cowGroup;
    };

    const cow1 = createCow(6, 6, 'KA-MAN-104', true, 'Fever: 39.9°C, Severe feed refusal. High heat distress & suspected infection. Immediate vet isolation required.');
    const cow2 = createCow(-6, 7, 'KA-MAN-112', true, 'Yield dropped 35%, right rear udder firmness. Early clinical mastitis indicator. California Mastitis Test needed.');
    createCow(8, -2, 'KA-MAN-108');
    createCow(5, -6, 'KA-MAN-115');
    createCow(-7, -4, 'KA-MAN-121');

    // Raycaster for interactivity
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== scene) {
          if (curr.userData && curr.userData.id) {
            setSelectedItem(curr.userData as any);
            onSelectFeature?.(curr.userData.id);
            return;
          }
          curr = curr.parent;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Gentle Animation loop
    let reqId: number;
    let angle = 0;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      angle += 0.002;
      // Soft gentle orbit
      camera.position.x = 24 * Math.cos(angle * 0.3) + 5;
      camera.position.z = 24 * Math.sin(angle * 0.3) + 5;
      camera.lookAt(0, 2, 0);

      // Subtle cow tail wag
      cow1.rotation.y = Math.sin(angle * 4) * 0.05;
      cow2.rotation.y = Math.sin(angle * 3) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(reqId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[480px] bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-700">
      {/* 3D Canvas Mount */}
      {!webGLFailed ? (
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        /* Fallback 2.5D schematic view */
        <div className="w-full h-full p-6 flex flex-col justify-center items-center bg-gradient-to-b from-slate-900 to-slate-800 text-white">
          <div className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
            <Info className="w-5 h-5" /> 3D Farm Interactive Schematic (Hardware Acceleration Fallback)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl mt-4">
            <button
              onClick={() => setSelectedItem({
                id: 'shed',
                title: 'Main Dairy Barn (Shed 1)',
                category: 'Environment & Shelter',
                status: 'warning',
                details: 'Naturally ventilated shed with corrugated roofing. High ambient thermal load (35.5°C, 68% RH) pushes THI to 86.8 (Moderate-to-Severe Heat Stress).',
                metric: 'THI 86.8 | Temp 35.5°C'
              })}
              className="p-4 bg-slate-800 border border-amber-500/50 rounded-xl hover:bg-slate-700 transition"
            >
              <Thermometer className="w-6 h-6 text-amber-400 mb-1" />
              <div className="text-sm font-semibold">Dairy Barn</div>
              <div className="text-xs text-amber-300">THI 86.8 Stress</div>
            </button>
            <button
              onClick={() => setSelectedItem({
                id: 'water_trough',
                title: 'Water Trough System',
                category: 'Hydration Monitoring',
                status: 'critical',
                details: 'Water intake anomaly detected: herd average down to 64 L/cow (-17.95%) during summer heat.',
                metric: '64 L/cow (-17.9%)'
              })}
              className="p-4 bg-slate-800 border border-red-500/50 rounded-xl hover:bg-slate-700 transition"
            >
              <Droplets className="w-6 h-6 text-cyan-400 mb-1" />
              <div className="text-sm font-semibold">Water Trough</div>
              <div className="text-xs text-red-400">Decline -17.9%</div>
            </button>
            <button
              onClick={() => setSelectedItem({
                id: 'silo',
                title: 'Feed Silo & Storage',
                category: 'Feed Inventory',
                status: 'warning',
                details: 'Commercial Concentrate 20% CP inventory. Price spiked +17.86% (₹28 to ₹33/kg).',
                metric: '₹33/kg (+17.9%)'
              })}
              className="p-4 bg-slate-800 border border-emerald-500/50 rounded-xl hover:bg-slate-700 transition"
            >
              <Wheat className="w-6 h-6 text-emerald-400 mb-1" />
              <div className="text-sm font-semibold">Feed Silo</div>
              <div className="text-xs text-emerald-300">Concentrate Hike</div>
            </button>
            <button
              onClick={() => setSelectedItem({
                id: 'cow_KA-MAN-104',
                title: 'Cow KA-MAN-104 (Attention Needed)',
                category: 'Livestock Health',
                status: 'critical',
                details: 'Fever: 39.9°C, Severe feed refusal. Urgent veterinary review mandatory.',
                metric: 'Rectal Temp 39.9°C'
              })}
              className="p-4 bg-slate-800 border border-rose-500/50 rounded-xl hover:bg-slate-700 transition"
            >
              <ShieldAlert className="w-6 h-6 text-rose-400 mb-1" />
              <div className="text-sm font-semibold">Cow #104</div>
              <div className="text-xs text-rose-300">Vet Escalation</div>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 text-white flex items-center gap-3 pointer-events-auto">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-sm">Sri Lakshmi Dairy Farm (Mandya, Karnataka)</span>
          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">24 Dairy Cows | Synthetic Model</span>
        </div>
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 pointer-events-auto flex items-center gap-2">
          <span>Click objects to inspect</span>
        </div>
      </div>

      {/* Interactive Asset Detail Drawer */}
      {selectedItem && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-4 text-white shadow-2xl transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {selectedItem.status === 'critical' ? (
                <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              ) : selectedItem.status === 'warning' ? (
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                  <Thermometer className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Info className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  {selectedItem.category}
                </div>
                <div className="text-base font-bold text-white flex items-center gap-2">
                  {selectedItem.title}
                  {selectedItem.metric && (
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                      {selectedItem.metric}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            {selectedItem.details}
          </p>
        </div>
      )}
    </div>
  );
};

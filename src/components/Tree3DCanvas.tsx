import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { animate } from 'motion';
import { TreeSpeciesId } from '../types';

interface Tree3DCanvasProps {
  speciesId: TreeSpeciesId;
  progress: number; // 0.0 to 1.0
  isCompleted?: boolean;
  className?: string;
  autoRotate?: boolean;
}

export const Tree3DCanvas: React.FC<Tree3DCanvasProps> = ({
  speciesId,
  progress = 0.5,
  isCompleted = false,
  className = '',
  autoRotate = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [, setIsInteracting] = useState(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const treeGroupRef = useRef<THREE.Group | null>(null);
  const foliageGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const prevProgressRef = useRef<number>(progress);
  const lastSpeciesRef = useRef<TreeSpeciesId | null>(null);
  const lastPhaseRef = useRef<'sprout' | 'grown' | null>(null);

  // 1. Scene initialization (runs once)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Reset tracking refs so tree model always builds on first mount
    lastSpeciesRef.current = null;
    lastPhaseRef.current = null;

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 2.4, 8.4);
    cameraRef.current = camera;

    const isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
    renderer.shadowMap.enabled = !isMobile;
    if (!isMobile) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.3);
    mainLight.position.set(4, 7, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 15;
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x80e8ff, 0.5);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    const innerLight = new THREE.PointLight(0xa3e635, 0.6, 4);
    innerLight.position.set(0, 1.8, 0);
    scene.add(innerLight);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.3, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minPolarAngle = Math.PI / 6;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // Base Platform
    const baseGroup = new THREE.Group();
    const islandGeo = new THREE.CylinderGeometry(1.65, 1.25, 0.35, 32);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x689f63, roughness: 0.85 });
    const islandMesh = new THREE.Mesh(islandGeo, islandMat);
    islandMesh.position.y = -0.175;
    islandMesh.receiveShadow = true;
    baseGroup.add(islandMesh);

    const soilGeo = new THREE.CylinderGeometry(1.58, 1.58, 0.05, 32);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x4a3222, roughness: 0.95 });
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = 0.01;
    soilMesh.receiveShadow = true;
    baseGroup.add(soilMesh);

    createGroundDecorations(baseGroup);
    scene.add(baseGroup);

    // Tree containers (populated by tree model effect)
    const treeGroup = new THREE.Group();
    treeGroupRef.current = treeGroup;
    scene.add(treeGroup);

    const foliageGroup = new THREE.Group();
    foliageGroupRef.current = foliageGroup;
    treeGroup.add(foliageGroup);

    // Animation loop — pauses when page is hidden or container detached
    let animationFrameId: number;
    let isPageVisible = true;
    const clock = new THREE.Clock();

    const handleVisibility = () => {
      isPageVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isPageVisible || !container.isConnected) return;
      const elapsedTime = clock.getElapsedTime();

      if (foliageGroupRef.current) {
        foliageGroupRef.current.rotation.z = Math.sin(elapsedTime * 1.2) * 0.025;
        foliageGroupRef.current.rotation.x = Math.cos(elapsedTime * 0.9) * 0.02;
      }
      if (treeGroupRef.current) {
        treeGroupRef.current.rotation.z = Math.sin(elapsedTime * 1.0) * 0.01;
      }

      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= 0.006;
          if (positions[i] < 0.0) {
            positions[i] = 2.4 + Math.random() * 0.4;
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        particlesRef.current.rotation.y = elapsedTime * 0.15;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      controls.dispose();
      if (container) container.innerHTML = '';
    };
  }, []);

  // 2. Tree model rebuild — on mount, species change, completion change, or sprout→grown transition
  useEffect(() => {
    if (!treeGroupRef.current || !foliageGroupRef.current || !sceneRef.current) return;

    const phase: 'sprout' | 'grown' = (progress < 0.12 && !isCompleted) ? 'sprout' : 'grown';
    if (phase === lastPhaseRef.current && speciesId === lastSpeciesRef.current) return;
    lastPhaseRef.current = phase;
    lastSpeciesRef.current = speciesId;

    buildDetailedTreeModel(treeGroupRef.current, foliageGroupRef.current, speciesId, progress, isCompleted);

    if (particlesRef.current) {
      sceneRef.current.remove(particlesRef.current);
    }
    const particles = createDetailedParticles(speciesId);
    if (particles) {
      particlesRef.current = particles;
      sceneRef.current.add(particles);
    }
  }, [speciesId, progress, isCompleted]);

  // 3. Update autoRotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Smoothly update tree growth scale & foliage density when progress changes
  useEffect(() => {
    if (treeGroupRef.current && foliageGroupRef.current) {
      const targetTreeScale = Math.max(0.2, Math.min(0.82, 0.28 + progress * 0.54));
      const targetFoliageScale = Math.max(0.12, Math.min(1.0, progress * 1.05));

      const wasIncomplete = prevProgressRef.current < 0.98;
      const justCompleted = progress >= 0.99 && wasIncomplete;

      if (justCompleted && treeGroupRef.current) {
        // Spring bounce on completion
        const tg = treeGroupRef.current;
        animate(1.0, targetTreeScale * 1.12, {
          type: 'spring',
          stiffness: 280,
          damping: 8,
          onUpdate: (v: number) => {
            tg.scale.set(v, v, v);
          },
          onComplete: () => {
            tg.scale.set(targetTreeScale, targetTreeScale, targetTreeScale);
          },
        });
      } else {
        treeGroupRef.current.scale.set(targetTreeScale, targetTreeScale, targetTreeScale);
      }

      foliageGroupRef.current.scale.set(targetFoliageScale, targetFoliageScale, targetFoliageScale);
      prevProgressRef.current = progress;
    }
  }, [progress]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full cursor-grab active:cursor-grabbing select-none ${className}`}
      onMouseDown={() => setIsInteracting(true)}
      onMouseUp={() => setIsInteracting(false)}
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => setIsInteracting(false)}
    >
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] text-[#2f6b4f]/70 bg-white/70 backdrop-blur-2xs px-2 py-0.5 rounded-full pointer-events-none opacity-0 hover:opacity-100 transition-opacity shadow-2xs">
        滑动 3D 树木 • 观察生长
      </div>
    </div>
  );
};

// --- Ground Details (Tufts, Pebbles, Flowers) ---
function createGroundDecorations(group: THREE.Group) {
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x82b975, roughness: 0.6 });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.4 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });

  // 1. Grass Tufts
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.4;
    const r = 0.8 + Math.random() * 0.5;
    const tuftGeo = new THREE.ConeGeometry(0.06, 0.22, 5);
    const tuft = new THREE.Mesh(tuftGeo, grassMat);
    tuft.position.set(Math.cos(angle) * r, 0.1, Math.sin(angle) * r);
    tuft.rotation.z = (Math.random() - 0.5) * 0.3;
    group.add(tuft);
  }

  // 2. Small Stones & Flowers
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + 0.3;
    const r = 1.0 + Math.random() * 0.3;
    const stoneGeo = new THREE.DodecahedronGeometry(0.06 + Math.random() * 0.04, 0);
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.set(Math.cos(angle) * r, 0.03, Math.sin(angle) * r);
    group.add(stone);

    const flowerGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const flower = new THREE.Mesh(flowerGeo, flowerMat);
    flower.position.set(Math.cos(angle + 0.5) * (r - 0.2), 0.06, Math.sin(angle + 0.5) * (r - 0.2));
    group.add(flower);
  }
}

// --- Detailed Multi-stage Tree Generation ---
function buildDetailedTreeModel(
  treeGroup: THREE.Group,
  foliageGroup: THREE.Group,
  speciesId: TreeSpeciesId,
  progress: number,
  isCompleted: boolean
) {
  // Clear previous meshes
  while (treeGroup.children.length > 0) treeGroup.remove(treeGroup.children[0]);
  while (foliageGroup.children.length > 0) foliageGroup.remove(foliageGroup.children[0]);

  treeGroup.add(foliageGroup);

  // Early Sprout Phase (when progress < 0.12 and not completed)
  if (progress < 0.12 && !isCompleted) {
    buildDetailedSprout(treeGroup);
    return;
  }

  switch (speciesId) {
    case 'pine':
      buildDetailedPine(treeGroup, foliageGroup, progress);
      break;
    case 'sakura':
      buildDetailedSakura(treeGroup, foliageGroup, progress);
      break;
    case 'ginkgo':
      buildDetailedGinkgo(treeGroup, foliageGroup, progress);
      break;
    case 'oak':
    default:
      buildDetailedOak(treeGroup, foliageGroup, progress);
      break;
  }
}

// 1. Sprout (0.0 - 0.12 progress)
function buildDetailedSprout(group: THREE.Group) {
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.4 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xa3e635, roughness: 0.3 });

  // Curved Stem
  const stemGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.45, 10);
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 0.22;
  stem.rotation.z = -0.08;
  stem.castShadow = true;
  group.add(stem);

  // Unfolding Twin Leaves
  const leafGeo = new THREE.SphereGeometry(0.14, 12, 12);
  leafGeo.scale(1.6, 0.25, 0.9);

  const leaf1 = new THREE.Mesh(leafGeo, leafMat);
  leaf1.position.set(0.1, 0.42, 0);
  leaf1.rotation.z = -0.4;
  leaf1.castShadow = true;
  group.add(leaf1);

  const leaf2 = new THREE.Mesh(leafGeo, leafMat);
  leaf2.position.set(-0.1, 0.42, 0);
  leaf2.rotation.z = 0.4;
  leaf2.castShadow = true;
  group.add(leaf2);
}

// Helper: Curved Trunk Segment
function createCurvedTrunk(
  radiusBottom: number,
  radiusTop: number,
  height: number,
  color: number,
  bendAngleX = 0,
  bendAngleZ = 0
) {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 12);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.rotation.x = bendAngleX;
  mesh.rotation.z = bendAngleZ;
  return mesh;
}

// 2. Oak Tree (橡树 - Organic Forked Branches & Multi-tone Foliage)
function buildDetailedOak(treeGroup: THREE.Group, foliageGroup: THREE.Group, progress: number) {
  const barkColor = 0x412d22;

  // Base Trunk
  const lowerTrunk = createCurvedTrunk(0.32, 0.24, 1.2, barkColor, 0.03, -0.05);
  lowerTrunk.position.y = 0.6;
  treeGroup.add(lowerTrunk);

  // Left Fork Branch
  const leftBranch = createCurvedTrunk(0.2, 0.12, 0.9, barkColor, 0.1, -0.35);
  leftBranch.position.set(-0.2, 1.3, 0.05);
  treeGroup.add(leftBranch);

  // Right Fork Branch
  const rightBranch = createCurvedTrunk(0.2, 0.12, 0.85, barkColor, -0.1, 0.32);
  rightBranch.position.set(0.22, 1.25, -0.05);
  treeGroup.add(rightBranch);

  // Foliage Multi-Tone Clusters
  const leafMatDark = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.75, flatShading: true });
  const leafMatMid = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.65, flatShading: true });
  const leafMatBright = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.6, flatShading: true });

  const clusters = [
    { pos: [0, 2.3, 0], r: 0.9, mat: leafMatMid },
    { pos: [-0.65, 2.0, 0.3], r: 0.72, mat: leafMatDark },
    { pos: [0.65, 1.95, -0.2], r: 0.75, mat: leafMatMid },
    { pos: [-0.3, 2.5, -0.3], r: 0.68, mat: leafMatBright },
    { pos: [0.35, 2.6, 0.25], r: 0.7, mat: leafMatBright },
    { pos: [0, 2.85, 0], r: 0.55, mat: leafMatBright },
  ];

  clusters.forEach(c => {
    const geo = new THREE.DodecahedronGeometry(c.r, 1);
    const mesh = new THREE.Mesh(geo, c.mat);
    mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
    mesh.castShadow = true;
    foliageGroup.add(mesh);
  });
}

// 3. Sakura Tree (樱花 - Delicate Branched Pink Blossom Canopy & Dropping Petals)
function buildDetailedSakura(treeGroup: THREE.Group, foliageGroup: THREE.Group, progress: number) {
  const barkColor = 0x3b2318;

  // Gracefully Curved Trunk
  const trunk = createCurvedTrunk(0.28, 0.18, 1.4, barkColor, 0.05, -0.12);
  trunk.position.y = 0.7;
  treeGroup.add(trunk);

  // Sub Branches
  const b1 = createCurvedTrunk(0.15, 0.08, 0.85, barkColor, 0.25, -0.4);
  b1.position.set(-0.25, 1.35, 0.1);
  treeGroup.add(b1);

  const b2 = createCurvedTrunk(0.14, 0.07, 0.8, barkColor, -0.2, 0.38);
  b2.position.set(0.25, 1.3, -0.1);
  treeGroup.add(b2);

  // Soft Pink Blossom Cloud Layers
  const pinkDeep = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.6, flatShading: true });
  const pinkMid = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5, flatShading: true });
  const pinkLight = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.45, flatShading: true });

  const clusters = [
    { pos: [0, 2.3, 0], r: 0.88, mat: pinkMid },
    { pos: [-0.6, 2.0, 0.35], r: 0.68, mat: pinkDeep },
    { pos: [0.65, 2.0, -0.25], r: 0.72, mat: pinkMid },
    { pos: [-0.2, 2.55, -0.2], r: 0.65, mat: pinkLight },
    { pos: [0.35, 2.65, 0.2], r: 0.62, mat: pinkLight },
    { pos: [0, 2.9, 0], r: 0.5, mat: pinkLight },
  ];

  clusters.forEach(c => {
    const geo = new THREE.IcosahedronGeometry(c.r, 1);
    const mesh = new THREE.Mesh(geo, c.mat);
    mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
    mesh.castShadow = true;
    foliageGroup.add(mesh);
  });
}

// 4. Pine Tree (松树 - Multi-tiered Needle Cones)
function buildDetailedPine(treeGroup: THREE.Group, foliageGroup: THREE.Group, progress: number) {
  const barkColor = 0x382219;

  const trunk = createCurvedTrunk(0.22, 0.12, 2.2, barkColor, 0, 0);
  trunk.position.y = 1.1;
  treeGroup.add(trunk);

  const pineMatDark = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.8, flatShading: true });
  const pineMatMid = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.75, flatShading: true });
  const pineMatLight = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.7, flatShading: true });

  const tiers = [
    { r: 1.15, h: 0.9, y: 1.3, mat: pineMatDark },
    { r: 0.95, h: 0.85, y: 1.85, mat: pineMatDark },
    { r: 0.72, h: 0.75, y: 2.35, mat: pineMatMid },
    { r: 0.48, h: 0.65, y: 2.78, mat: pineMatLight },
    { r: 0.25, h: 0.45, y: 3.12, mat: pineMatLight },
  ];

  tiers.forEach(tier => {
    const geo = new THREE.ConeGeometry(tier.r, tier.h, 10);
    const mesh = new THREE.Mesh(geo, tier.mat);
    mesh.position.y = tier.y;
    mesh.castShadow = true;
    foliageGroup.add(mesh);
  });
}

// 5. Ginkgo Tree (银杏 - Golden Fan Foliage Clusters)
function buildDetailedGinkgo(treeGroup: THREE.Group, foliageGroup: THREE.Group, progress: number) {
  const barkColor = 0x4a3728;

  const trunk = createCurvedTrunk(0.26, 0.16, 1.5, barkColor, 0.02, -0.08);
  trunk.position.y = 0.75;
  treeGroup.add(trunk);

  const b1 = createCurvedTrunk(0.14, 0.07, 0.8, barkColor, 0.2, -0.35);
  b1.position.set(-0.2, 1.3, 0.05);
  treeGroup.add(b1);

  const goldAmber = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6, flatShading: true });
  const goldBright = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, flatShading: true });
  const goldYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45, flatShading: true });

  const clusters = [
    { pos: [0, 2.3, 0], r: 0.88, mat: goldBright },
    { pos: [-0.6, 2.0, 0.3], r: 0.68, mat: goldAmber },
    { pos: [0.6, 2.0, -0.2], r: 0.7, mat: goldBright },
    { pos: [-0.25, 2.6, -0.2], r: 0.62, mat: goldYellow },
    { pos: [0.3, 2.65, 0.2], r: 0.6, mat: goldYellow },
  ];

  clusters.forEach(c => {
    const geo = new THREE.DodecahedronGeometry(c.r, 1);
    const mesh = new THREE.Mesh(geo, c.mat);
    mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
    mesh.castShadow = true;
    foliageGroup.add(mesh);
  });
}

// 6. Baobab Tree (猴面包树 - Swollen Textured Trunk & Wide Crown)
function buildDetailedBaobab(treeGroup: THREE.Group, foliageGroup: THREE.Group, progress: number) {
  const barkColor = 0x6e5039;

  // Swollen Trunk
  const trunk = createCurvedTrunk(0.75, 0.52, 1.8, barkColor, 0, 0);
  trunk.position.y = 0.9;
  treeGroup.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.7, flatShading: true });
  const leafMatTip = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.6, flatShading: true });

  const crowns = [
    { pos: [0, 2.1, 0], r: 0.85, mat: leafMat },
    { pos: [-0.55, 2.15, 0.3], r: 0.6, mat: leafMatTip },
    { pos: [0.55, 2.15, -0.3], r: 0.6, mat: leafMatTip },
    { pos: [0, 2.35, 0], r: 0.65, mat: leafMatTip },
  ];

  crowns.forEach(c => {
    const geo = new THREE.IcosahedronGeometry(c.r, 1);
    geo.scale(1.3, 0.55, 1.3);
    const mesh = new THREE.Mesh(geo, c.mat);
    mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
    mesh.castShadow = true;
    foliageGroup.add(mesh);
  });
}

// 7. Bamboo Grove (翠竹 - Multi-stem Jointed Bamboo Stalks)
function buildDetailedBamboo(treeGroup: THREE.Group, foliageGroup: THREE.Group, progress: number) {
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.35 });
  const jointMat = new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.3 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5, flatShading: true });

  const stalks = [
    { x: -0.28, z: 0.05, h: 2.3, r: 0.075 },
    { x: 0.12, z: -0.15, h: 2.65, r: 0.085 },
    { x: 0.32, z: 0.22, h: 2.1, r: 0.065 },
  ];

  stalks.forEach(s => {
    const stalkGeo = new THREE.CylinderGeometry(s.r, s.r * 1.2, s.h, 10);
    const stalk = new THREE.Mesh(stalkGeo, bambooMat);
    stalk.position.set(s.x, s.h / 2, s.z);
    stalk.castShadow = true;
    treeGroup.add(stalk);

    for (let n = 1; n < 4; n++) {
      const nodeGeo = new THREE.TorusGeometry(s.r * 1.18, 0.02, 8, 12);
      const node = new THREE.Mesh(nodeGeo, jointMat);
      node.rotation.x = Math.PI / 2;
      node.position.set(s.x, (s.h / 4) * n, s.z);
      treeGroup.add(node);
    }

    const leafCluster = new THREE.ConeGeometry(0.38, 0.85, 6);
    const leafMesh = new THREE.Mesh(leafCluster, leafMat);
    leafMesh.position.set(s.x, s.h + 0.2, s.z);
    foliageGroup.add(leafMesh);
  });
}

// 8. Golden Tree (黄金神木 - Metallic Gold Trunk & Radiant Glowing Leaves)
function buildDetailedGoldenTree(treeGroup: THREE.Group, foliageGroup: THREE.Group, progress: number) {
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.85,
    roughness: 0.2,
  });

  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.32, 1.6, 12);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  treeGroup.add(trunk);

  const goldLeaf1 = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.7,
    roughness: 0.2,
    flatShading: true,
  });

  const goldLeaf2 = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    metalness: 0.9,
    roughness: 0.15,
    flatShading: true,
  });

  const clusters = [
    { pos: [0, 2.3, 0], r: 0.88, mat: goldLeaf1 },
    { pos: [-0.55, 2.0, 0.3], r: 0.68, mat: goldLeaf2 },
    { pos: [0.55, 2.0, -0.25], r: 0.72, mat: goldLeaf1 },
    { pos: [0, 2.7, 0], r: 0.62, mat: goldLeaf2 },
  ];

  clusters.forEach(c => {
    const geo = new THREE.IcosahedronGeometry(c.r, 1);
    const mesh = new THREE.Mesh(geo, c.mat);
    mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
    mesh.castShadow = true;
    foliageGroup.add(mesh);
  });
}

// Particle System
function createDetailedParticles(speciesId: TreeSpeciesId): THREE.Points | null {
  const count = speciesId === 'sakura' || speciesId === 'ginkgo' ? 40 : 22;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 2.8;
    positions[i * 3 + 1] = Math.random() * 2.6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2.8;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  let color = 0x86efac;
  if (speciesId === 'sakura') color = 0xf472b6;
  if (speciesId === 'ginkgo') color = 0xfbbf24;

  const material = new THREE.PointsMaterial({
    color,
    size: 0.07,
    transparent: true,
    opacity: 0.85,
  });

  return new THREE.Points(geometry, material);
}

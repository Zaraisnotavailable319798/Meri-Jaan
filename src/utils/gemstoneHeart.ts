import * as THREE from 'three';

export interface GemstoneHeartObject {
  heartGroup: THREE.Group;
  mesh: THREE.Mesh;
  innerCore: THREE.Mesh;
  facetLines: THREE.LineSegments;
  sparkleFlares: THREE.Group;
  hitTarget: THREE.Mesh;
}

/**
 * Creates a Heart-Cut Diamond & Gemstone:
 * - Brilliant cut gemstone faceting: table, star facets, kite crown facets, girdle, and pavilion
 * - Ruby red and pink diamond/sapphire color combination:
 *   Deep ruby at tip & base, blending to fiery magenta-rose, warm coral-pink, and sweet pink diamond on the upper crown
 * - Optical diamond & gemstone material with clearcoat, refractive transmission (IOR ~2.3), and flatShading
 * - Crisp facet edge glints and sparkling diamond flares
 * - Inner gemstone core radiating warm fiery light through the diamond facets
 */
export function createGemstoneHeart(): GemstoneHeartObject {
  const heartGroup = new THREE.Group();

  // Color palette: Rich rough mineral color blending Red + Pink + a very slight kiss of Yellow
  const deepCarmineRed = new THREE.Color('#9c0c26');   // Deep mineral red at tip & pavilion
  const vibrantCrimson = new THREE.Color('#cb1838');   // Rich earthy crimson
  const warmCoralRed = new THREE.Color('#e12a4c');     // Warm coral red transition
  const rosePetalPink = new THREE.Color('#f0436d');    // Vibrant rose pink
  const blushPink = new THREE.Color('#f8648c');        // Mid to upper body pink
  const softCarnationPink = new THREE.Color('#f98fae'); // Upper lobe delicate pink
  const subtleSunlitYellow = new THREE.Color('#fcd34d'); // Very gentle warm yellow kiss (slight)

  // Heart profile function: gives clean, balanced, cute heart silhouette
  function getHeartPoint(t: number) {
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);

    // Cute chubby width
    const x = 1.15 * Math.pow(sinT, 3);

    // Heart curve with gentle cleft at top and cute tapered tip
    const y =
      (13.2 * cosT - 4.8 * Math.cos(2 * t) - 1.8 * Math.cos(3 * t) - 0.9 * Math.cos(4 * t)) / 16 +
      0.15;

    return { x, y };
  }

  // Number of perimeter angular steps for facets
  // 24 segments around the perimeter gives 24-fold diamond symmetry (classic fancy cut gem)
  const N_SEGS = 24;

  // We will build concentric rings from the front table to the back culet:
  // Ring 0: Table center point (front apex)
  // Ring 1: Table perimeter (small inner heart at z = 0.42, scale = 0.36)
  // Ring 2: Crown star/kite ring (mid heart at z = 0.32, scale = 0.68)
  // Ring 3: Upper girdle ring (near perimeter at z = 0.16, scale = 0.92)
  // Ring 4: Girdle rim (widest outer perimeter at z = 0.0, scale = 1.0)
  // Ring 5: Lower girdle ring (back near perimeter at z = -0.16, scale = 0.88)
  // Ring 6: Mid pavilion ring (back taper at z = -0.34, scale = 0.58)
  // Ring 7: Lower pavilion ring (back steep taper at z = -0.48, scale = 0.28)
  // Ring 8: Culet point (back apex at z = -0.58, scale = 0.0)

  interface RingConfig {
    z: number;
    scale: number;
    yOffset: number;
  }

  const ringsConfig: RingConfig[] = [
    { z: 0.44, scale: 0.34, yOffset: 0.18 },  // Ring 0: Inner Table
    { z: 0.35, scale: 0.65, yOffset: 0.16 },  // Ring 1: Crown mid-ring
    { z: 0.18, scale: 0.90, yOffset: 0.15 },  // Ring 2: Crown upper-girdle
    { z: 0.00, scale: 1.00, yOffset: 0.14 },  // Ring 3: Girdle (widest edge)
    { z: -0.16, scale: 0.88, yOffset: 0.14 }, // Ring 4: Lower girdle
    { z: -0.34, scale: 0.60, yOffset: 0.14 }, // Ring 5: Mid pavilion
    { z: -0.48, scale: 0.30, yOffset: 0.15 }, // Ring 6: Lower pavilion
  ];

  // Table center point
  const tableCenter = new THREE.Vector3(0, 0.22, 0.48);
  // Culet back point
  const culetPoint = new THREE.Vector3(0, 0.14, -0.58);

  // Precompute vertices for all rings
  const ringVertices: THREE.Vector3[][] = [];

  ringsConfig.forEach((cfg) => {
    const ring: THREE.Vector3[] = [];
    for (let i = 0; i < N_SEGS; i++) {
      const angle = (i / N_SEGS) * Math.PI * 2;
      const { x, y } = getHeartPoint(angle);

      // Scaled and positioned ring vertex
      const vx = x * cfg.scale;
      const vy = cfg.yOffset + (y - 0.15) * cfg.scale;
      const vz = cfg.z;

      ring.push(new THREE.Vector3(vx, vy, vz));
    }
    ringVertices.push(ring);
  });

  // Helper to get rough mineral color blending rich red, pink, and subtle sunny yellow
  function getGemstoneColor(v: THREE.Vector3): THREE.Color {
    // Height factor: bottom tip ~ -0.8, top lobes ~ 1.0
    const hFactor = Math.max(0, Math.min(1, (v.y + 0.75) / 1.6));

    // Subtle natural organic mineral variation per facet
    const organicNoise = Math.sin(v.x * 8.2 + v.y * 10.4 + v.z * 7.1) * 0.5 + 0.5;

    const c = new THREE.Color();
    if (hFactor < 0.28) {
      // Deep crimson-red at tip & lower pavilion
      c.copy(deepCarmineRed).lerp(vibrantCrimson, hFactor / 0.28);
    } else if (hFactor < 0.52) {
      // Vibrant crimson into warm coral red
      c.copy(vibrantCrimson).lerp(warmCoralRed, (hFactor - 0.28) / 0.24);
    } else if (hFactor < 0.76) {
      // Rose petal pink into blush pink
      c.copy(rosePetalPink).lerp(blushPink, (hFactor - 0.52) / 0.24);
    } else {
      // Soft carnation pink on upper lobes
      c.copy(blushPink).lerp(softCarnationPink, (hFactor - 0.76) / 0.24);
    }

    // Blend in very slight sunlit yellow kiss (subtle, delicate, not overdone)
    if (v.z > 0.32 && v.y > 0.05) {
      const slightYellow = Math.min(0.12, ((v.z - 0.32) / 0.16) * 0.12);
      c.lerp(subtleSunlitYellow, slightYellow);
    }

    return c;
  }

  // Arrays for non-indexed flat-shaded triangular facets
  const positions: number[] = [];
  const colors: number[] = [];

  function addFacet(v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3) {
    positions.push(v1.x, v1.y, v1.z);
    positions.push(v2.x, v2.y, v2.z);
    positions.push(v3.x, v3.y, v3.z);

    // Compute facet center for consistent gemstone coloring across each individual face
    const center = new THREE.Vector3()
      .add(v1)
      .add(v2)
      .add(v3)
      .multiplyScalar(1 / 3);
    const col = getGemstoneColor(center);

    // Add colors for each vertex of this facet
    colors.push(col.r, col.g, col.b);
    colors.push(col.r, col.g, col.b);
    colors.push(col.r, col.g, col.b);
  }

  // 1. Table center fan (Ring 0 to tableCenter)
  const ring0 = ringVertices[0];
  for (let i = 0; i < N_SEGS; i++) {
    const next = (i + 1) % N_SEGS;
    addFacet(tableCenter, ring0[i], ring0[next]);
  }

  // 2. Inter-ring faceted bands (Ring 0 to Ring 6)
  // Each quad is split into 2 crisp triangular diamond facets
  for (let r = 0; r < ringVertices.length - 1; r++) {
    const currRing = ringVertices[r];
    const nextRing = ringVertices[r + 1];

    for (let i = 0; i < N_SEGS; i++) {
      const nextI = (i + 1) % N_SEGS;

      const p00 = currRing[i];
      const p10 = nextRing[i];
      const p01 = currRing[nextI];
      const p11 = nextRing[nextI];

      // Alternate diagonal cut to simulate brilliant cut kite facets
      if (i % 2 === 0) {
        addFacet(p00, p10, p11);
        addFacet(p00, p11, p01);
      } else {
        addFacet(p00, p10, p01);
        addFacet(p01, p10, p11);
      }
    }
  }

  // 3. Pavilion culet fan (Last ring to culetPoint)
  const lastRing = ringVertices[ringVertices.length - 1];
  for (let i = 0; i < N_SEGS; i++) {
    const next = (i + 1) % N_SEGS;
    addFacet(culetPoint, lastRing[next], lastRing[i]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  // Rough Matte Mineral / Crystal Physical Material:
  // - High roughness (0.60) for natural, tactile, non-polished rough matte mineral finish
  // - Clearcoat removed (0.0) so it does not look like slick glass or polished lacquer
  // - Transmission set to 0.0 for rich opaque stone body
  // - flatShading: true so each faceted geometric plane diffuses light as a raw cut surface
  const gemMaterial = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.60, // Natural rough matte finish
    metalness: 0.06,
    clearcoat: 0.0, // No polished clearcoat
    clearcoatRoughness: 0.8,
    transmission: 0.0, // Solid rough body
    ior: 1.62,
    specularIntensity: 0.55, // Gentle diffuse rough sheen
    specularColor: new THREE.Color('#fff2f5'), // Delicate rose-white sheen
    flatShading: true, // Distinct flat rough facets
  });

  const mesh = new THREE.Mesh(geometry, gemMaterial);
  heartGroup.add(mesh);

  // --- SUBTLE ROSE-GOLD FACET EDGE LINES ---
  // Outlines the facets so each cut surface has a delicate, soft rose-gold definition
  const edgesGeometry = new THREE.EdgesGeometry(geometry, 12);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color('#fecdd3'), // Soft delicate rose-gold accent
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const facetLines = new THREE.LineSegments(edgesGeometry, edgeMaterial);
  heartGroup.add(facetLines);

  // --- INNER GEMSTONE CORE ---
  // Sits inside the heart and radiates rich warm romantic ruby-rose glow
  const coreScale = 0.74;
  const coreGeom = geometry.clone();
  coreGeom.scale(coreScale, coreScale, coreScale);

  const coreMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d91b42'),
    emissive: new THREE.Color('#ff1a53'), // Warm romantic ruby-rose glow
    emissiveIntensity: 0.72,
    roughness: 0.65,
    metalness: 0.08,
    flatShading: true,
  });
  const innerCore = new THREE.Mesh(coreGeom, coreMaterial);
  heartGroup.add(innerCore);

  // --- DIAMOND SPARKLE FLARES (Prismatic 4-point cross star glints) ---
  const sparkleFlares = new THREE.Group();

  const flareCanvas = document.createElement('canvas');
  flareCanvas.width = 128;
  flareCanvas.height = 128;
  const fCtx = flareCanvas.getContext('2d')!;

  // Draw 4-point star cross with diamond white and soft rose halo
  fCtx.clearRect(0, 0, 128, 128);
  const fGrad = fCtx.createRadialGradient(64, 64, 2, 64, 64, 48);
  fGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  fGrad.addColorStop(0.25, 'rgba(255, 242, 246, 0.9)'); // Delicate soft blush
  fGrad.addColorStop(0.65, 'rgba(251, 113, 133, 0.35)'); // Soft pink
  fGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  fCtx.fillStyle = fGrad;
  fCtx.beginPath();
  fCtx.arc(64, 64, 48, 0, Math.PI * 2);
  fCtx.fill();

  // Long diamond needle rays
  fCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  // Vertical ray
  fCtx.beginPath();
  fCtx.moveTo(64, 4);
  fCtx.quadraticCurveTo(64, 64, 68, 64);
  fCtx.quadraticCurveTo(64, 64, 64, 124);
  fCtx.quadraticCurveTo(64, 64, 60, 64);
  fCtx.quadraticCurveTo(64, 64, 64, 4);
  fCtx.fill();
  // Horizontal ray
  fCtx.beginPath();
  fCtx.moveTo(4, 64);
  fCtx.quadraticCurveTo(64, 64, 64, 68);
  fCtx.quadraticCurveTo(64, 64, 124, 64);
  fCtx.quadraticCurveTo(64, 64, 64, 60);
  fCtx.quadraticCurveTo(64, 64, 4, 64);
  fCtx.fill();

  const flareTexture = new THREE.CanvasTexture(flareCanvas);

  const flareMat = new THREE.MeshBasicMaterial({
    map: flareTexture,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // Place 4 diamond flares on prominent crown facet junctions
  const flarePositions = [
    new THREE.Vector3(-0.38, 0.58, 0.36), // Left lobe crown
    new THREE.Vector3(0.36, 0.60, 0.36),  // Right lobe crown
    new THREE.Vector3(-0.02, 0.26, 0.49), // Table center
    new THREE.Vector3(-0.46, 0.22, 0.24), // Left upper girdle
  ];

  flarePositions.forEach((pos, idx) => {
    const size = idx === 0 ? 0.32 : idx === 2 ? 0.26 : 0.22;
    const flareMesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), flareMat.clone());
    flareMesh.position.copy(pos);
    flareMesh.userData = {
      baseScale: 1.0,
      phase: idx * 1.6,
      speed: 1.8 + idx * 0.4,
    };
    sparkleFlares.add(flareMesh);
  });

  heartGroup.add(sparkleFlares);

  // Invisible hit target for smooth mobile touch
  const hitGeom = new THREE.SphereGeometry(1.28, 12, 12);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitTarget = new THREE.Mesh(hitGeom, hitMat);
  hitTarget.position.set(0, 0.14, 0);
  heartGroup.add(hitTarget);

  // Slight elegant jewelry display tilt
  heartGroup.rotation.set(0.04, -0.04, 0.03);

  return {
    heartGroup,
    mesh,
    innerCore,
    facetLines,
    sparkleFlares,
    hitTarget,
  };
}

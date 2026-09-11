import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createGemstoneHeart } from '../utils/gemstoneHeart';
import { triggerHeartbeatHaptic } from '../utils/haptics';

interface HeartCanvasProps {
  onHeartTap: () => void;
}

export const HeartCanvas: React.FC<HeartCanvasProps> = ({ onHeartTap }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    // Soft, fluid ethereal night-sky fog
    scene.fog = new THREE.FogExp2('#200c28', 0.022);

    const camera = new THREE.PerspectiveCamera(
      38, // Cinematic FOV for natural 3D depth without fish-eye distortion
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    camera.position.set(0, 0, 5.0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true, // Transparent so background gradient & soft radial glow shine through
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    container.appendChild(renderer.domElement);

    // --- MINERAL & GEMSTONE SCINTILLATION LIGHTING ---
    // 1. Key light: crisp soft sunlight revealing rough facets
    const keyLight = new THREE.DirectionalLight('#ffffff', 2.4);
    keyLight.position.set(2.4, 3.2, 3.4);
    scene.add(keyLight);

    // 2. Fill light: vibrant rose-pink fill
    const fillLight = new THREE.DirectionalLight('#ff557e', 1.5);
    fillLight.position.set(-2.4, -1.2, 2.2);
    scene.add(fillLight);

    // 3. Rim light: pale rose-white rim accentuating rough cut ridges
    const rimLight = new THREE.DirectionalLight('#ffe4ee', 2.0);
    rimLight.position.set(0, 2.5, -3.2);
    scene.add(rimLight);

    // 4. Ambient light: deep warm romantic wine-red tone
    const ambientLight = new THREE.AmbientLight('#401222', 1.3);
    scene.add(ambientLight);

    // 5. Internal glowing ruby point light
    const pulseLight = new THREE.PointLight('#ff2d55', 1.5, 5.5, 1.5);
    pulseLight.position.set(0, 0.22, 0.4);
    scene.add(pulseLight);

    // 6. Secondary soft rose bounce light
    const bounceLight = new THREE.PointLight('#ffaec2', 0.85, 4.0, 1.8);
    bounceLight.position.set(0, -0.6, 0.35);
    scene.add(bounceLight);

    // --- CREATE DIAMOND & GEMSTONE HEART ---
    const { heartGroup, mesh, innerCore, facetLines, sparkleFlares, hitTarget } = createGemstoneHeart();

    // Viewport positioning:
    // Placed in upper-middle area, large and fully visible without overlapping quote
    const isMobile = container.clientWidth < 640;
    const basePosY = isMobile ? 0.42 : 0.38;
    const baseScale = isMobile ? 0.58 : 0.62;

    heartGroup.position.set(0, basePosY, 0);
    heartGroup.scale.set(baseScale, baseScale, baseScale);
    scene.add(heartGroup);

    // --- CUTE ANIME STAR SPARKLE TEXTURE ---
    const sparkleCanvas = document.createElement('canvas');
    sparkleCanvas.width = 64;
    sparkleCanvas.height = 64;
    const sCtx = sparkleCanvas.getContext('2d')!;

    // 4-point anime star sparkle with soft glowing center
    sCtx.clearRect(0, 0, 64, 64);
    const sGrad = sCtx.createRadialGradient(32, 32, 1, 32, 32, 28);
    sGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    sGrad.addColorStop(0.3, 'rgba(255, 220, 235, 0.85)');
    sGrad.addColorStop(0.7, 'rgba(255, 160, 190, 0.3)');
    sGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    sCtx.fillStyle = sGrad;

    // Draw central glow
    sCtx.beginPath();
    sCtx.arc(32, 32, 28, 0, Math.PI * 2);
    sCtx.fill();

    // 4-point anime sparkle rays
    sCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    sCtx.beginPath();
    sCtx.moveTo(32, 4);
    sCtx.quadraticCurveTo(32, 32, 60, 32);
    sCtx.quadraticCurveTo(32, 32, 32, 60);
    sCtx.quadraticCurveTo(32, 32, 4, 32);
    sCtx.quadraticCurveTo(32, 32, 32, 4);
    sCtx.fill();

    const sparkleTexture = new THREE.CanvasTexture(sparkleCanvas);

    // --- AMBIENT PARTICLES (Dreamy high-density slow-motion sparkles) ---
    const sparkleCount = 72;
    const sparkleGeom = new THREE.BufferGeometry();
    const sparklePositions = new Float32Array(sparkleCount * 3);
    const sparkleColors = new Float32Array(sparkleCount * 3);
    const sparkleData: {
      x: number;
      y: number;
      z: number;
      freqX: number;
      freqY: number;
      freqZ: number;
      ampX: number;
      ampY: number;
      ampZ: number;
      phaseX: number;
      phaseY: number;
      phaseZ: number;
      riseSpeed: number;
      twinkleFreq: number;
      color: THREE.Color;
    }[] = [];

    // Sparkle color palette: stardust white, pale blush pink, champagne rose, and petal pink
    const sparklePalette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#ffe4ed'),
      new THREE.Color('#ffd1df'),
      new THREE.Color('#fff0f6'),
      new THREE.Color('#fff6eb'), // Microscopic soft warm champagne gleam
    ];

    for (let i = 0; i < sparkleCount; i++) {
      let x = (Math.random() - 0.5) * 4.2;
      let y = basePosY + (Math.random() - 0.5) * 3.6;
      let z = (Math.random() - 0.5) * 2.4;

      // Radial clearance: ensure particles do not obscure the central front face of the heart
      const distFromHeartCenter = Math.hypot(x, y - basePosY);
      if (distFromHeartCenter < 0.88 && z > -0.15) {
        if (Math.random() > 0.5) {
          // Push outward radially to frame the heart in a magical aura
          const angle = Math.atan2(y - basePosY, x);
          const newDist = 0.95 + Math.random() * 0.7;
          x = Math.cos(angle) * newDist;
          y = basePosY + Math.sin(angle) * newDist;
        } else {
          // Push behind the heart into the dreamy background depth
          z = -0.4 - Math.random() * 0.9;
        }
      }

      sparklePositions[i * 3] = x;
      sparklePositions[i * 3 + 1] = y;
      sparklePositions[i * 3 + 2] = z;

      const baseColor = sparklePalette[i % sparklePalette.length].clone();
      sparkleColors[i * 3] = baseColor.r;
      sparkleColors[i * 3 + 1] = baseColor.g;
      sparkleColors[i * 3 + 2] = baseColor.b;

      sparkleData.push({
        x,
        y,
        z,
        freqX: 0.22 + Math.random() * 0.32,
        freqY: 0.18 + Math.random() * 0.28,
        freqZ: 0.15 + Math.random() * 0.25,
        ampX: 0.07 + Math.random() * 0.12,
        ampY: 0.05 + Math.random() * 0.09,
        ampZ: 0.04 + Math.random() * 0.08,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
        riseSpeed: 0.015 + Math.random() * 0.035, // Slow-motion gentle upward drift
        twinkleFreq: 0.75 + Math.random() * 1.35,  // Slow dreamy shimmer frequency
        color: baseColor,
      });
    }

    sparkleGeom.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
    sparkleGeom.setAttribute('color', new THREE.BufferAttribute(sparkleColors, 3));
    const sparkleMat = new THREE.PointsMaterial({
      size: 0.068,
      map: sparkleTexture,
      transparent: true,
      opacity: 0.72,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sparklePoints = new THREE.Points(sparkleGeom, sparkleMat);
    scene.add(sparklePoints);

    // --- BURST PARTICLES (On Tap: cute anime sparkle pop) ---
    const burstCount = 20;
    const burstGeom = new THREE.BufferGeometry();
    const burstPositions = new Float32Array(burstCount * 3);
    const burstVelocities: { x: number; y: number; z: number; life: number }[] = [];

    for (let i = 0; i < burstCount; i++) {
      burstPositions[i * 3] = 0;
      burstPositions[i * 3 + 1] = basePosY;
      burstPositions[i * 3 + 2] = 0;
      burstVelocities.push({ x: 0, y: 0, z: 0, life: 0 });
    }

    burstGeom.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
    const burstMat = new THREE.PointsMaterial({
      size: 0.088,
      map: sparkleTexture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const burstParticles = new THREE.Points(burstGeom, burstMat);
    scene.add(burstParticles);

    function triggerBurst() {
      const bPos = burstGeom.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < burstCount; i++) {
        bPos.setXYZ(i, 0, basePosY + 0.08, 0.15);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 0.022 + Math.random() * 0.038;

        burstVelocities[i] = {
          x: Math.sin(phi) * Math.cos(theta) * speed,
          y: Math.sin(phi) * Math.sin(theta) * speed + 0.008,
          z: Math.cos(phi) * speed * 0.65,
          life: 1.0,
        };
      }
      burstMat.opacity = 0.95;
      bPos.needsUpdate = true;
    }

    // --- TAP STATE MACHINE ---
    let tapProgress = -1; // -1 = inactive, 0 to 1 = active
    let pausedFloatY = 0;

    function handleInteraction() {
      if (tapProgress >= 0) return;
      tapProgress = 0;
      pausedFloatY = lastFloatY;
      triggerBurst();

      // Physical reinforcement: trigger subtle physiological lub-dub heartbeat vibration
      triggerHeartbeatHaptic();

      onHeartTap();
    }

    triggerRef.current = handleInteraction;

    // Raycasting for direct heart tapping
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onPointerDown(e: MouseEvent | TouchEvent | PointerEvent) {
      const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects([mesh, hitTarget], false);

      if (intersects.length > 0) {
        handleInteraction();
      }
    }

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    domElem.addEventListener('click', onPointerDown);
    domElem.addEventListener('touchstart', onPointerDown, { passive: true });

    // --- SUBTLE MOUSE-MOVE & DEVICE-ORIENTATION TILT EFFECT ---
    let targetTiltX = 0; // Pitch (leaning forward/backward)
    let targetTiltY = 0; // Yaw (leaning left/right)
    let currentTiltX = 0;
    let currentTiltY = 0;

    function handlePointerMove(clientX: number, clientY: number) {
      const rect = domElem.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.36; // Center on heart position

      const normX = Math.max(-1, Math.min(1, (clientX - centerX) / (rect.width * 0.5)));
      const normY = Math.max(-1, Math.min(1, (clientY - centerY) / (rect.height * 0.4)));

      // Subtle responsive angles: leans in the direction of the interaction
      targetTiltY = normX * 0.22; // ~12.5 deg yaw
      targetTiltX = -normY * 0.16; // ~9 deg pitch (tilts up when cursor is above)
    }

    function onPointerMove(e: PointerEvent | MouseEvent) {
      handlePointerMove(e.clientX, e.clientY);
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }

    function onPointerLeave() {
      targetTiltX = 0;
      targetTiltY = 0;
    }

    function onDeviceOrientation(e: DeviceOrientationEvent) {
      if (e.gamma !== null && e.beta !== null) {
        // gamma: left-to-right tilt in degrees [-90, 90]
        const clampedGamma = Math.max(-35, Math.min(35, e.gamma));
        targetTiltY = (clampedGamma / 35) * 0.24;

        // beta: front-to-back tilt in degrees [-180, 180], typical handheld phone is ~45deg
        const clampedBeta = Math.max(15, Math.min(75, e.beta));
        targetTiltX = -((clampedBeta - 45) / 30) * 0.18;
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });

    // --- CUTE SMOOTH NATURAL TWO-STAGE ANIME HEARTBEAT ---
    function getTwoStageHeartbeat(t: number): number {
      if (t < 0.06) return 0;
      if (t < 0.18) {
        const p = (t - 0.06) / 0.12;
        return (1 - Math.cos(p * Math.PI)) * 0.5 * 0.54;
      }
      if (t < 0.28) {
        const p = (t - 0.18) / 0.1;
        return 0.54 - (1 - Math.cos(p * Math.PI)) * 0.5 * (0.54 - 0.15);
      }
      if (t < 0.34) {
        return 0.15;
      }
      if (t < 0.49) {
        const p = (t - 0.34) / 0.15;
        return 0.15 + (1 - Math.cos(p * Math.PI)) * 0.5 * 0.85;
      }
      if (t < 0.67) {
        const p = (t - 0.49) / 0.18;
        return 1.0 - (1 - Math.cos(p * Math.PI)) * 0.5 * 1.0;
      }
      return 0;
    }

    // --- ANIMATION LOOP & BACKGROUND ELEMENTS ---
    const heartRadialGlowElem = document.getElementById('heart-radial-glow');
    const celestialGlowElem = document.getElementById('celestial-lavender-glow');

    let animationFrameId: number;
    const clock = new THREE.Clock();
    let lastFloatY = 0;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsedTime = clock.getElapsedTime();

      // 1. Two-stage cute heartbeat cycle (~1.16s period)
      const beatPeriod = 1.16;
      const cycleT = (elapsedTime % beatPeriod) / beatPeriod;
      let pulse = getTwoStageHeartbeat(cycleT);

      // 2. Slow gentle anime floating motion (4.2s cycle)
      const floatCyclePeriod = 4.2;
      const currentFloatY = Math.sin((elapsedTime / floatCyclePeriod) * Math.PI * 2) * 0.038;
      const currentFloatRotY = -0.04 + Math.sin(elapsedTime * 0.55) * 0.035;
      const currentFloatRotZ = 0.03 + Math.cos(elapsedTime * 0.45) * 0.025;

      // Handle Tap Interaction:
      if (tapProgress >= 0) {
        tapProgress += delta / 0.75;
        if (tapProgress <= 1.0) {
          const tapPulse = Math.sin(tapProgress * Math.PI);
          pulse = tapPulse * 1.35;
          lastFloatY = pausedFloatY;
        } else {
          tapProgress = -1;
          lastFloatY = currentFloatY;
        }
      } else {
        lastFloatY = currentFloatY;
      }

      // --- SUBTLE CAMERA SHAKE & BACKGROUND SCALE PULSE SYNCHRONIZED WITH HEARTBEAT ---
      // Subtle camera shake & micro zoom pulse synchronized with the heartbeat peaks
      const shakePower = Math.pow(pulse, 2.0); // Focused at the sharp thump of each heartbeat
      const shakeX = Math.sin(elapsedTime * 64.0) * shakePower * 0.013;
      const shakeY = Math.cos(elapsedTime * 52.0) * shakePower * 0.010;
      const zoomPulse = pulse * 0.062; // Forward push into screen on every beat
      camera.position.set(shakeX, shakeY, 5.0 - zoomPulse);
      camera.rotation.z = Math.sin(elapsedTime * 46.0) * shakePower * 0.0032;

      // Background scale pulse synchronized with the pumping heart rhythm
      if (heartRadialGlowElem) {
        const glowScale = 1.0 + pulse * 0.048;
        const glowOpacity = 0.85 + pulse * 0.35;
        heartRadialGlowElem.style.transform = `scale(${glowScale})`;
        heartRadialGlowElem.style.opacity = `${Math.min(1.0, glowOpacity)}`;
      }
      if (celestialGlowElem) {
        const celScale = 1.0 + pulse * 0.024;
        celestialGlowElem.style.transform = `scale(${celScale})`;
      }

      // 3. Cute anime bounce with slight organic squash & stretch
      const scaleMultiplier = 1.0 + pulse * 0.052;
      const scaleX = baseScale * (scaleMultiplier + pulse * 0.008);
      const scaleY = baseScale * scaleMultiplier;
      const scaleZ = baseScale * (scaleMultiplier + pulse * 0.012);
      heartGroup.scale.set(scaleX, scaleY, scaleZ);

      // Smooth responsive damping towards tilt target
      const lerpSpeed = 1 - Math.exp(-7.0 * delta);
      currentTiltX += (targetTiltX - currentTiltX) * lerpSpeed;
      currentTiltY += (targetTiltY - currentTiltY) * lerpSpeed;

      // Position & tilt for gemstone brilliance: gently leans in direction of interaction
      heartGroup.position.set(currentTiltY * 0.08, basePosY + lastFloatY + currentTiltX * 0.06, 0);
      heartGroup.rotation.set(
        0.04 + currentTiltX,
        currentFloatRotY + currentTiltY,
        currentFloatRotZ - currentTiltY * 0.22
      );

      // Dynamically shift key light specular glints across diamond facets as the heart tilts
      keyLight.position.set(
        2.4 + currentTiltY * 1.5,
        3.2 - currentTiltX * 1.5,
        3.4
      );

      // Synchronized glowing inner gemstone core
      if (innerCore.material && 'emissiveIntensity' in innerCore.material) {
        (innerCore.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.75 + pulse * 0.6;
      }
      (facetLines.material as THREE.LineBasicMaterial).opacity = 0.32 + pulse * 0.18;

      // Shimmer diamond sparkle flares on facet junctions
      sparkleFlares.children.forEach((child) => {
        const flareMesh = child as THREE.Mesh;
        const ud = flareMesh.userData;
        if (ud) {
          const shimmer = 0.5 + 0.5 * Math.sin(elapsedTime * ud.speed + ud.phase);
          flareMesh.scale.setScalar(0.8 + shimmer * 0.45);
          (flareMesh.material as THREE.MeshBasicMaterial).opacity = 0.35 + shimmer * 0.48;
        }
      });

      // Synchronized warm light glow
      pulseLight.intensity = 1.3 + pulse * 0.8;
      pulseLight.position.set(0, basePosY + lastFloatY + 0.22, 0.4);
      bounceLight.intensity = 0.85 + pulse * 0.45;

      // 4. Ambient slow-motion floating sparkles
      const sPos = sparkleGeom.attributes.position as THREE.BufferAttribute;
      const sCol = sparkleGeom.attributes.color as THREE.BufferAttribute;
      const minY = basePosY - 1.8;
      const maxY = basePosY + 1.8;

      for (let i = 0; i < sparkleCount; i++) {
        const sd = sparkleData[i];

        // Gentle slow-motion upward drift with smooth loop
        sd.y += sd.riseSpeed * delta;
        if (sd.y > maxY) {
          sd.y = minY;
        }

        // Multi-frequency harmonic slow-motion wave drift
        const px = sd.x + Math.sin(elapsedTime * sd.freqX + sd.phaseX) * sd.ampX;
        const py = sd.y + Math.cos(elapsedTime * sd.freqY + sd.phaseY) * sd.ampY;
        const pz = sd.z + Math.sin(elapsedTime * sd.freqZ + sd.phaseZ) * sd.ampZ;
        sPos.setXYZ(i, px, py, pz);

        // Individual slow-motion dreamy twinkle modulated with heartbeat
        const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(elapsedTime * sd.twinkleFreq + sd.phaseX));
        const glowFactor = twinkle * (0.6 + pulse * 0.4);
        sCol.setXYZ(i, sd.color.r * glowFactor, sd.color.g * glowFactor, sd.color.b * glowFactor);
      }
      sPos.needsUpdate = true;
      sCol.needsUpdate = true;
      sparkleMat.opacity = 0.58 + pulse * 0.18;

      // 5. Burst particles on tap
      if (burstMat.opacity > 0.01) {
        const bPos = burstGeom.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < burstCount; i++) {
          const v = burstVelocities[i];
          if (v.life > 0) {
            v.life -= delta / 1.15;
            const curX = bPos.getX(i) + v.x;
            const curY = bPos.getY(i) + v.y;
            const curZ = bPos.getZ(i) + v.z;

            v.x *= 0.95;
            v.y = v.y * 0.95 + 0.0004;
            v.z *= 0.95;

            bPos.setXYZ(i, curX, curY, curZ);
          }
        }
        bPos.needsUpdate = true;
        burstMat.opacity = Math.max(0, burstMat.opacity - delta * 0.75);
      }

      renderer.render(scene, camera);
    }

    animate();

    // --- RESIZE OBSERVER ---
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const mobile = width < 640;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));

      const newBasePosY = mobile ? 0.42 : 0.38;
      const newBaseScale = mobile ? 0.58 : 0.62;
      heartGroup.position.y = newBasePosY;
      heartGroup.scale.set(newBaseScale, newBaseScale, newBaseScale);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domElem.removeEventListener('pointerdown', onPointerDown);
      domElem.removeEventListener('click', onPointerDown);
      domElem.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('deviceorientation', onDeviceOrientation);
      if (heartRadialGlowElem) {
        heartRadialGlowElem.style.transform = '';
        heartRadialGlowElem.style.opacity = '';
      }
      if (celestialGlowElem) {
        celestialGlowElem.style.transform = '';
      }
      renderer.dispose();
      if (domElem.parentNode) {
        domElem.parentNode.removeChild(domElem);
      }
    };
  }, [onHeartTap]);

  return (
    <div
      ref={containerRef}
      id="heart-canvas-container"
      className="absolute inset-0 w-full h-full cursor-pointer touch-none select-none transform-gpu will-change-transform"
    />
  );
};

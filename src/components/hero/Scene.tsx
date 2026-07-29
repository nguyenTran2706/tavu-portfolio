'use client';

import { useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';

const COUNT = 90;

/**
 * The cluster is pushed back along -Z so no parcel can sit between the camera
 * (z = 6) and the near plane. Without this, the outer ring reaches z ≈ +5, one
 * unit from the lens, and those parcels fill the entire viewport.
 */
const CLUSTER_Z = -3;
const RADIUS_MIN = 2.2;
const RADIUS_MAX = 4.6;
const ACCENT = new THREE.Color('#c98500');
const WARM = new THREE.Color('#3a332a');
const DEEP = new THREE.Color('#221e18');

/** Deterministic PRNG, so the cluster is identical on server and client. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Instance {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  spin: number;
  drift: number;
  color: THREE.Color;
  /** Polar coordinates kept alongside the cartesian ones, so scroll can drive
   *  orbit and radial bloom without re-deriving them every frame. */
  angle: number;
  radius: number;
  orbitDir: 1 | -1;
}

/**
 * A drifting cluster of parcels. One InstancedMesh, one material, no shadows —
 * the whole scene is a single draw call.
 */
function Parcels({ scrollRef }: { scrollRef: MutableRefObject<number> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const accent = useRef<THREE.PointLight>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { camera } = useThree();

  const instances = useMemo<Instance[]>(() => {
    const rand = mulberry32(0x7a5206);
    return Array.from({ length: COUNT }, () => {
      const radius = RADIUS_MIN + rand() * (RADIUS_MAX - RADIUS_MIN);
      const angle = rand() * Math.PI * 2;
      const height = (rand() - 0.5) * 4.6;
      // One parcel in six catches the accent; the rest stay near-black so the
      // cluster reads as depth rather than confetti.
      const roll = rand();
      return {
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          height,
          CLUSTER_Z + Math.sin(angle) * radius,
        ),
        rotation: new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI),
        scale: 0.12 + rand() * 0.3,
        spin: (rand() - 0.5) * 0.28,
        drift: rand() * Math.PI * 2,
        color: roll > 0.84 ? ACCENT : roll > 0.5 ? WARM : DEEP,
        angle,
        radius,
        orbitDir: rand() > 0.5 ? 1 : -1,
      } satisfies Instance;
    });
  }, []);

  /**
   * Per-instance colour is written once; only matrices change per frame.
   *
   * This has to be a layout effect, not `useMemo`. A `useMemo` body runs during
   * render, when `mesh.current` is still null — so it bailed out and the colours
   * were never applied, leaving every parcel the material's default white.
   */
  useIsomorphicLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    instances.forEach((inst, i) => m.setColorAt(i, inst.color));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [instances]);

  // Scroll progress is eased toward its target rather than read raw, so a
  // flung trackpad produces a glide instead of a snap.
  const eased = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const k = Math.min(1, delta * 3);
    eased.current += (scrollRef.current - eased.current) * Math.min(1, delta * 2.5);
    const p = eased.current;

    if (mesh.current) {
      // The cluster blooms outward and each parcel orbits a little as the hero
      // scrolls — the scene resolves from a tight knot into open space. Kept
      // modest so the ring never sweeps past the camera.
      const bloom = 1 + p * 0.4;
      const orbit = p * 1.4;

      instances.forEach((inst, i) => {
        const angle = inst.angle + orbit * inst.orbitDir + t * 0.05 * inst.orbitDir;
        const radius = inst.radius * bloom;

        dummy.position.set(
          Math.cos(angle) * radius,
          inst.position.y * (1 + p * 0.35) + Math.sin(t * 0.35 + inst.drift) * 0.16,
          CLUSTER_Z + Math.sin(angle) * radius,
        );
        dummy.rotation.set(
          inst.rotation.x + t * inst.spin * 0.35 + p * inst.spin * 2.2,
          inst.rotation.y + t * inst.spin * 0.5 + p * inst.spin * 3,
          inst.rotation.z,
        );
        // Parcels shrink very slightly as they spread, keeping the mass constant.
        dummy.scale.setScalar(inst.scale * (1 - p * 0.16));
        dummy.updateMatrix();
        mesh.current!.setMatrixAt(i, dummy.matrix);
      });
      mesh.current.instanceMatrix.needsUpdate = true;
    }

    if (group.current) {
      // Pointer parallax, eased so the cluster lags the cursor slightly, plus a
      // slow constant yaw and a scroll-driven tilt.
      const targetX = state.pointer.y * 0.12 + p * 0.42;
      const targetY = state.pointer.x * 0.2 + t * 0.03 + p * 0.9;
      group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, delta * 2.2);
      group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, delta * 2.2);
    }

    if (accent.current) {
      // A slow breath on the accent light so the amber never sits perfectly flat.
      accent.current.intensity = 18 + Math.sin(t * 0.7) * 6 + p * 10;
    }

    // Dolly in and rise as the hero scrolls away. The travel stops well short of
    // the cluster's leading edge so the camera never ends up inside it.
    camera.position.z += (6 - p * 2.4 - camera.position.z) * k;
    camera.position.y += (p * 1.1 - camera.position.y) * k;
    camera.lookAt(0, 0, CLUSTER_Z);
  });

  return (
    <>
      {/* Sits inside the cluster's depth so the amber rims the near parcels
          rather than lighting empty space in front of them. */}
      <pointLight ref={accent} position={[-4, -2, CLUSTER_Z + 2]} intensity={22} distance={14} color="#c98500" />
      <group ref={group}>
        <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={0.62} metalness={0.12} />
        </instancedMesh>
      </group>
    </>
  );
}

export default function Scene({ scrollRef }: { scrollRef: MutableRefObject<number> }) {
  return (
    <Canvas
      // Capped so high-DPI laptops don't render 4× the pixels for a backdrop.
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <color attach="background" args={['#0b0a09']} />
      {/* Fog starts just in front of the cluster's near edge, so depth reads as
          distance and the far ring dissolves into the page rather than ending. */}
      <fog attach="fog" args={['#0b0a09', 4, 15]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color="#fff2dc" />
      {/* The accent point light lives inside Parcels so its breath can share the
          same frame loop as the cluster. */}
      <Parcels scrollRef={scrollRef} />
    </Canvas>
  );
}

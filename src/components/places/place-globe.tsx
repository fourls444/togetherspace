"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, OrbitControls, Text, useCursor, useTexture } from "@react-three/drei";
import * as THREE from "three";

import type { PlaceMapItem } from "@/components/places/place-map";
import styles from "@/components/places/place-globe.module.css";
import type {
  GlobeFrame,
  GlobeLookTarget,
  PlaceCluster,
} from "@/lib/places/place-clusters";
import { clusterAvatarUrls } from "@/lib/places/place-clusters";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";

const EARTH_DAY =
  "https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg";
const EARTH_BUMP =
  "https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png";
const ATMOSPHERE = "#4da6ff";
const STEM = "#94a3b8";
const STEM_HOVER = "#ffffff";
const PIN = "#ef4444";
const PIN_HOVER = "#f97316";
const FILL_LIGHT = "#88ccff";
const GLOBE_RADIUS = 2;
const CAMERA_DISTANCE = GLOBE_RADIUS * 3.5;
const AVATAR_RADIUS = 0.032;
const PIN_RADIUS = 0.009;
const STEM_RADIUS = 0.0035;
const PIN_ALTITUDE = GLOBE_RADIUS * 1.09;
const MIN_DISTANCE = GLOBE_RADIUS * 1.22;
const HANDOFF_DISTANCE = GLOBE_RADIUS * 1.28;
const HANDOFF_HOLD_SECONDS = 0.45;

type PlaceGlobeProps = {
  clusters: PlaceCluster<PlaceMapItem>[];
  focusedClusterId: string | null;
  frame: GlobeFrame;
  lookAtTick: number;
  onClusterClick: (id: string) => void;
  onLookAtArrived?: () => void;
  onMarkerClick: (id: string) => void;
  onZoomIntoMap?: (position: { latitude: number; longitude: number }) => void;
  places: PlaceMapItem[];
  selectedPlaceId: string | null;
  target: GlobeLookTarget | null;
};

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function cameraPositionFor(
  latitude: number,
  longitude: number,
  distance = CAMERA_DISTANCE,
) {
  return latLngToVector3(latitude, longitude, 1)
    .normalize()
    .multiplyScalar(distance);
}

function vector3ToLatLng(position: THREE.Vector3) {
  const dir = position.clone().normalize();
  const latitude =
    90 - Math.acos(THREE.MathUtils.clamp(dir.y, -1, 1)) * (180 / Math.PI);
  let longitude = Math.atan2(dir.z, -dir.x) * (180 / Math.PI) - 180;
  if (longitude < -180) longitude += 360;
  if (longitude > 180) longitude -= 360;
  return { latitude, longitude };
}

function MarkerStem({
  active,
  lineCenter,
  lineHeight,
  lineQuaternion,
  surface,
}: {
  active: boolean;
  lineCenter: THREE.Vector3;
  lineHeight: number;
  lineQuaternion: THREE.Quaternion;
  surface: THREE.Vector3;
}) {
  return (
    <>
      <mesh position={lineCenter} quaternion={lineQuaternion}>
        <cylinderGeometry args={[STEM_RADIUS, STEM_RADIUS, lineHeight, 8]} />
        <meshBasicMaterial color={active ? STEM_HOVER : STEM} />
      </mesh>
      <mesh position={surface} quaternion={lineQuaternion}>
        <sphereGeometry args={[PIN_RADIUS, 16, 16]} />
        <meshBasicMaterial color={active ? PIN_HOVER : PIN} />
      </mesh>
    </>
  );
}

function MarkerAvatar({
  onClick,
  selected,
  url,
}: {
  onClick: () => void;
  selected: boolean;
  url: string;
}) {
  const texture = useTexture(url);
  const [hovered, setHovered] = useState(false);
  const active = hovered || selected;
  useCursor(hovered);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  return (
    <group scale={active ? 1.22 : 1}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        onPointerOut={() => setHovered(false)}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
      >
        <circleGeometry args={[AVATAR_RADIUS, 48]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh>
        <ringGeometry args={[AVATAR_RADIUS, AVATAR_RADIUS + 0.008, 48]} />
        <meshBasicMaterial
          color={active ? STEM_HOVER : "#C9B896"}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function MarkerPin({
  onClick,
  place,
  selected,
}: {
  onClick: (id: string) => void;
  place: PlaceMapItem;
  selected: boolean;
}) {
  const avatar = place.creatorAvatarUrl ?? getDefaultImageUrl("profile");
  const surface = useMemo(
    () => latLngToVector3(place.latitude, place.longitude, GLOBE_RADIUS * 1.001),
    [place.latitude, place.longitude],
  );
  const top = useMemo(
    () => latLngToVector3(place.latitude, place.longitude, PIN_ALTITUDE),
    [place.latitude, place.longitude],
  );
  const { lineCenter, lineHeight, lineQuaternion } = useMemo(() => {
    const direction = top.clone().sub(surface).normalize();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    return {
      lineCenter: surface.clone().lerp(top, 0.5),
      lineHeight: top.distanceTo(surface),
      lineQuaternion: quaternion,
    };
  }, [surface, top]);

  const handleClick = useCallback(() => {
    onClick(place.id);
  }, [onClick, place.id]);

  return (
    <group>
      <MarkerStem
        active={selected}
        lineCenter={lineCenter}
        lineHeight={lineHeight}
        lineQuaternion={lineQuaternion}
        surface={surface}
      />
      <Billboard follow position={top}>
        <Suspense
          fallback={
            <mesh>
              <circleGeometry args={[AVATAR_RADIUS, 24]} />
              <meshBasicMaterial color="#1C1A17" />
            </mesh>
          }
        >
          <MarkerAvatar
            onClick={handleClick}
            selected={selected}
            url={avatar}
          />
        </Suspense>
      </Billboard>
    </group>
  );
}

function ClusterFace({ url }: { url: string }) {
  const texture = useTexture(url);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  return (
    <>
      <mesh>
        <circleGeometry args={[AVATAR_RADIUS * 0.92, 48]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh>
        <ringGeometry
          args={[AVATAR_RADIUS * 0.92, AVATAR_RADIUS * 0.92 + 0.007, 48]}
        />
        <meshBasicMaterial color="#C9B896" toneMapped={false} />
      </mesh>
    </>
  );
}

function ClusterMarker({
  cluster,
  onClick,
  selected,
}: {
  cluster: PlaceCluster;
  onClick: (id: string) => void;
  selected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const active = hovered || selected;
  useCursor(hovered);
  const avatars = clusterAvatarUrls(
    cluster.places,
    getDefaultImageUrl("profile"),
  );
  const surface = useMemo(
    () =>
      latLngToVector3(
        cluster.latitude,
        cluster.longitude,
        GLOBE_RADIUS * 1.001,
      ),
    [cluster.latitude, cluster.longitude],
  );
  const top = useMemo(
    () =>
      latLngToVector3(cluster.latitude, cluster.longitude, PIN_ALTITUDE),
    [cluster.latitude, cluster.longitude],
  );
  const { lineCenter, lineHeight, lineQuaternion } = useMemo(() => {
    const direction = top.clone().sub(surface).normalize();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    return {
      lineCenter: surface.clone().lerp(top, 0.5),
      lineHeight: top.distanceTo(surface),
      lineQuaternion: quaternion,
    };
  }, [surface, top]);

  return (
    <group>
      <MarkerStem
        active={active}
        lineCenter={lineCenter}
        lineHeight={lineHeight}
        lineQuaternion={lineQuaternion}
        surface={surface}
      />
      <Billboard follow position={top}>
        <group scale={active ? 1.16 : 1}>
          {avatars.map((url, index) => (
            <group
              key={`${url}-${index}`}
              position={[
                (index - (avatars.length - 1) / 2) * 0.024,
                index * 0.008,
                -index * 0.01,
              ]}
            >
              <Suspense
                fallback={
                  <mesh>
                    <circleGeometry args={[AVATAR_RADIUS * 0.92, 24]} />
                    <meshBasicMaterial color="#1C1A17" />
                  </mesh>
                }
              >
                <ClusterFace url={url} />
              </Suspense>
            </group>
          ))}
          <mesh position={[0.03, 0.026, 0.02]}>
            <circleGeometry args={[0.015, 24]} />
            <meshBasicMaterial color="#C9B896" toneMapped={false} />
          </mesh>
          <Text
            anchorX="center"
            anchorY="middle"
            color="#1A1612"
            fontSize={0.018}
            position={[0.03, 0.026, 0.026]}
          >
            {String(cluster.places.length)}
          </Text>
          <mesh
            onClick={(event) => {
              event.stopPropagation();
              onClick(cluster.id);
            }}
            onPointerOut={() => setHovered(false)}
            onPointerOver={(event) => {
              event.stopPropagation();
              setHovered(true);
            }}
          >
            <circleGeometry args={[0.058, 24]} />
            <meshBasicMaterial
              depthWrite={false}
              opacity={0}
              transparent
            />
          </mesh>
        </group>
      </Billboard>
    </group>
  );
}

function Atmosphere({
  blur,
  color,
  intensity,
}: {
  blur: number;
  color: string;
  intensity: number;
}) {
  const fresnelPower = Math.max(0.5, 5 - blur);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          atmosphereColor: { value: new THREE.Color(color) },
          intensity: { value: intensity },
          fresnelPower: { value: fresnelPower },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 atmosphereColor;
          uniform float intensity;
          uniform float fresnelPower;
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, normalize(-vPosition))), fresnelPower);
            gl_FragColor = vec4(atmosphereColor, fresnel * intensity);
          }
        `,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      }),
    [color, fresnelPower, intensity],
  );

  return (
    <mesh scale={[1.12, 1.12, 1.12]}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 32]} />
      <primitive attach="material" object={material} />
    </mesh>
  );
}

function CameraKeyLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!lightRef.current) return;
    lightRef.current.position.copy(camera.position);
  });

  return (
    <directionalLight color="#ffffff" intensity={1.9} ref={lightRef} />
  );
}

function GlobeScene({
  clusters,
  focusedClusterId,
  lookAtTick,
  onClusterClick,
  onLookAtArrived,
  onMarkerClick,
  onZoomIntoMap,
  reduceMotion,
  selectedPlaceId,
  target,
}: {
  clusters: PlaceCluster<PlaceMapItem>[];
  focusedClusterId: string | null;
  lookAtTick: number;
  onClusterClick: (id: string) => void;
  onLookAtArrived?: () => void;
  onMarkerClick: (id: string) => void;
  onZoomIntoMap?: (position: { latitude: number; longitude: number }) => void;
  reduceMotion: boolean;
  selectedPlaceId: string | null;
  target: GlobeLookTarget | null;
}) {
  const [earthTexture, bumpTexture] = useTexture([EARTH_DAY, EARTH_BUMP]);
  const { camera } = useThree();
  const arrivedTick = useRef(0);
  const seekTick = useRef(0);
  const seekDistance = useRef(CAMERA_DISTANCE);
  const handedOff = useRef(false);
  const closeFor = useRef(0);

  const pins = useMemo(() => {
    const focused = clusters.find((cluster) => cluster.id === focusedClusterId);
    if (focused) {
      const others = clusters
        .filter(
          (cluster) =>
            cluster.id !== focused.id && cluster.places.length === 1,
        )
        .flatMap((cluster) => cluster.places);
      return [...focused.places, ...others];
    }
    return clusters
      .filter((cluster) => cluster.places.length === 1)
      .flatMap((cluster) => cluster.places);
  }, [clusters, focusedClusterId]);

  const chips = useMemo(
    () =>
      clusters.filter(
        (cluster) =>
          cluster.places.length > 1 && cluster.id !== focusedClusterId,
      ),
    [clusters, focusedClusterId],
  );

  useEffect(() => {
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.anisotropy = 16;
    bumpTexture.anisotropy = 8;
  }, [bumpTexture, earthTexture]);

  useFrame((_, delta) => {
    const distance = camera.position.length();
    const closeEnough =
      !handedOff.current &&
      !target &&
      Boolean(onZoomIntoMap) &&
      distance <= HANDOFF_DISTANCE;

    if (closeEnough) {
      closeFor.current += delta;
      if (closeFor.current >= HANDOFF_HOLD_SECONDS && onZoomIntoMap) {
        handedOff.current = true;
        closeFor.current = 0;
        const position = vector3ToLatLng(camera.position);
        queueMicrotask(() => onZoomIntoMap(position));
        return;
      }
    } else {
      closeFor.current = 0;
    }

    if (distance > HANDOFF_DISTANCE + 0.8) {
      handedOff.current = false;
    }

    if (!target || lookAtTick <= 0) return;
    if (seekTick.current !== lookAtTick) {
      seekTick.current = lookAtTick;
      seekDistance.current = target.distance ?? camera.position.length();
    }
    if (arrivedTick.current === lookAtTick) return;
    const desired = cameraPositionFor(
      target.latitude,
      target.longitude,
      seekDistance.current,
    );
    if (reduceMotion) {
      camera.position.copy(desired);
    } else {
      camera.position.lerp(desired, 1 - Math.exp(-3.2 * delta));
    }
    camera.lookAt(0, 0, 0);
    if (camera.position.distanceTo(desired) < 0.08) {
      arrivedTick.current = lookAtTick;
      onLookAtArrived?.();
    }
  });

  return (
    <>
      <ambientLight intensity={0.62} />
      <hemisphereLight
        color="#d7ecff"
        groundColor="#2a241c"
        intensity={0.55}
      />
      <CameraKeyLight />
      <directionalLight
        color={FILL_LIGHT}
        intensity={0.22}
        position={[-GLOBE_RADIUS * 3, GLOBE_RADIUS, -GLOBE_RADIUS * 2]}
      />
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial
          bumpMap={bumpTexture}
          bumpScale={0.25}
          emissive="#ffffff"
          emissiveIntensity={0.22}
          emissiveMap={earthTexture}
          map={earthTexture}
          metalness={0}
          roughness={0.78}
        />
      </mesh>
      <Atmosphere blur={2} color={ATMOSPHERE} intensity={0.55} />
      {pins.map((place) => (
        <MarkerPin
          key={place.id}
          onClick={onMarkerClick}
          place={place}
          selected={place.id === selectedPlaceId}
        />
      ))}
      {chips.map((cluster) => (
        <ClusterMarker
          key={cluster.id}
          cluster={cluster}
          onClick={onClusterClick}
          selected={cluster.id === focusedClusterId}
        />
      ))}
      <OrbitControls
        autoRotate={!target && !reduceMotion}
        autoRotateSpeed={0.12}
        dampingFactor={0.12}
        enableDamping
        enablePan={false}
        enableZoom
        enabled={!target}
        makeDefault
        maxDistance={CAMERA_DISTANCE * 1.45}
        minDistance={MIN_DISTANCE}
        rotateSpeed={0.22}
        zoomSpeed={0.28}
      />
    </>
  );
}

/** ลูกโลกของแผนที่ห้อง — หมุดเป็นรูปคนที่ปัก หมุนไปจุดที่เลือกได้ */
export function PlaceGlobe({
  clusters,
  focusedClusterId,
  frame,
  lookAtTick,
  onClusterClick,
  onLookAtArrived,
  onMarkerClick,
  onZoomIntoMap,
  places,
  selectedPlaceId,
  target,
}: PlaceGlobeProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  return (
    <div className={styles.stage}>
      <Canvas
        camera={{
          far: 1000,
          fov: 45,
          near: 0.1,
          position: cameraPositionFor(
            frame.latitude,
            frame.longitude,
            frame.distance,
          ).toArray(),
        }}
        className={styles.canvas}
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <GlobeScene
            clusters={clusters}
            focusedClusterId={focusedClusterId}
            lookAtTick={lookAtTick}
            onClusterClick={onClusterClick}
            onLookAtArrived={onLookAtArrived}
            onMarkerClick={onMarkerClick}
            onZoomIntoMap={onZoomIntoMap}
            reduceMotion={reduceMotion}
            selectedPlaceId={selectedPlaceId}
            target={target}
          />
        </Suspense>
      </Canvas>
      {places.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyCard}>
            <strong>ปักหมุดแรกของห้องนี้</strong>
            <p>ค้นหาหรือเปิดแผนที่ถนน แล้วแตะจุดที่อยากจำไว้ด้วยกัน</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

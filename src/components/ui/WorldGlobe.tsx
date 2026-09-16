"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useAuth } from "@/context/AuthContext";

function GlobeComponent() {
    const globeRef = useRef<any>(null);
    const [GlobeObject, setGlobeObject] = useState<any>(null);
    const { user } = useAuth();
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Mock other users around the world
    const otherUsers = [
        { lat: 40.7128, lng: -74.0060, name: "Sarah", avatar: "https://picsum.photos/seed/sarah/100/100" }, // NYC
        { lat: 51.5072, lng: -0.1276, name: "Liam", avatar: "https://picsum.photos/seed/liam/100/100" }, // London
        { lat: 35.6895, lng: 139.6917, name: "Yuki", avatar: "https://picsum.photos/seed/yuki/100/100" }, // Tokyo
        { lat: -33.8688, lng: 151.2093, name: "Jack", avatar: "https://picsum.photos/seed/jack/100/100" }, // Sydney
        { lat: -23.5505, lng: -46.6333, name: "Ana", avatar: "https://picsum.photos/seed/ana/100/100" }, // Sao Paulo
    ];

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                () => { /* Geolocation denied or unavailable — globe renders without user pin */ },
                { enableHighAccuracy: true }
            );
        }
    }, []);

    useEffect(() => {
        const loadGlobe = async () => {
            const ThreeGlobe = (await import("three-globe")).default;
            const globe = new ThreeGlobe()
                .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
                .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
                .showAtmosphere(true)
                .atmosphereColor("#3a228a")
                .atmosphereAltitude(0.2);

            const allUsers = [...otherUsers];
            if (user && userLocation) {
                allUsers.push({
                    lat: userLocation.lat,
                    lng: userLocation.lng,
                    name: "Me",
                    avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=ef4444&color=fff`
                });

                // Add connection arcs from "Me" to others
                const arcs = otherUsers.map(target => ({
                    startLat: userLocation.lat,
                    startLng: userLocation.lng,
                    endLat: target.lat,
                    endLng: target.lng,
                    color: ["#ef4444", "#3b82f6"]
                }));

                globe.arcsData(arcs)
                    .arcColor('color')
                    .arcAltitude(0.4)
                    .arcDashLength(0.4)
                    .arcDashGap(4)
                    .arcDashAnimateTime(2000);
            }

            // Function to create a circular texture from an image URL
            const createCircularTexture = (url: string): Promise<THREE.Texture> => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = url;
                    img.onload = () => {
                        const size = 256; // Standard texture size
                        const canvas = document.createElement('canvas');
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            // Draw circular mask
                            ctx.beginPath();
                            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                            ctx.clip();

                            // Draw image centered and scaled
                            const aspect = img.width / img.height;
                            let drawW = size;
                            let drawH = size;
                            let drawX = 0;
                            let drawY = 0;

                            if (aspect > 1) { // Landscape
                                drawW = size * aspect;
                                drawX = -(drawW - size) / 2;
                            } else { // Portrait
                                drawH = size / aspect;
                                drawY = -(drawH - size) / 2;
                            }

                            ctx.drawImage(img, drawX, drawY, drawW, drawH);

                            const texture = new THREE.CanvasTexture(canvas);
                            texture.colorSpace = THREE.SRGBColorSpace;
                            texture.needsUpdate = true;
                            resolve(texture);
                        }
                    };
                    img.onerror = () => {
                        // Fallback texture if image fails
                        const canvas = document.createElement('canvas');
                        canvas.width = 64;
                        canvas.height = 64;
                        const texture = new THREE.CanvasTexture(canvas);
                        resolve(texture);
                    };
                });
            };

            // Objects Layer with Shader-based circular clipping
            (globe as any)
                .objectsData(allUsers)
                .objectLat((d: any) => d.lat)
                .objectLng((d: any) => d.lng)
                .objectAltitude(0.01)
                .objectThreeObject((d: any) => {
                    const group = new THREE.Group();
                    const stemHeight = 12;
                    const headSize = 8;

                    // 1. PIN STEM
                    const stem = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.3, 0.05, stemHeight, 8),
                        new THREE.MeshStandardMaterial({
                            color: d.name === "Me" ? 0xef4444 : 0x3b82f6,
                            emissive: d.name === "Me" ? 0xef4444 : 0x3b82f6,
                            emissiveIntensity: 0.5,
                            transparent: true
                        })
                    );
                    stem.position.y = stemHeight / 2;
                    group.add(stem);

                    // 2. PIN HEAD (Outer Glow)
                    const ring = new THREE.Mesh(
                        new THREE.TorusGeometry(headSize, 0.6, 16, 32),
                        new THREE.MeshStandardMaterial({
                            color: d.name === "Me" ? 0xef4444 : 0x3b82f6,
                            emissive: d.name === "Me" ? 0xef4444 : 0x3b82f6,
                            emissiveIntensity: 2,
                            transparent: true
                        })
                    );
                    ring.position.y = stemHeight + headSize / 2;
                    group.add(ring);

                    // 3. CIRCULAR AVATAR
                    const loader = new THREE.TextureLoader();
                    loader.setCrossOrigin('anonymous');
                    // Head (Avatar Container) - Using CircleGeometry for guaranteed circularity
                    const circleGeo = new THREE.CircleGeometry(headSize / 2, 32);
                    const circleMat = new THREE.MeshBasicMaterial({
                        transparent: true,
                        map: loader.load(d.avatar || "/default-avatar.png"),
                        side: THREE.DoubleSide
                    });
                    const head = new THREE.Mesh(circleGeo, circleMat);
                    head.position.y = stemHeight + headSize / 2;
                    head.rotation.y = Math.PI; // Face camera relative to pin
                    group.add(head);

                    // Auto-orient outward from surface
                    group.lookAt(new THREE.Vector3(0, 0, 0));
                    group.rotateX(Math.PI / 2);

                    return group;
                });

            globeRef.current = globe;
            setGlobeObject(globe);
        };

        loadGlobe();
    }, [user, userLocation]);

    // UseFrame to handle rotation and depth-based opacity
    useFrame(({ camera }) => {
        if (globeRef.current) {
            globeRef.current.rotation.y += 0.003;

            // Update opacity based on position relative to camera
            const cameraPos = new THREE.Vector3();
            camera.getWorldPosition(cameraPos);

            // Access objects layer children
            // ThreeGlobe packs objects into internal groups, we iterate to find them
            globeRef.current.children.forEach((layerGroup: any) => {
                if (layerGroup.type === 'Group' && layerGroup.children.length > 0) {
                    layerGroup.children.forEach((marker: any) => {
                        if (marker.isGroup) {
                            const markerPos = new THREE.Vector3();
                            marker.getWorldPosition(markerPos);

                            // Dot product to determine if marker is facing the camera
                            const dot = markerPos.normalize().dot(cameraPos.normalize());

                            // Fade if dot product is low (marker on far side)
                            const targetOpacity = Math.max(0.1, dot > 0 ? 1 : 1 + dot * 1.5);

                            marker.traverse((child: any) => {
                                if (child.material) {
                                    // Update standard material opacity
                                    child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.1);
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    return GlobeObject ? <primitive object={GlobeObject} /> : null;
}

export default function WorldGlobe() {
    return (
        <div className="w-full h-[450px] sm:h-[600px] rounded-3xl relative">
            <Canvas camera={{ position: [0, 0, 400], fov: 45 }}>
                <color attach="background" args={['#000000']} />
                <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} fade speed={1} />
                <ambientLight intensity={1.5} />
                <pointLight position={[200, 200, 200]} intensity={2} />
                <pointLight position={[-200, -200, -200]} intensity={1.5} />
                <GlobeComponent />
                <OrbitControls enableZoom={false} autoRotate={false} />
            </Canvas>
        </div>
    );
}

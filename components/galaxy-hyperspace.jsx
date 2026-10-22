"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const GalaxyHyperspace = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, 
      alpha: true,
      powerPreference: "high-performance",
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Capped at 1.5 for performance
    mount.appendChild(renderer.domElement);

    // ── OPTIMIZED STARFIELD ──
    const starCount = 2500; // Reduced from 6000
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSpeeds = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 4000;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 4000;
      starPositions[i * 3 + 2] = Math.random() * -2000;
      starSpeeds[i] = Math.random() * 3 + 1; 
    }

    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 4.0, 
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // ── OPTIMIZED SOLAR WIND ──
    const windCount = 400; // Reduced from 1000
    const windGeometry = new THREE.BufferGeometry();
    const windPositions = new Float32Array(windCount * 3);
    const windSpeeds = new Float32Array(windCount);
    
    for (let i = 0; i < windCount; i++) {
      windPositions[i * 3] = (Math.random() - 0.5) * 2500;
      windPositions[i * 3 + 1] = (Math.random() - 0.5) * 2500;
      windPositions[i * 3 + 2] = Math.random() * -1500;
      windSpeeds[i] = Math.random() * 2 + 1; 
    }

    windGeometry.setAttribute("position", new THREE.BufferAttribute(windPositions, 3));
    const windMaterial = new THREE.PointsMaterial({
      color: 0xa855f7,
      size: 8.0, 
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });
    const solarWind = new THREE.Points(windGeometry, windMaterial);
    scene.add(solarWind);

    // Camera setup
    camera.position.z = 150;
    scene.scale.set(1.5, 1.5, 1.5); 

    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const onMouseMove = (event) => {
      targetMouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // ── OPTIMIZED ANIMATION LOOP ──
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Star Hyperspace Motion
      const starPos = starField.geometry.attributes.position.array;
      for (let i = 0; i < starCount; i++) {
        starPos[i * 3 + 2] += starSpeeds[i] * 1.5;
        if (starPos[i * 3 + 2] > 300) {
          starPos[i * 3 + 2] = -2000;
        }
      }
      starField.geometry.attributes.position.needsUpdate = true;

      // Solar Wind Motion
      const windPos = solarWind.geometry.attributes.position.array;
      for (let i = 0; i < windCount; i++) {
        windPos[i * 3 + 2] += windSpeeds[i] * 1.8;
        if (windPos[i * 3 + 2] > 300) {
          windPos[i * 3 + 2] = -1500;
        }
      }
      solarWind.geometry.attributes.position.needsUpdate = true;

      // Smooth Damping
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      scene.rotation.y = currentMouseX * 0.8; 
      scene.rotation.x = -currentMouseY * 0.8; 
      
      camera.position.x = currentMouseX * 150;
      camera.position.y = -currentMouseY * 150;
      
      camera.lookAt(0, 0, -1500);

      renderer.render(scene, camera);
    };

    let animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      windGeometry.dispose();
      windMaterial.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={mountRef} className="fixed inset-0 z-[-1] pointer-events-none bg-[#030207] overflow-hidden" />
  );
};

export default GalaxyHyperspace;

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const GalaxyCanvas = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      antialias: false, // disabled for max performance
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 4);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  GALAXY PARTICLE SYSTEM
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const COUNT = 7000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);

    const colorA = new THREE.Color("#a855f7"); // Neon Purple
    const colorB = new THREE.Color("#22d3ee"); // Neon Cyan
    const colorC = new THREE.Color("#ffffff"); // White core
    const colorD = new THREE.Color("#8b5cf6"); // Violet

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      // Spread in a galaxy disk with some arms + depth scatter
      const radius = Math.random() * 8 + 0.5;
      const spinAngle = radius * 1.5;
      const branchAngle = (i % 3) * ((2 * Math.PI) / 3);
      const randomX = (Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1)) * 1.5;
      const randomY = (Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1)) * 0.8;
      const randomZ = (Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1)) * 1.5;

      positions[i3]     = Math.cos(branchAngle + spinAngle) * radius + randomX;
      positions[i3 + 1] = randomY;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      // Color gradient: inner = cyan-white, outer = purple-violet
      const mixRatio = Math.min(radius / 8, 1);
      let mixed;
      if (Math.random() < 0.1) {
        mixed = colorC.clone(); // bright white core stars
      } else if (mixRatio < 0.4) {
        mixed = colorB.clone().lerp(colorA, mixRatio * 2);
      } else {
        mixed = colorA.clone().lerp(colorD, (mixRatio - 0.4) * 1.7);
      }
      colors[i3]     = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;

      sizes[i] = Math.random() * 2.5 + 0.5;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size",     new THREE.BufferAttribute(sizes, 1));

    // Glowing circular sprite texture (drawn on canvas)
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width  = 64;
    spriteCanvas.height = 64;
    const ctx = spriteCanvas.getContext("2d");
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0,    "rgba(255,255,255,1)");
    gradient.addColorStop(0.2,  "rgba(200,180,255,0.9)");
    gradient.addColorStop(0.5,  "rgba(130,80,220,0.4)");
    gradient.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(spriteCanvas);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture:  { value: texture },
        uTime:     { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uTime;
        void main() {
          vColor = color;
          vec3 pos = position;
          // Slow galaxy rotation
          float angle = uTime * 0.04;
          float cosA = cos(angle); float sinA = sin(angle);
          pos.xz = vec2(cosA * pos.x - sinA * pos.z, sinA * pos.x + cosA * pos.z);
          // Subtle twinkling via y drift
          pos.y += sin(uTime * 0.5 + position.x * 2.0) * 0.01;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (280.0 / -mvPos.z);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          // Subtle per-star twinkle
          float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + vColor.r * 20.0);
          gl_FragColor  = vec4(vColor * twinkle, tex.a * twinkle);
        }
      `,
      vertexColors:  true,
      transparent:   true,
      depthWrite:    false,
      blending:      THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  BACKGROUND SCATTER: tiny distant stars
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const bgCount = 2000;
    const bgGeo   = new THREE.BufferGeometry();
    const bgPos   = new Float32Array(bgCount * 3);
    for (let i = 0; i < bgCount; i++) {
      bgPos[i * 3]     = (Math.random() - 0.5) * 60;
      bgPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      bgPos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;
    }
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    const bgMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    scene.add(new THREE.Points(bgGeo, bgMat));

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  MOUSE PARALLAX
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let mouseX = 0, mouseY = 0;
    const handleMouse = (e) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 1.2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 1.2;
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  RESIZE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  ANIMATION LOOP (RAF with throttle to 40fps for battery saving)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let rafId;
    let lastTime = 0;
    const FRAME_MS = 1000 / 40; // target ~40fps for smooth feel without drain

    const animate = (timestamp) => {
      rafId = requestAnimationFrame(animate);
      if (timestamp - lastTime < FRAME_MS) return;
      lastTime = timestamp;

      const t = timestamp * 0.001;
      material.uniforms.uTime.value = t;

      // Gentle camera drift on mouse
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(animate);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  CLEANUP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      texture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 -z-20 w-full h-full pointer-events-none"
      style={{ willChange: "transform" }}
    />
  );
};

export default GalaxyCanvas;

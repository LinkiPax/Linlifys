import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { RGBShiftShader } from "three/addons/shaders/RGBShiftShader.js";
import { GlitchPass } from "three/addons/postprocessing/GlitchPass.js";

export default function HeroSection() {
  const navigate = useNavigate();
  const [heroMode, setHeroMode] = useState("merged");
  const [colorIndex, setColorIndex] = useState(0);
  const heroCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  const colorThemes = [
    { hue: "260deg", name: "purple" },
    { hue: "180deg", name: "teal" },
    { hue: "330deg", name: "pink" },
    { hue: "60deg", name: "yellow" },
    { hue: "120deg", name: "green" },
  ];

  useEffect(() => {
    const colorInterval = setInterval(() => {
      setColorIndex((prevIndex) => (prevIndex + 1) % colorThemes.length);
    }, 10000); // 10 seconds

    return () => clearInterval(colorInterval);
  }, []);

  useEffect(() => {
    if (!heroCanvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({
      canvas: heroCanvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms["resolution"].value.set(
      1 / (window.innerWidth * window.devicePixelRatio),
      1 / (window.innerHeight * window.devicePixelRatio)
    );
    composer.addPass(fxaaPass);

    const rgbShiftPass = new ShaderPass(RGBShiftShader);
    rgbShiftPass.uniforms["amount"].value = 0.0015;
    composer.addPass(rgbShiftPass);

    const glitchPass = new GlitchPass();
    glitchPass.goWild = false;
    composer.addPass(glitchPass);

    // Particles
    const particleCount = 3000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const radius = 1;
    const professionalColor = new THREE.Color(0x00aaff); // Blue for professional
    const personalColor = new THREE.Color(0xff8c00); // Orange for personal
    const mergedColor = new THREE.Color(0x8a2be2); // Purple for merged

    // Create a torus knot for more interesting particle distribution
    const torusKnot = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const torusPositions = torusKnot.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      if (i < particleCount / 2) {
        const idx =
          Math.floor(((i / (particleCount / 2)) * torusPositions.length) / 3) *
          3;
        positions[i3] = torusPositions[idx] * (0.9 + Math.random() * 0.2);
        positions[i3 + 1] =
          torusPositions[idx + 1] * (0.9 + Math.random() * 0.2);
        positions[i3 + 2] =
          torusPositions[idx + 2] * (0.9 + Math.random() * 0.2);
      } else {
        // Random positions in a sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = radius * Math.cbrt(Math.random());

        positions[i3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = r * Math.cos(phi);
      }

      // Set initial colors (merged state - purple)
      colors[i3] = mergedColor.r;
      colors[i3 + 1] = mergedColor.g;
      colors[i3 + 2] = mergedColor.b;

      sizes[i] = Math.random() * 2 + 0.5;
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particles.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Add some larger "star" particles
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(50 * 3);
    const starSizes = new Float32Array(50);

    for (let i = 0; i < 50; i++) {
      const i3 = i * 3;
      starPositions[i3] = (Math.random() - 0.5) * 40;
      starPositions[i3 + 1] = (Math.random() - 0.5) * 40;
      starPositions[i3 + 2] = (Math.random() - 0.5) * 40;
      starSizes[i] = Math.random() * 4 + 2;
    }

    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );
    starGeometry.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      size: 1,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const starSystem = new THREE.Points(starGeometry, starMaterial);
    scene.add(starSystem);

    // Animation
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Rotate particles
      particleSystem.rotation.x += 0.0002;
      particleSystem.rotation.y += 0.0005;

      // Pulsing effect
      particleSystem.scale.set(
        1 + Math.sin(elapsedTime * 0.5) * 0.02,
        1 + Math.sin(elapsedTime * 0.5) * 0.02,
        1 + Math.sin(elapsedTime * 0.5) * 0.02
      );

      // Update colors based on mode
      const colorArray = particles.attributes.color.array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        let targetColor;
        if (heroMode === "merged") {
          targetColor = mergedColor;
        } else if (heroMode === "professional") {
          targetColor = professionalColor;
        } else if (heroMode === "personal") {
          targetColor = personalColor;
        }

        // Smooth color transition
        colorArray[i3] += (targetColor.r - colorArray[i3]) * 0.05;
        colorArray[i3 + 1] += (targetColor.g - colorArray[i3 + 1]) * 0.05;
        colorArray[i3 + 2] += (targetColor.b - colorArray[i3 + 2]) * 0.05;
      }
      particles.attributes.color.needsUpdate = true;

      // Animate star particles
      const starPosArray = starGeometry.attributes.position.array;
      for (let i = 0; i < 50; i++) {
        const i3 = i * 3;
        starPosArray[i3 + 2] += 0.05;
        if (starPosArray[i3 + 2] > 20) {
          starPosArray[i3 + 2] = -20;
          starPosArray[i3] = (Math.random() - 0.5) * 40;
          starPosArray[i3 + 1] = (Math.random() - 0.5) * 40;
        }
      }
      starGeometry.attributes.position.needsUpdate = true;

      composer.render();
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      if (renderer) renderer.dispose();
    };
  }, [heroMode]);

  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <canvas ref={heroCanvasRef} className="hero-canvas" />

      <div className="hero-content">
        <div className="titleMainpage">
          <div className="gradient-text-container">
            <h1 id="hero-title">
              <span
                className="gradient-text smoke-text"
                data-text="One Platform,"
                style={{ "--hue": colorThemes[colorIndex].hue }}
              >
                One Platform,
              </span>
              <br />
              <span
                className="gradient-text smoke-text"
                data-text="Two Worlds"
                style={{
                  "--hue": colorThemes[(colorIndex + 1) % colorThemes.length].hue,
                }}
              >
                Two Worlds
              </span>
            </h1>
          </div>
          <p className="hero-subtitle neon-text">
            Linkipax blends your personal life and professional presence —
            switch modes instantly with a single toggle.
          </p>

          <div className="hero-actions">
            <div className="button-container">
              <button
                className="get-started-button cosmic-button"
                onClick={() => navigate("/signup")}
                onMouseEnter={() => setHeroMode("merged")}
                onMouseLeave={() => setHeroMode("merged")}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const width = rect.width;

                  if (x < width / 2) {
                    setHeroMode("personal");
                  } else {
                    setHeroMode("professional");
                  }
                }}
              >
                <span className="button-text">Get Started</span>
                <span className="button-glow" />
                <span className="button-particles">
                  {[...Array(12)].map((_, i) => (
                    <span key={i} className="particle" />
                  ))}
                </span>

                <span className="hover-effect personal-hover">
                  <span className="hover-text">Personal</span>
                  <span className="hover-emoji">👨‍💻</span>
                </span>
                <span className="hover-effect professional-hover">
                  <span className="hover-text">Professional</span>
                  <span className="hover-emoji">💼</span>
                </span>
              </button>
            </div>

            <div className="mode-indicators">
              <div
                className={`indicator personal ${
                  heroMode === "personal" ? "active" : ""
                }`}
                onMouseEnter={() => setHeroMode("personal")}
              >
                <span className="indicator-icon">👨‍💻</span>
                <span className="indicator-text pulse-text">Personal</span>
              </div>
              <div
                className={`indicator professional ${
                  heroMode === "professional" ? "active" : ""
                }`}
                onMouseEnter={() => setHeroMode("professional")}
              >
                <span className="indicator-icon">💼</span>
                <span className="indicator-text pulse-text">Professional</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-scroll-indicator">
          <div className="scroll-line"></div>
          <span className="flicker-text">Scroll to explore</span>
        </div>

        <div className="hero-background-grid"></div>

        <div className="floating-particles">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                "--size": `${Math.random() * 0.5 + 0.2}vmin`,
                "--x": `${Math.random() * 100}%`,
                "--y": `${Math.random() * 100}%`,
                "--delay": `${Math.random() * 5}s`,
                "--duration": `${Math.random() * 10 + 10}s`,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

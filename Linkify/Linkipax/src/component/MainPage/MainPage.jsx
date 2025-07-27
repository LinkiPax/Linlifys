import React, { useState, useEffect, useRef, useCallback } from "react";
import "./MainPage.css";
import MainNavbar from "./MainNavbar";
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaVideo,
  FaGlobe,
  FaUsers,
  FaLanguage,
  FaLinkedin,
  FaTwitter,
  FaGithub,
  FaInstagram,
  FaEnvelope,
} from "react-icons/fa";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { RGBShiftShader } from "three/addons/shaders/RGBShiftShader.js";
import { GlitchPass } from "three/addons/postprocessing/GlitchPass.js";
import { World } from "../../components/ui/globe";
import { AnimatedTooltip } from "../../components/ui/animated-tooltip";
import { WorldMap } from "../../components/ui/world-map";

import { debounce } from "lodash";

const MainPage = () => {
  const [videoSrc, setVideoSrc] = useState("/videos/demo1.mp4");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isProfessional, setIsProfessional] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [heroMode, setHeroMode] = useState("merged");
  const videoRef = useRef(null);
  const threeContainerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const heroCanvasRef = useRef(null);

  const globeConfig = {
    pointSize: 2,
    globeColor: "#1d072e",
    showAtmosphere: true,
    atmosphereColor: "#ffffff",
    atmosphereAltitude: 0.1,
    polygonColor: "rgba(255,255,255,0.7)",
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ambientLight: "#38bdf8",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
  };

  const teamMembers = [
    {
      id: 1,
      name: "John Doe",
      designation: "Founder & CEO",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      id: 2,
      name: "Jane Smith",
      designation: "CTO",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      id: 3,
      name: "Mike Johnson",
      designation: "Lead Designer",
      image: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    {
      id: 4,
      name: "Sarah Williams",
      designation: "Marketing Head",
      image: "https://randomuser.me/api/portraits/women/63.jpg",
    },
  ];

  const mapConnections = [
    {
      start: { lat: 40.7128, lng: -74.006 },
      end: { lat: 51.5074, lng: -0.1278 },
    },
    {
      start: { lat: 48.8566, lng: 2.3522 },
      end: { lat: 35.6762, lng: 139.6503 },
    },
    {
      start: { lat: 37.7749, lng: -122.4194 },
      end: { lat: 28.6139, lng: 77.209 },
    },
    {
      start: { lat: -33.8688, lng: 151.2093 },
      end: { lat: 22.3193, lng: 114.1694 },
    },
  ];

  const sampleData = [
    {
      order: 1,
      startLat: 37.7749,
      startLng: -122.4194,
      endLat: 40.7128,
      endLng: -74.006,
      arcAlt: 0.2,
      color: "#3b82f6",
    },
    {
      order: 2,
      startLat: 51.5074,
      startLng: -0.1278,
      endLat: 48.8566,
      endLng: 2.3522,
      arcAlt: 0.2,
      color: "#3b82f6",
    },
    {
      order: 3,
      startLat: 35.6762,
      startLng: 139.6503,
      endLat: 37.5665,
      endLng: 126.978,
      arcAlt: 0.2,
      color: "#3b82f6",
    },
    {
      order: 4,
      startLat: 28.6139,
      startLng: 77.209,
      endLat: 22.3193,
      endLng: 114.1694,
      arcAlt: 0.2,
      color: "#3b82f6",
    },
    {
      order: 5,
      startLat: -33.8688,
      startLng: 151.2093,
      endLat: -22.9068,
      endLng: -43.1729,
      arcAlt: 0.2,
      color: "#3b82f6",
    },
  ];
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

      // Distribute some particles along a torus knot and others randomly
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

    // Handle resize
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

  // Custom hook for Three.js setup in toggle section
  const useThreeSetup = (containerRef, isProfessional) => {
    const sceneRef = useRef(new THREE.Scene());
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const particlesRef = useRef(new THREE.Group());
    const mouseRef = useRef({ x: 0, y: 0, initialized: false });

    const particleCount = 50;
    const particlePositions = useRef([]);
    const particleTargets = useRef([]);
    const lines = useRef([]);
    const currentColor = useRef(
      new THREE.Color(isProfessional ? 0x00aaff : 0xffaa00)
    );

    const setupThree = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;

      // Scene setup
      cameraRef.current = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      rendererRef.current = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current.setSize(
        container.clientWidth,
        container.clientHeight
      );
      rendererRef.current.setClearColor(0x000000, 0);
      container.innerHTML = "";
      container.appendChild(rendererRef.current.domElement);

      // Particle systems
      const particleGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: currentColor.current,
        transparent: true,
        opacity: 0.8,
      });

      for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 4 + Math.random() * 2;
        const pos = isProfessional
          ? new THREE.Vector3(
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              (Math.random() - 0.5) * 2
            )
          : new THREE.Vector3(
              Math.cos(angle) * radius * (1 + Math.random() * 0.5),
              Math.sin(angle) * radius * (1 + Math.random() * 0.5),
              (Math.random() - 0.5) * 4
            );

        particle.position.copy(pos);
        particlePositions.current.push(pos.clone());
        particleTargets.current.push(pos.clone());
        particlesRef.current.add(particle);
      }

      // Create lines
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          if (Math.random() > 0.8) {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
              particlePositions.current[i],
              particlePositions.current[j],
            ]);
            const lineMaterial = new THREE.LineBasicMaterial({
              color: currentColor.current,
              transparent: true,
              opacity: 0.3,
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            lines.current.push(line);
            particlesRef.current.add(line);
          }
        }
      }

      sceneRef.current.add(particlesRef.current);
      sceneRef.current.add(new THREE.AmbientLight(0x404040));
      const pointLight = new THREE.PointLight(0xffffff, 1, 100);
      pointLight.position.set(10, 10, 10);
      sceneRef.current.add(pointLight);
      cameraRef.current.position.z = 12;
    }, [containerRef, isProfessional]);

    const updateParticleTargets = useCallback(() => {
      currentColor.current.set(isProfessional ? 0x00aaff : 0xffaa00);
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 4 + Math.random() * 2;
        const newPos = isProfessional
          ? new THREE.Vector3(
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              (Math.random() - 0.5) * 2
            )
          : new THREE.Vector3(
              Math.cos(angle) * radius * (1 + Math.random() * 0.5),
              Math.sin(angle) * radius * (1 + Math.random() * 0.5),
              (Math.random() - 0.5) * 4
            );
        particleTargets.current[i].copy(newPos);
      }
    }, [isProfessional]);

    const animate = useCallback(() => {
      if (!particlesRef.current || !rendererRef.current || !cameraRef.current) {
        return;
      }

      particlesRef.current.rotation.y += 0.002;
      particlesRef.current.children.forEach((child, i) => {
        if (child.isMesh && particleTargets.current[i]) {
          const pulse = Math.sin(Date.now() * 0.002 + i) * 0.05 + 1;
          child.scale.set(pulse, pulse, pulse);
          const target = particleTargets.current[i];
          child.position.lerp(target, 0.05);

          if (mouseRef.current.initialized) {
            child.position.x += mouseRef.current.x * 0.001;
            child.position.y += mouseRef.current.y * 0.001;
          }

          child.material.color.lerp(currentColor.current, 0.05);
        } else if (child.isLine) {
          child.material.color.lerp(currentColor.current, 0.05);
        }
      });

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    }, []);

    const handleMouseMove = useCallback(
      debounce((event) => {
        mouseRef.current.x = (event.clientX / window.innerWidth - 0.5) * 10;
        mouseRef.current.y = (event.clientY / window.innerHeight - 0.5) * 10;
        mouseRef.current.initialized = true;
      }, 10),
      []
    );

    const handleResize = useCallback(
      debounce(() => {
        const container = containerRef.current;
        if (container && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect =
            container.clientWidth / container.clientHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(
            container.clientWidth,
            container.clientHeight
          );
        }
      }, 100),
      []
    );

    useEffect(() => {
      setupThree();
      updateParticleTargets();
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("resize", handleResize);
      animate();

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(animationFrameRef.current);
        if (containerRef.current) containerRef.current.innerHTML = "";
        if (rendererRef.current) rendererRef.current.dispose();
        particlesRef.current.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        mouseRef.current.initialized = false;
      };
    }, [
      setupThree,
      updateParticleTargets,
      animate,
      handleMouseMove,
      handleResize,
    ]);

    return { updateParticleTargets };
  };

  useThreeSetup(threeContainerRef, isProfessional);

  const features = [
    { name: "Dashboard", video: "/videos/demo1.mp4" },
    { name: "Team", video: "/videos/demo2.mp4" },
    { name: "Features", video: "/videos/demo3.mp4" },
  ];

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) videoRef.current.volume = newVolume;
  };

  const handleProgress = () => {
    const video = videoRef.current;
    if (!video) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTime = (e.target.value / 100) * video.duration;
    video.currentTime = seekTime;
    setProgress(e.target.value);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.addEventListener("timeupdate", handleProgress);
    return () => video.removeEventListener("timeupdate", handleProgress);
  }, [volume]);

  return (
    <div className="main-homepage-container" role="main">
      <MainNavbar />

      <div className="content-sections">
        <section className="hero-section" aria-labelledby="hero-title">
          <canvas ref={heroCanvasRef} className="hero-canvas" />

          <div className="hero-content">
            <div className="titleMainpage">
              <div className="gradient-text-container">
                <h1 id="hero-title">
                  <span
                    className="gradient-text smoke-text"
                    data-text="One Platform,"
                    style={{ "--hue": "260deg" }}
                  >
                    One Platform,
                  </span>
                  <br />
                  <span
                    className="gradient-text smoke-text"
                    data-text="Two Worlds"
                    style={{ "--hue": "180deg" }}
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

                    {/* Hover effect elements */}
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
                    <span className="indicator-text pulse-text">
                      Professional
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-scroll-indicator">
              <div className="scroll-line"></div>
              <span className="flicker-text">Scroll to explore</span>
            </div>

            <div className="hero-background-grid"></div>

            {/* Floating particles in the background */}
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
        <section
          className="video-showcase-section"
          aria-labelledby="video-showcase-title"
        >
          <img
            src="/aurora.d2a6947c3dcfb777c25f.webp"
            alt="Aurora Background"
            className="video-bg-image"
            loading="lazy"
          />
          <div className="video-content">
            <div className="feature-header">
              <h2 id="video-showcase-title">
                One platform. Infinite possibilities
              </h2>
              <p>
                Build your brand, share your world, and connect deeper — all in
                one place.
              </p>
            </div>

            <div className="tablet-wrapper">
              <div className="tablet-normal">
                <video
                  id="feature-video"
                  ref={videoRef}
                  src={videoSrc}
                  autoPlay
                  muted={!volume}
                  loop
                  playsInline
                  aria-label="Feature demonstration video"
                />
                <div className="video-controls">
                  <button
                    className="play-pause-icon"
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                  >
                    {isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSeek}
                    className="video-progress"
                    aria-label="Video progress"
                  />
                  <div className="volume-control">
                    <button
                      onClick={() => setVolume(volume > 0 ? 0 : 0.5)}
                      aria-label={volume > 0 ? "Mute" : "Unmute"}
                    >
                      {volume > 0 ? <FaVolumeUp /> : <FaVolumeMute />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="volume-slider"
                      aria-label="Volume control"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              className="feature-navbar"
              role="navigation"
              aria-label="Feature selection"
            >
              {features.map((feature, idx) => (
                <button
                  key={idx}
                  onClick={() => setVideoSrc(feature.video)}
                  className={videoSrc === feature.video ? "active" : ""}
                  aria-current={videoSrc === feature.video ? "true" : "false"}
                >
                  {feature.name}
                </button>
              ))}
            </div>
          </div>
        </section>
        <section
          className="toggle-section"
          aria-labelledby="toggle-section-title"
        >
          <div className="toggle-section-bg-overlay"></div>
          <div className="toggle-section-container">
            <div className="toggle-content">
              <h2 id="toggle-section-title">Seamless Integration</h2>
              <p>Connect your professional and personal worlds effortlessly</p>

              <div className="toggle-switch-container">
                <div className="toggle-switch">
                  <label
                    className="switch"
                    aria-label="Toggle between professional and personal mode"
                  >
                    <input
                      type="checkbox"
                      checked={!isProfessional}
                      onChange={() => setIsProfessional((prev) => !prev)}
                    />
                    <span className="slider round"></span>
                  </label>
                  <p className="mode-label">
                    {isProfessional ? "Professional Mode" : "Personal Mode"}
                  </p>
                </div>

                <div className="mode-description">
                  <h3>
                    {isProfessional
                      ? "Professional Network"
                      : "Personal Connections"}
                  </h3>
                  <p>
                    {isProfessional
                      ? "Showcase your skills with a polished profile, connect with colleagues, and grow your career."
                      : "Share moments with friends and family in a private, authentic space."}
                  </p>
                </div>
              </div>

              <div
                id="three-canvas-container"
                ref={threeContainerRef}
                style={{ width: "100%", height: "300px" }}
                aria-hidden="true"
              />
            </div>

            <div className="toggle-image-container">
              <div className="image-frame">
                <img
                  src={
                    isProfessional
                      ? "/night-sky-glows-with-aurora-snowy-mountains-generative-ai.webp"
                      : "/Earth-From-Space-HD-Backgrounds.jpg"
                  }
                  alt={isProfessional ? "Professional Life" : "Personal Life"}
                  className="life-image"
                  loading="lazy"
                />
                <div className="image-glow"></div>
              </div>
              <p className="life-quote">
                {isProfessional
                  ? "“Professionalism is not about the job you do, but how you do the job.”"
                  : "“The most important things in life aren't things.”"}
              </p>
            </div>
          </div>
        </section>
        <section
          className="meeting-room-section"
          aria-labelledby="meeting-room-title"
        >
          <div className="meeting-room-content">
            <div className="meeting-room-header">
              <h2 id="meeting-room-title">Linkipax Meeting Room</h2>
              <p className="meeting-room-subtitle">
                Connect globally with our seamless video conferencing platform
              </p>
            </div>

            <div className="meeting-room-features">
              <div className="meeting-room-globe">
                <div className="globe-container">
                  <World globeConfig={globeConfig} data={sampleData} />
                </div>
              </div>

              <div className="meeting-room-details">
                <div className="feature-card">
                  <div className="feature-icon">
                    <FaVideo aria-hidden="true" />
                  </div>
                  <h3>High-Quality Video</h3>
                  <p>
                    Crystal clear video calls with adaptive bitrate for any
                    connection.
                  </p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <FaGlobe aria-hidden="true" />
                  </div>
                  <h3>Global Connectivity</h3>
                  <p>
                    Low-latency connections worldwide with our optimized
                    network.
                  </p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <FaLanguage aria-hidden="true" />
                  </div>
                  <h3>Real-time Translation</h3>
                  <p>
                    Speak in your language, others hear in theirs with
                    AI-powered translation.
                  </p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <FaUsers aria-hidden="true" />
                  </div>
                  <h3>Collaboration Tools</h3>
                  <p>
                    Screen sharing, whiteboard, and document collaboration
                    built-in.
                  </p>
                </div>
              </div>
            </div>

            <div className="meeting-room-cta">
              <div className="status-badge">
                <span className="badge-pulse"></span>
                <span>Beta Release in Progress</span>
              </div>
              <p className="release-timeline">
                Full release with all features coming in Q3 2025
              </p>
              <button
                className="cta-button"
                aria-label="Join waitlist for early access"
              >
                Join Waitlist for Early Access
              </button>
            </div>
          </div>
        </section>
        <section
          className="opportunities-section"
          aria-labelledby="opportunities-title"
        >
          <div className="opportunities-content">
            <div className="opportunities-header">
              <h2 id="opportunities-title">Discover Opportunities</h2>
              <p className="opportunities-subtitle">
                AI-curated opportunities tailored to your profile and interests
              </p>
            </div>

            <div className="opportunity-cards">
              <div className="opportunity-card">
                <div className="card-icon" aria-hidden="true">
                  🚀
                </div>
                <h3>AI-Suggested Jobs</h3>
                <p>
                  Get matched with ideal positions based on your skills,
                  experience, and preferences.
                </p>
                <div className="card-highlight">
                  <span>95% relevance matching</span>
                </div>
              </div>

              <div className="opportunity-card">
                <div className="card-icon" aria-hidden="true">
                  🏆
                </div>
                <h3>Hackathon Alerts</h3>
                <p>
                  Personalized hackathon recommendations with team matching
                  features.
                </p>
                <div className="card-highlight">
                  <span>200+ events monthly</span>
                </div>
              </div>

              <div className="opportunity-card">
                <div className="card-icon" aria-hidden="true">
                  📚
                </div>
                <h3>Learning Paths</h3>
                <p>
                  Dynamic course recommendations that evolve with your career
                  goals.
                </p>
                <div className="card-highlight">
                  <span>10,000+ resources</span>
                </div>
              </div>
            </div>

            <div className="opportunities-stats">
              <div className="stat-item">
                <div className="stat-number">10,000+</div>
                <div className="stat-label">Opportunities</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">85%</div>
                <div className="stat-label">Match Accuracy</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24h</div>
                <div className="stat-label">Daily Updates</div>
              </div>
            </div>
          </div>
        </section>
        <section className="team-section" aria-labelledby="team-title">
          <div className="team-content">
            <div className="team-header">
              <h2 id="team-title">Meet Our Team</h2>
              <p className="team-subtitle">
                The passionate people behind Linkipax
              </p>
            </div>

            <div className="team-members">
              <AnimatedTooltip items={teamMembers} />
            </div>

            <div className="team-values">
              <div className="value-card">
                <h3>Innovation</h3>
                <p>
                  We constantly push boundaries to deliver cutting-edge
                  solutions
                </p>
              </div>
              <div className="value-card">
                <h3>Transparency</h3>
                <p>Open communication and honesty in everything we do</p>
              </div>
              <div className="value-card">
                <h3>User Focus</h3>
                <p>
                  Your needs are at the center of our design and development
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="network-section" aria-labelledby="network-title">
          <div className="network-content">
            <div className="network-header">
              <h2 id="network-title">Our Global Network</h2>
              <p className="network-subtitle">
                Connecting professionals and communities worldwide
              </p>
            </div>

            <div className="network-map">
              <WorldMap dots={mapConnections} lineColor="#3b82f6" />
            </div>

            <div className="network-stats">
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Countries</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">10M+</div>
                <div className="stat-label">Connections</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support</div>
              </div>
            </div>
          </div>
        </section>
        <footer className="main-footer" aria-label="Footer">
          <div className="footer-content">
            <div className="footer-top">
              <div className="footer-brand">
                <h3>Linkipax</h3>
                <p>Bridging your professional and personal worlds seamlessly</p>
                <div className="footer-social">
                  <a href="#" aria-label="Visit our LinkedIn page">
                    <FaLinkedin />
                  </a>
                  <a href="#" aria-label="Visit our Twitter page">
                    <FaTwitter />
                  </a>
                  <a href="#" aria-label="Visit our GitHub page">
                    <FaGithub />
                  </a>
                  <a href="#" aria-label="Visit our Instagram page">
                    <FaInstagram />
                  </a>
                </div>
              </div>

              <div className="footer-links">
                <div className="link-column">
                  <h4>Product</h4>
                  <a href="#">Features</a>
                  <a href="#">Pricing</a>
                  <a href="#">Integrations</a>
                  <a href="#">Updates</a>
                </div>
                <div className="link-column">
                  <h4>Company</h4>
                  <a href="#">About</a>
                  <a href="#">Careers</a>
                  <a href="#">Blog</a>
                  <a href="#">Press</a>
                </div>
                <div className="link-column">
                  <h4>Resources</h4>
                  <a href="#">Help Center</a>
                  <a href="#">Tutorials</a>
                  <a href="#">API Docs</a>
                  <a href="#">Community</a>
                </div>
                <div className="link-column">
                  <h4>Legal</h4>
                  <a href="#">Privacy</a>
                  <a href="#">Terms</a>
                  <a href="#">Security</a>
                  <a href="#">Cookies</a>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <div className="newsletter">
                <h4>Stay Updated</h4>
                <div className="newsletter-form">
                  <input
                    type="email"
                    placeholder="Your email address"
                    aria-label="Email address for newsletter"
                  />
                  <button aria-label="Subscribe to newsletter">
                    <FaEnvelope /> Subscribe
                  </button>
                </div>
              </div>

              <div className="footer-legal">
                <p>© 2025 Linkipax. All rights reserved.</p>
                <div className="footer-locale">
                  <span>🌐 English</span>
                  <span>📍 United States</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainPage;

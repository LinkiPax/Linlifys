import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { debounce } from "lodash";

export default function ToggleIntegration() {
  const [isProfessional, setIsProfessional] = useState(true);
  const threeContainerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Custom hook for Three.js setup in toggle section
  const useThreeSetup = (containerRef, isProfessionalMode) => {
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
      new THREE.Color(isProfessionalMode ? 0x00aaff : 0xffaa00)
    );

    const setupThree = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;

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

      const particleGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: currentColor.current,
        transparent: true,
        opacity: 0.8,
      });

      particleTargets.current = [];
      particlePositions.current = [];
      lines.current = [];
      particlesRef.current.clear();
      
      for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 4 + Math.random() * 2;
        const pos = isProfessionalMode
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
    }, [containerRef, isProfessionalMode]);

    const updateParticleTargets = useCallback(() => {
      currentColor.current.set(isProfessionalMode ? 0x00aaff : 0xffaa00);
      
      if (!particleTargets.current || particleTargets.current.length === 0) {
        particleTargets.current = new Array(particleCount);
        for (let i = 0; i < particleCount; i++) {
          particleTargets.current[i] = new THREE.Vector3();
        }
      }
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 4 + Math.random() * 2;
        const newPos = isProfessionalMode
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
        
        if (particleTargets.current[i]) {
          particleTargets.current[i].copy(newPos);
        } else {
          particleTargets.current[i] = newPos.clone();
        }
      }
    }, [isProfessionalMode]);

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
          
          if (target) {
            child.position.lerp(target, 0.05);
          }

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

  return (
    <section className="toggle-section" aria-labelledby="toggle-section-title">
      <div className="toggle-section-bg-overlay" ref={threeContainerRef}></div>
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
                {isProfessional ? "Professional Network" : "Personal Connections"}
              </h3>
              <p>
                {isProfessional
                  ? "Showcase your skills with a polished profile, connect with colleagues, and grow your career."
                  : "Share moments with friends and family in a private, authentic space."}
              </p>
            </div>
          </div>

          <div className="chat-demo">
            <h3>Real-time Translation Chat</h3>
            <p className="in-progress-label">Feature in development</p>
            <div className="chat-container">
              <div className="chat-message received">
                <div className="message-content">
                  <p>Hello! How are you doing today?</p>
                </div>
                <div className="message-translation">
                  <span className="language-label">English → Spanish</span>
                  <p>¡Hola! ¿Cómo estás hoy?</p>
                </div>
              </div>
              <div className="chat-message sent">
                <div className="message-content">
                  <p>I'm doing great! Just finished a project.</p>
                </div>
                <div className="message-translation">
                  <span className="language-label">Spanish → English</span>
                  <p>¡Me va muy bien! Acabo de terminar un proyecto.</p>
                </div>
              </div>
              <div className="chat-message received">
                <div className="message-content">
                  <p>That's awesome! What kind of project was it?</p>
                </div>
                <div className="message-translation">
                  <span className="language-label">English → Spanish</span>
                  <p>¡Eso es genial! ¿Qué tipo de proyecto era?</p>
                </div>
              </div>
            </div>
            <div className="chat-input">
              <input
                type="text"
                placeholder="Type your message here..."
                disabled
              />
              <button disabled>Send</button>
            </div>
          </div>
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
  );
}

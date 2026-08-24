/**
 * heroCanvas.js - 3D Interactive Hero Particle Canvas (Three.js)
 * Implements lightweight, battery-optimized ambient particle constellation.
 * Features:
 * - Device pixel ratio capping (max 2)
 * - IntersectionObserver loop pausing
 * - Strict geometry & material disposal on unload
 * - Zero pointer event interference (pointer-events: none)
 */

(function () {
    'use strict';

    function initHeroParticleCanvas() {
        const heroCard = document.getElementById('portal-hero-auth-card');
        const canvas = document.getElementById('hero-particle-canvas');

        if (!heroCard || !canvas) return;
        if (typeof THREE === 'undefined') return;

        let scene, camera, renderer, particles, particleGeo, particleMat;
        let animationFrameId = null;
        let isVisible = true;

        const particleCount = window.innerWidth < 768 ? 45 : 90;
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        // 1. Scene & Camera Setup
        scene = new THREE.Scene();
        const width = heroCard.clientWidth;
        const height = heroCard.clientHeight;

        camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.z = 220;

        // 2. High-Performance WebGL Renderer
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true,
                powerPreference: 'low-power'
            });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        } catch (e) {
            console.warn('[HeroCanvas] WebGL not supported or initialization skipped:', e);
            return;
        }

        // 3. Particle Constellation Geometry & Accents
        const tealColor = new THREE.Color('#14b8a6');
        const slateColor = new THREE.Color('#52525b');
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * (width * 0.75);
            positions[i * 3 + 1] = (Math.random() - 0.5) * (height * 0.75);
            positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

            velocities.push({
                x: (Math.random() - 0.5) * 0.25,
                y: (Math.random() - 0.5) * 0.25,
                z: (Math.random() - 0.5) * 0.1
            });

            const mixedColor = Math.random() > 0.4 ? tealColor : slateColor;
            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
        }

        particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Create round particle texture using canvas programmatically
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = 32;
        textureCanvas.height = 32;
        const ctx = textureCanvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.3, 'rgba(20, 184, 166, 0.8)');
        grad.addColorStop(1, 'rgba(20, 184, 166, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);

        const particleTexture = new THREE.CanvasTexture(textureCanvas);

        particleMat = new THREE.PointsMaterial({
            size: window.innerWidth < 768 ? 6 : 8,
            vertexColors: true,
            map: particleTexture,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        // 4. Subtle Interactive Mouse Drift
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        window.addEventListener('mousemove', (e) => {
            const rect = heroCard.getBoundingClientRect();
            if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
                mouseX = (e.clientX - rect.left - rect.width / 2) * 0.05;
                mouseY = (e.clientY - rect.top - rect.height / 2) * 0.05;
            }
        }, { passive: true });

        // 5. Optimized Render Loop
        function animate() {
            if (!isVisible) return;

            animationFrameId = requestAnimationFrame(animate);

            targetX += (mouseX - targetX) * 0.03;
            targetY += (mouseY - targetY) * 0.03;

            const posArr = particleGeo.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                posArr[i * 3] += velocities[i].x;
                posArr[i * 3 + 1] += velocities[i].y;
                posArr[i * 3 + 2] += velocities[i].z;

                // Boundary bounce
                const boundX = width * 0.45;
                const boundY = height * 0.45;
                if (posArr[i * 3] > boundX || posArr[i * 3] < -boundX) velocities[i].x *= -1;
                if (posArr[i * 3 + 1] > boundY || posArr[i * 3 + 1] < -boundY) velocities[i].y *= -1;
            }

            particleGeo.attributes.position.needsUpdate = true;
            particles.rotation.x = targetY * 0.002;
            particles.rotation.y = targetX * 0.002;

            renderer.render(scene, camera);
        }

        // 6. IntersectionObserver to Pause Animation when Hero is off-screen
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    if (!isVisible) {
                        isVisible = true;
                        animate();
                    }
                } else {
                    isVisible = false;
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                    }
                }
            });
        }, { threshold: 0.1 });

        observer.observe(heroCard);

        // 7. Responsive Resize Handler
        function handleResize() {
            if (!heroCard || !renderer || !camera) return;
            const newW = heroCard.clientWidth;
            const newH = heroCard.clientHeight;
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
        }

        window.addEventListener('resize', handleResize, { passive: true });

        // 8. Lifecycle Teardown
        window.addEventListener('beforeunload', () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            observer.disconnect();
            if (particleGeo) particleGeo.dispose();
            if (particleMat) particleMat.dispose();
            if (particleTexture) particleTexture.dispose();
            if (renderer) renderer.dispose();
        });

        // Start initial animation
        animate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeroParticleCanvas);
    } else {
        initHeroParticleCanvas();
    }
})();
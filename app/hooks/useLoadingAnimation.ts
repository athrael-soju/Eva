import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CustomCurve } from '../components/three/CustomCurve';

interface UseLoadingAnimationProps {
    onAnimationComplete?: () => void;
    isAgentConnected?: boolean;
    isAgentSpeaking?: boolean;
    audioFrequencyData?: Uint8Array | null;
    shouldReset?: boolean;
}

export const useLoadingAnimation = ({
    onAnimationComplete,
    isAgentConnected,
    isAgentSpeaking,
    audioFrequencyData,
    shouldReset,
}: UseLoadingAnimationProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const completedRef = useRef(false);
    const completionCallbackFiredRef = useRef(false);
    const animationStartedRef = useRef(false);
    const isAgentConnectedRef = useRef(false);
    const isAgentSpeakingRef = useRef(false);
    const audioDataRef = useRef<Uint8Array | null>(null);
    const animateStepRef = useRef(0);
    const isReversingRef = useRef(false);
    const idleAnimationTimeRef = useRef(0);

    // Update ref when isAgentConnected changes
    useEffect(() => {
        isAgentConnectedRef.current = isAgentConnected || false;
    }, [isAgentConnected]);

    // Update ref when isAgentSpeaking changes
    useEffect(() => {
        isAgentSpeakingRef.current = isAgentSpeaking || false;
    }, [isAgentSpeaking]);

    // Update audio data ref
    useEffect(() => {
        audioDataRef.current = audioFrequencyData || null;
    }, [audioFrequencyData]);

    // Handle reset - trigger smooth reverse animation
    useEffect(() => {
        if (shouldReset) {
            isReversingRef.current = true;
            animationStartedRef.current = false;
        }
    }, [shouldReset]);

    useEffect(() => {
        const currentContainer = containerRef.current;
        if (!currentContainer) return;

        const areawidth = window.innerWidth;
        const areaheight = window.innerHeight;

        // Make canvas size responsive
        const canvassize = Math.min(Math.min(areawidth, areaheight));

        const length = 30;
        const radius = 5.6;

        const rotatevalue = 0.035;
        let acceleration = 0;

        const pi2 = Math.PI * 2;

        const group = new THREE.Group();

        // Camera setup
        const camera = new THREE.PerspectiveCamera(65, 1, 1, 10000);
        camera.position.z = 150;

        // Scene setup
        const scene = new THREE.Scene();
        scene.add(group);

        // Create tube mesh
        const mesh = new THREE.Mesh(
            new THREE.TubeGeometry(new CustomCurve(length, radius, pi2), 200, 1.1, 2, true),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
            })
        );
        group.add(mesh);

        // Ring cover
        const ringcover = new THREE.Mesh(
            new THREE.PlaneGeometry(50, 15, 1),
            new THREE.MeshBasicMaterial({ color: 0xd1684e, opacity: 0, transparent: true })
        );
        ringcover.position.x = length + 1;
        ringcover.rotation.y = Math.PI / 2;
        group.add(ringcover);

        // Ring
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(4.3, 5.55, 32),
            new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0, transparent: true })
        );
        ring.position.x = length + 1.1;
        ring.rotation.y = Math.PI / 2;
        group.add(ring);

        // Fake shadow
        for (let i = 0; i < 10; i++) {
            const plain = new THREE.Mesh(
                new THREE.PlaneGeometry(length * 2 + 1, radius * 3, 1),
                new THREE.MeshBasicMaterial({ color: 0xd1684e, transparent: true, opacity: 0.13 })
            );
            plain.position.z = -2.5 + i * 0.5;
            group.add(plain);
        }

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true, // Enable transparency
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(canvassize, canvassize);
        renderer.setClearColor(0x000000, 0);

        // Style the canvas element
        const canvas = renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.left = '50%';
        canvas.style.top = '50%';
        canvas.style.transform = 'translate(-50%, -50%)';
        canvas.style.width = `${canvassize}px`;
        canvas.style.height = `${canvassize}px`;
        canvas.style.cursor = 'default';

        currentContainer.appendChild(canvas);

        // Raycaster for detecting clicks on the animation
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Create an invisible clickable area that matches the geometry dimensions
        const clickableArea = new THREE.Mesh(
            new THREE.CapsuleGeometry(radius * 1.5, length * 1.5),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        clickableArea.rotation.z = Math.PI / 2; // Rotate to align with x-axis
        group.add(clickableArea);

        // Click handler to start animation
        const handleCanvasClick = (event: MouseEvent) => {
            if (!animationStartedRef.current) {
                const rect = canvas.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects([mesh, ring, ringcover, clickableArea]);

                if (intersects.length > 0) {
                    animationStartedRef.current = true;

                    if (!completionCallbackFiredRef.current && onAnimationComplete) {
                        completionCallbackFiredRef.current = true;
                        onAnimationComplete();
                    }
                }
            }
        };

        canvas.addEventListener('click', handleCanvasClick);

        // Mouse move handler
        const handleMouseMove = (event: MouseEvent) => {
            if (!animationStartedRef.current) {
                const rect = canvas.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects([mesh, ring, ringcover, clickableArea]);

                canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
            } else {
                canvas.style.cursor = 'default';
            }
        };

        canvas.addEventListener('mousemove', handleMouseMove);

        // Easing function
        const easing = (t: number, b: number, c: number, d: number) => {
            if ((t /= d / 2) < 1) return (c / 2) * t * t + b;
            return (c / 2) * ((t -= 2) * t * t + 2) + b;
        };

        // Render function
        const render = () => {
            let progress: number = 0;

            if (isReversingRef.current) {
                const reverseSpeed = 2;
                animateStepRef.current = Math.max(0, animateStepRef.current - reverseSpeed);

                if (animateStepRef.current === 0) {
                    isReversingRef.current = false;
                    completedRef.current = false;
                    completionCallbackFiredRef.current = false;
                    idleAnimationTimeRef.current = 0;
                }
            } else if (animationStartedRef.current) {
                const maxStep = isAgentConnectedRef.current ? 240 : 120;
                const speed = isAgentConnectedRef.current ? 1 : 0.25;
                animateStepRef.current = Math.max(0, Math.min(maxStep, animateStepRef.current + speed));
            }

            if (animateStepRef.current >= 240) {
                completedRef.current = true;
                // Increment idle animation time for spinning effect (negative for clockwise)
                idleAnimationTimeRef.current -= 0.01;
            }

            acceleration = easing(animateStepRef.current, 0, 1, 240);

            if (acceleration > 0.35) {
                progress = (acceleration - 0.35) / 0.65;
                group.rotation.y = (-Math.PI / 2) * progress;
                group.position.z = 50 * progress;
                progress = Math.max(0, (acceleration - 0.97) / 0.03);
                mesh.material.opacity = 1 - progress;
                (ringcover.material as THREE.MeshBasicMaterial).opacity = progress;
                (ring.material as THREE.MeshBasicMaterial).opacity = progress;
                ring.scale.x = ring.scale.y = 0.9 + 0.1 * progress;

                // Spinning animation when completed (clockwise)
                if (completedRef.current) {
                    ring.rotation.z = idleAnimationTimeRef.current;
                }
            } else {
                group.rotation.y = 0;
                group.position.z = 0;
                mesh.material.opacity = 1;
                (ringcover.material as THREE.MeshBasicMaterial).opacity = 0;
                (ring.material as THREE.MeshBasicMaterial).opacity = 0;
                ring.scale.x = ring.scale.y = 0.9;
            }

            renderer.render(scene, camera);
        };

        // Animation loop
        const animate = () => {
            mesh.rotation.x += rotatevalue + acceleration;
            render();
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            const newCanvasSize = Math.min(Math.min(newWidth, newHeight));

            renderer.setSize(newCanvasSize, newCanvasSize);
            canvas.style.width = `${newCanvasSize}px`;
            canvas.style.height = `${newCanvasSize}px`;
        };

        window.addEventListener('resize', handleResize, false);

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            canvas.removeEventListener('click', handleCanvasClick);
            canvas.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);

            if (currentContainer && renderer.domElement) {
                currentContainer.removeChild(renderer.domElement);
            }

            renderer.dispose();
        };
    }, [onAnimationComplete]);

    return containerRef;
};

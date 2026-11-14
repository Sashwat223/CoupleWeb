import React, { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

export type StageMood = 'hero' | 'proposal' | 'celebration'

interface DuoStage3DProps {
  mood: StageMood
  mouseParallax?: { x: number; y: number }
  scrollProgress?: number
  className?: string
  showBoy?: boolean
  showGirl?: boolean
}

interface SingleGLBProps {
  url: string
  basePosition: [number, number, number]
  baseRotationY: number
  scaleMultiplier: number
  mood: StageMood
  side: 'left' | 'right'
  mouseParallax: { x: number; y: number }
  scrollProgress: number
}

interface RigBones {
  head?: THREE.Object3D
  neck?: THREE.Object3D
  spine?: THREE.Object3D
  hips?: THREE.Object3D
  leftArm?: THREE.Object3D
  rightArm?: THREE.Object3D
}

const SingleGLBCharacter: React.FC<SingleGLBProps> = ({
  url,
  basePosition,
  baseRotationY,
  scaleMultiplier,
  mood,
  side,
  mouseParallax,
  scrollProgress,
}) => {
  const gltf = useLoader(GLTFLoader, url)
  const groupRef = useRef<THREE.Group | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const bonesRef = useRef<RigBones>({})
  const baseBoneRotRef = useRef<Record<string, THREE.Euler>>({})
  const hipsBasePosRef = useRef<THREE.Vector3 | null>(null)

  const clonedScene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene])

  // Compute bounding box AFTER applying frame 0 of animation so root-bone offsets are accounted for
  const { normalizedScale, offsetVec } = useMemo(() => {
    let tempMixer: THREE.AnimationMixer | null = null
    if (gltf.animations && gltf.animations.length > 0) {
      tempMixer = new THREE.AnimationMixer(clonedScene)
      const action = tempMixer.clipAction(gltf.animations[0])
      action.play()
      tempMixer.update(0.05)
    }

    clonedScene.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    if (tempMixer) {
      tempMixer.stopAllAction()
    }

    const maxDim = Math.max(size.x, size.y, size.z, 0.001)
    const targetHeight = 2.25 * scaleMultiplier
    const scale = targetHeight / maxDim

    // Ground feet at y = -1.12, center X and Z at 0
    return {
      normalizedScale: scale,
      offsetVec: new THREE.Vector3(
        -center.x * scale,
        -box.min.y * scale - 1.12,
        -center.z * scale
      ),
    }
  }, [clonedScene, gltf.animations, scaleMultiplier])

  useEffect(() => {
    const foundBones: RigBones = {}
    const baseRots: Record<string, THREE.Euler> = {}

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.frustumCulled = false
        mesh.castShadow = true
        mesh.receiveShadow = true

        if (mesh.material) {
          const mats = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          mats.forEach((mat) => {
            mat.side = THREE.DoubleSide
            if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
              const std = mat as THREE.MeshStandardMaterial
              std.envMapIntensity = 1.45
              if (std.metalness > 0.45) std.metalness = 0.35
              if (std.map) {
                std.map.colorSpace = THREE.SRGBColorSpace
              }
            }
            mat.needsUpdate = true
          })
        }
      }

      if ((child as THREE.Bone).isBone || child.type === 'Bone') {
        const n = child.name.toLowerCase()
        if (!foundBones.hips && (n.includes('hip') || n.includes('pelvis') || n === 'root')) {
          foundBones.hips = child
          hipsBasePosRef.current = child.position.clone()
        } else if (!foundBones.head && n.includes('head')) {
          foundBones.head = child
          baseRots.head = child.rotation.clone()
        } else if (!foundBones.neck && n.includes('neck')) {
          foundBones.neck = child
          baseRots.neck = child.rotation.clone()
        } else if (!foundBones.spine && (n.includes('spine2') || n.includes('spine1') || n.includes('spine'))) {
          foundBones.spine = child
          baseRots.spine = child.rotation.clone()
        } else if (!foundBones.leftArm && (n.includes('leftarm') || n.includes('upper_arm.l') || n.includes('upperarm_l'))) {
          foundBones.leftArm = child
          baseRots.leftArm = child.rotation.clone()
        } else if (!foundBones.rightArm && (n.includes('rightarm') || n.includes('upper_arm.r') || n.includes('upperarm_r'))) {
          foundBones.rightArm = child
          baseRots.rightArm = child.rotation.clone()
        }
      }
    })

    bonesRef.current = foundBones
    baseBoneRotRef.current = baseRots

    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(clonedScene)
      // Play clip at a gentle romantic pace; if multiple clips exist, pick mood-appropriate or blend
      const clipIndex =
        mood === 'celebration' && gltf.animations.length > 1
          ? 1
          : 0
      const action = mixer.clipAction(gltf.animations[clipIndex])
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.timeScale = mood === 'celebration' ? 0.95 : 0.7
      action.play()
      mixerRef.current = mixer
    }

    return () => {
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
    }
  }, [clonedScene, gltf.animations, mood])

  useFrame((state, delta) => {
    mixerRef.current?.update(Math.min(delta, 0.05))

    // Lock hips X/Z drift so characters never wander into each other
    if (bonesRef.current.hips && hipsBasePosRef.current) {
      bonesRef.current.hips.position.x = hipsBasePosRef.current.x
      bonesRef.current.hips.position.z = hipsBasePosRef.current.z
    }

    // Layer cute procedural bone expressiveness on top of the clip
    const t = state.clock.getElapsedTime()
    const phase = side === 'left' ? 0 : Math.PI * 0.7
    const inwardSign = side === 'left' ? 1 : -1

    if (bonesRef.current.head && baseBoneRotRef.current.head) {
      const base = baseBoneRotRef.current.head
      const cuteTilt =
        mood === 'celebration'
          ? Math.sin(t * 2.4 + phase) * 0.09
          : Math.sin(t * 1.1 + phase) * 0.06
      const lookInward = inwardSign * (0.08 + scrollProgress * 0.12)
      bonesRef.current.head.rotation.z = base.z + cuteTilt
      bonesRef.current.head.rotation.y = base.y + lookInward + mouseParallax.x * 0.12
      bonesRef.current.head.rotation.x = base.x + Math.sin(t * 1.4 + phase) * 0.04
    }

    if (bonesRef.current.spine && baseBoneRotRef.current.spine) {
      const base = baseBoneRotRef.current.spine
      const breath = Math.sin(t * 1.8 + phase) * 0.035
      bonesRef.current.spine.rotation.x = base.x + breath
      bonesRef.current.spine.rotation.z =
        base.z + Math.sin(t * 0.9 + phase) * 0.025
    }

    if (!groupRef.current) return

    // Scroll-reactive choreography: gentle inward turn & subtle elevation
    const scrollTurn = (scrollProgress - 0.35) * inwardSign * 0.22
    const scrollFloat = Math.sin(scrollProgress * Math.PI) * 0.04

    let idleY = Math.sin(t * 1.5 + phase) * 0.025
    let idleRotZ = Math.sin(t * 0.85 + phase) * 0.018

    if (mood === 'celebration') {
      idleY = Math.abs(Math.sin(t * 2.5 + phase)) * 0.075
      idleRotZ = Math.sin(t * 2.0 + phase) * 0.03
    } else if (mood === 'proposal') {
      idleY = Math.sin(t * 1.3 + phase) * 0.02
    }

    const targetX = basePosition[0] + mouseParallax.x * 0.06
    const targetY = basePosition[1] + idleY + scrollFloat - mouseParallax.y * 0.03
    const targetZ = basePosition[2]

    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX,
      0.06
    )
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.08
    )
    groupRef.current.position.z = targetZ

    const targetRotY = baseRotationY + scrollTurn + mouseParallax.x * 0.14
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      0.06
    )
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      idleRotZ,
      0.06
    )
  })

  return (
    <group
      ref={groupRef}
      position={basePosition}
      rotation={[0, baseRotationY, 0]}
    >
      <group
        position={[offsetVec.x, offsetVec.y, offsetVec.z]}
        scale={[normalizedScale, normalizedScale, normalizedScale]}
      >
        <primitive object={clonedScene} />
      </group>
    </group>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
}

class CanvasErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('DuoStage3D error:', error)
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export const DuoStage3D: React.FC<DuoStage3DProps> = ({
  mood,
  mouseParallax = { x: 0, y: 0 },
  scrollProgress = 0,
  className = '',
  showBoy = true,
  showGirl = true,
}) => {
  // Generous spacing so the two models NEVER collide
  const singleMode = showBoy !== showGirl
  const boyPos: [number, number, number] = singleMode
    ? [0, 0, 0]
    : mood === 'celebration'
      ? [-0.95, 0, 0.08]
      : [-1.12, 0, 0]
  const girlPos: [number, number, number] = singleMode
    ? [0, 0, 0]
    : mood === 'celebration'
      ? [0.95, 0, 0.08]
      : [1.12, 0, 0]

  return (
    <div className={`relative ${className}`}>
      {/* Golden halo glow behind the characters */}
      <div
        aria-hidden="true"
        className="golden-halo pointer-events-none absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      />
      <CanvasErrorBoundary>
        <Canvas
          camera={{
            position: [0, 0.05, singleMode ? 4.3 : 5.35],
            fov: 36,
            near: 0.05,
            far: 100,
          }}
          dpr={[1, 2]}
          gl={{
            alpha: true,
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          style={{ background: 'transparent' }}
        >
          <Environment resolution={256}>
            <Lightformer
              form="ring"
              intensity={2.4}
              color="#FFF8F0"
              scale={6}
              position={[0, 4, 3]}
            />
            <Lightformer
              form="circle"
              intensity={2.0}
              color="#E8C87E"
              scale={4}
              position={[4, 2, 2]}
            />
            <Lightformer
              form="circle"
              intensity={1.6}
              color="#FF6FA5"
              scale={4}
              position={[-4, 1, -1]}
            />
            <Lightformer
              form="rect"
              intensity={1.1}
              color="#122A6B"
              scale={[10, 4, 1]}
              position={[0, -3, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            />
          </Environment>

          <ambientLight intensity={1.15} color="#fff8f0" />
          <hemisphereLight args={['#fff8f0', '#122A6B', 0.9]} />
          <directionalLight
            position={[3, 5, 5]}
            intensity={1.85}
            color="#ffe9c4"
          />
          <directionalLight
            position={[-3.5, 3, 2]}
            intensity={1.1}
            color="#ff9ec2"
          />
          <pointLight position={[0, 1.4, 3.2]} intensity={1.25} color="#fff8f0" />

          {/* Soft golden ground ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.13, 0]}>
            <ringGeometry args={[singleMode ? 0.55 : 1.35, singleMode ? 0.72 : 1.55, 64]} />
            <meshBasicMaterial
              color="#E8C87E"
              transparent
              opacity={0.32}
              side={THREE.DoubleSide}
            />
          </mesh>

          <Sparkles
            count={mood === 'celebration' ? 44 : 24}
            scale={[4.2, 2.8, 1.8]}
            size={mood === 'celebration' ? 3.2 : 2.2}
            speed={0.45}
            color="#E8C87E"
            opacity={0.75}
          />

          <Suspense fallback={null}>
            {showBoy && (
              <SingleGLBCharacter
                url="./assets/models/sashwat.glb"
                basePosition={boyPos}
                baseRotationY={0.32}
                scaleMultiplier={1.0}
                mood={mood}
                side="left"
                mouseParallax={mouseParallax}
                scrollProgress={scrollProgress}
              />
            )}
            {showGirl && (
              <SingleGLBCharacter
                url="./assets/models/smriti.glb"
                basePosition={girlPos}
                baseRotationY={-0.32}
                scaleMultiplier={0.96}
                mood={mood}
                side="right"
                mouseParallax={mouseParallax}
                scrollProgress={scrollProgress}
              />
            )}
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  )
}

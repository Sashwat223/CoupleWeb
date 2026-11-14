import React, { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

interface CharacterStage3DProps {
  modelUrl: string
  className?: string
  mouseParallax?: { x: number; y: number }
  scaleMultiplier?: number
  yOffset?: number
  rotationY?: number
}

interface ModelInnerProps {
  url: string
  mouseParallax: { x: number; y: number }
  scaleMultiplier: number
  yOffset: number
  rotationY: number
}

function useLoadedCharacter(url: string): {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
} {
  const isGltf = /\.(glb|gltf)$/i.test(url)
  const loaded = useLoader(isGltf ? GLTFLoader : FBXLoader, url)

  return useMemo(() => {
    if (isGltf) {
      const gltf = loaded as unknown as {
        scene: THREE.Group
        animations: THREE.AnimationClip[]
      }
      return {
        scene: SkeletonUtils.clone(gltf.scene),
        animations: gltf.animations || [],
      }
    }
    const fbx = loaded as THREE.Group
    return {
      scene: SkeletonUtils.clone(fbx),
      animations: fbx.animations || [],
    }
  }, [loaded, isGltf])
}

const AnimatedCharacter: React.FC<ModelInnerProps> = ({
  url,
  mouseParallax,
  scaleMultiplier,
  yOffset,
  rotationY,
}) => {
  const { scene, animations } = useLoadedCharacter(url)
  const wrapperRef = useRef<THREE.Group | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  const { normalizedScale, offsetVec } = useMemo(() => {
    scene.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    const maxDim = Math.max(size.x, size.y, size.z, 0.001)
    const targetHeight = 2.4 * scaleMultiplier
    const scale = targetHeight / maxDim

    // Center X/Z at 0, place feet near -1.15 + yOffset
    return {
      normalizedScale: scale,
      offsetVec: new THREE.Vector3(
        -center.x * scale,
        -box.min.y * scale - 1.15 * scaleMultiplier + yOffset,
        -center.z * scale
      ),
    }
  }, [scene, scaleMultiplier, yOffset])

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.frustumCulled = false
        mesh.castShadow = true
        mesh.receiveShadow = true
        if (mesh.material) {
          const mats = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          mats.forEach((m) => {
            m.side = THREE.DoubleSide
            m.needsUpdate = true
          })
        }
      }
    })

    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene)
      const action = mixer.clipAction(animations[0])
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.timeScale = 0.9
      action.play()
      mixerRef.current = mixer
    }

    return () => {
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
    }
  }, [scene, animations])

  useFrame((state, delta) => {
    mixerRef.current?.update(Math.min(delta, 0.05))
    if (!wrapperRef.current) return

    const t = state.clock.getElapsedTime()
    const targetRotY =
      rotationY + mouseParallax.x * 0.18 + Math.sin(t * 0.65) * 0.05
    const targetRotX = -mouseParallax.y * 0.07 + Math.sin(t * 1.0) * 0.015
    const breathY = Math.sin(t * 1.5) * 0.02

    wrapperRef.current.rotation.y = THREE.MathUtils.lerp(
      wrapperRef.current.rotation.y,
      targetRotY,
      0.06
    )
    wrapperRef.current.rotation.x = THREE.MathUtils.lerp(
      wrapperRef.current.rotation.x,
      targetRotX,
      0.06
    )
    wrapperRef.current.position.y = breathY
  })

  return (
    <group ref={wrapperRef} rotation={[0, rotationY, 0]}>
      <group
        position={[offsetVec.x, offsetVec.y, offsetVec.z]}
        scale={[normalizedScale, normalizedScale, normalizedScale]}
      >
        <primitive object={scene} />
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
    console.error('3D Character render error:', error)
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export const CharacterStage3D: React.FC<CharacterStage3DProps> = ({
  modelUrl,
  className = '',
  mouseParallax = { x: 0, y: 0 },
  scaleMultiplier = 1,
  yOffset = 0,
  rotationY = 0,
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Golden halo glow behind the 3D characters */}
      <div
        aria-hidden="true"
        className="golden-halo pointer-events-none absolute left-1/2 top-1/2 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      />
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 0.15, 4.1], fov: 38, near: 0.05, far: 100 }}
          dpr={[1, 2]}
          gl={{
            alpha: true,
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={1.55} color="#fff8f0" />
          <hemisphereLight args={['#fff8f0', '#122A6B', 1.1]} />
          <directionalLight
            position={[3, 5, 4]}
            intensity={2.2}
            color="#e8c87e"
          />
          <directionalLight
            position={[-3, 3, -2]}
            intensity={1.4}
            color="#ff6fa5"
          />
          <pointLight position={[0, 1.5, 3]} intensity={1.35} color="#fff8f0" />
          <Suspense fallback={null}>
            <AnimatedCharacter
              url={modelUrl}
              mouseParallax={mouseParallax}
              scaleMultiplier={scaleMultiplier}
              yOffset={yOffset}
              rotationY={rotationY}
            />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  )
}

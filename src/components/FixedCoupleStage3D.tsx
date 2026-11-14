import React, { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'
import { SectionId } from './Navbar'

interface FixedCoupleStage3DProps {
  scrollProgress: number
  activeSection: SectionId
  mouseParallax: { x: number; y: number }
  started: boolean
}

interface RigBones {
  hips?: THREE.Object3D
  head?: THREE.Object3D
  spine?: THREE.Object3D
  leftArm?: THREE.Object3D
  rightArm?: THREE.Object3D
  leftForeArm?: THREE.Object3D
  rightForeArm?: THREE.Object3D
  leftHand?: THREE.Object3D
  rightHand?: THREE.Object3D
}

interface CharacterRunnerProps {
  url: string
  side: 'boy' | 'girl'
  scrollProgress: number
  activeSection: SectionId
  mouseParallax: { x: number; y: number }
}

// Reusable temp math objects for 60fps zero-GC 2-bone IK
const _sPos = new THREE.Vector3()
const _ePos = new THREE.Vector3()
const _hPos = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _clampedT = new THREE.Vector3()
const _bendN = new THREE.Vector3()
const _desiredElbow = new THREE.Vector3()
const _bonePos = new THREE.Vector3()
const _childPos = new THREE.Vector3()
const _curDir = new THREE.Vector3()
const _desDir = new THREE.Vector3()
const _dq = new THREE.Quaternion()
const _parentQ = new THREE.Quaternion()
const _worldQ = new THREE.Quaternion()
const _targetLocalQ = new THREE.Quaternion()

function aimBoneAtWorldTarget(
  bone: THREE.Object3D | undefined,
  childBone: THREE.Object3D | undefined,
  targetWorld: THREE.Vector3,
  blend: number
) {
  if (!bone || !childBone || !bone.parent) return
  bone.updateWorldMatrix(true, true)
  bone.getWorldPosition(_bonePos)
  childBone.getWorldPosition(_childPos)

  _curDir.copy(_childPos).sub(_bonePos)
  _desDir.copy(targetWorld).sub(_bonePos)

  if (_curDir.lengthSq() < 1e-6 || _desDir.lengthSq() < 1e-6) return
  _curDir.normalize()
  _desDir.normalize()

  _dq.setFromUnitVectors(_curDir, _desDir)
  bone.getWorldQuaternion(_worldQ)
  bone.parent.getWorldQuaternion(_parentQ)

  _targetLocalQ.copy(_parentQ).invert().multiply(_dq).multiply(_worldQ)
  bone.quaternion.slerp(_targetLocalQ, blend)
  bone.updateMatrixWorld(true)
}

/**
 * Analytical 2-bone IK using Law of Cosines so endBone lands accurately
 * on targetWorld with a natural anatomical elbow bend.
 */
function solveTwoBoneIK(
  upperBone: THREE.Object3D | undefined,
  lowerBone: THREE.Object3D | undefined,
  endBone: THREE.Object3D | undefined,
  targetWorld: THREE.Vector3,
  poleDirWorld: THREE.Vector3,
  blend: number
) {
  if (!upperBone || !lowerBone || !endBone) return
  upperBone.updateWorldMatrix(true, true)
  upperBone.getWorldPosition(_sPos)
  lowerBone.getWorldPosition(_ePos)
  endBone.getWorldPosition(_hPos)

  const len1 = _sPos.distanceTo(_ePos)
  const len2 = _ePos.distanceTo(_hPos)
  if (len1 < 1e-4 || len2 < 1e-4) return

  _dir.copy(targetWorld).sub(_sPos)
  const rawDist = _dir.length()
  if (rawDist < 1e-4) return
  _dir.divideScalar(rawDist)

  const maxReach = (len1 + len2) * 0.94
  const minReach = Math.abs(len1 - len2) + 0.05
  const dist = THREE.MathUtils.clamp(rawDist, minReach, maxReach)

  _clampedT.copy(_sPos).addScaledVector(_dir, dist)

  const cosAngle = THREE.MathUtils.clamp(
    (len1 * len1 + dist * dist - len2 * len2) / (2 * len1 * dist),
    -1,
    1
  )
  const sinAngle = Math.sqrt(Math.max(0, 1 - cosAngle * cosAngle))

  // Orthogonalize pole vector against shoulder->target direction
  _bendN
    .copy(poleDirWorld)
    .addScaledVector(_dir, -poleDirWorld.dot(_dir))
  if (_bendN.lengthSq() < 1e-5) {
    _bendN.set(0, 0, 1)
  } else {
    _bendN.normalize()
  }

  _desiredElbow
    .copy(_sPos)
    .addScaledVector(_dir, len1 * cosAngle)
    .addScaledVector(_bendN, len1 * sinAngle)

  aimBoneAtWorldTarget(upperBone, lowerBone, _desiredElbow, blend)
  aimBoneAtWorldTarget(lowerBone, endBone, _clampedT, Math.min(1, blend * 1.25))
}

const CharacterRunner: React.FC<CharacterRunnerProps> = ({
  url,
  side,
  scrollProgress,
  activeSection,
  mouseParallax,
}) => {
  const gltf = useLoader(GLTFLoader, url)
  const { viewport } = useThree()
  const outerRef = useRef<THREE.Group | null>(null)
  const bonesRef = useRef<RigBones>({})
  const baseRotRef = useRef<Record<string, THREE.Euler>>({})
  const hipsBasePosRef = useRef<THREE.Vector3 | null>(null)

  const clonedScene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene])

  // Sample frame 0.05 ONCE for natural relaxed arms-down pose (never T-pose)
  const { normalizedScale, offsetVec } = useMemo(() => {
    if (gltf.animations && gltf.animations.length > 0) {
      const tempMixer = new THREE.AnimationMixer(clonedScene)
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

    const maxDim = Math.max(size.x, size.y, size.z, 0.001)
    const targetHeight = side === 'boy' ? 2.08 : 1.98
    const scale = targetHeight / maxDim

    return {
      normalizedScale: scale,
      offsetVec: new THREE.Vector3(
        -center.x * scale,
        -box.min.y * scale - 1.0,
        -center.z * scale
      ),
    }
  }, [clonedScene, gltf.animations, side])

  useEffect(() => {
    const bones: RigBones = {}
    const baseRots: Record<string, THREE.Euler> = {}

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.frustumCulled = false
        mesh.castShadow = false
        mesh.receiveShadow = false
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
              if (std.map) std.map.colorSpace = THREE.SRGBColorSpace
            }
            mat.needsUpdate = true
          })
        }
      }

      if ((child as THREE.Bone).isBone || child.type === 'Bone') {
        const n = child.name.toLowerCase()
        if (!bones.hips && (n.includes('hip') || n.includes('pelvis') || n === 'root')) {
          bones.hips = child
          hipsBasePosRef.current = child.position.clone()
          baseRots.hips = child.rotation.clone()
        } else if (
          (!bones.head && n === 'mixamorig:head') ||
          (!bones.head && n.includes('head') && !n.includes('end'))
        ) {
          bones.head = child
          baseRots.head = child.rotation.clone()
        } else if (
          !bones.spine &&
          (n.includes('spine2') || n.includes('spine1') || n.includes('spine'))
        ) {
          bones.spine = child
          baseRots.spine = child.rotation.clone()
        } else if (!bones.leftHand && n.endsWith('lefthand')) {
          bones.leftHand = child
        } else if (!bones.rightHand && n.endsWith('righthand')) {
          bones.rightHand = child
        } else if (!bones.leftForeArm && n.includes('leftforearm')) {
          bones.leftForeArm = child
          baseRots.leftForeArm = child.rotation.clone()
        } else if (!bones.rightForeArm && n.includes('rightforearm')) {
          bones.rightForeArm = child
          baseRots.rightForeArm = child.rotation.clone()
        } else if (!bones.leftArm && n.includes('leftarm')) {
          bones.leftArm = child
          baseRots.leftArm = child.rotation.clone()
        } else if (!bones.rightArm && n.includes('rightarm')) {
          bones.rightArm = child
          baseRots.rightArm = child.rotation.clone()
        }
      }
    })

    bonesRef.current = bones
    baseRotRef.current = baseRots
  }, [clonedScene])

  useFrame((state) => {
    if (bonesRef.current.hips && hipsBasePosRef.current) {
      bonesRef.current.hips.position.x = hipsBasePosRef.current.x
      bonesRef.current.hips.position.z = hipsBasePosRef.current.z
    }

    const t = state.clock.getElapsedTime()
    const isBoy = side === 'boy'
    const phase = isBoy ? 0 : Math.PI * 0.65
    const isMobile = viewport.width < 4.2
    const isDancing = activeSection === 'forever' || scrollProgress > 0.78

    // Scroll-driven positioning across the 4 sections
    const p = THREE.MathUtils.clamp(scrollProgress, 0, 1)

    let targetX = 0
    let targetY = 0
    let targetScale = isMobile ? 0.68 : 0.95

    if (p < 0.33) {
      const k = p / 0.33
      const heroX = isMobile ? (isBoy ? -0.58 : 0.58) : (isBoy ? 0.65 : 1.95)
      const heroY = isMobile ? -0.52 : 0.0
      const memX = isMobile ? (isBoy ? -1.05 : 1.05) : (isBoy ? -2.35 : 2.35)
      const memY = isMobile ? -0.92 : -0.15

      targetX = THREE.MathUtils.lerp(heroX, memX, k)
      targetY = THREE.MathUtils.lerp(heroY, memY, k)
      targetScale = THREE.MathUtils.lerp(
        isMobile ? 0.62 : 0.96,
        isMobile ? 0.44 : 0.85,
        k
      )
    } else if (p < 0.67) {
      const k = (p - 0.33) / 0.34
      const memX = isMobile ? (isBoy ? -1.05 : 1.05) : (isBoy ? -2.35 : 2.35)
      const memY = isMobile ? -0.92 : -0.15
      const qX = isMobile ? (isBoy ? -0.95 : 0.95) : (isBoy ? -1.75 : 1.75)
      const qY = isMobile ? 0.38 : 0.15

      targetX = THREE.MathUtils.lerp(memX, qX, k)
      targetY = THREE.MathUtils.lerp(memY, qY, k)
      targetScale = THREE.MathUtils.lerp(
        isMobile ? 0.44 : 0.85,
        isMobile ? 0.48 : 0.88,
        k
      )
    } else {
      const k = (p - 0.67) / 0.33
      const qX = isMobile ? (isBoy ? -0.95 : 0.95) : (isBoy ? -1.75 : 1.75)
      const qY = isMobile ? 0.38 : 0.15
      const celX = isMobile ? (isBoy ? -0.36 : 0.36) : (isBoy ? -0.58 : 0.58)
      const celY = isMobile ? 0.34 : 0.28

      targetX = THREE.MathUtils.lerp(qX, celX, k)
      targetY = THREE.MathUtils.lerp(qY, celY, k)
      targetScale = THREE.MathUtils.lerp(
        isMobile ? 0.48 : 0.88,
        isMobile ? 0.6 : 0.94,
        k
      )
    }

    const lerpSpeed = 0.08

    if (bonesRef.current.head && baseRotRef.current.head) {
      const base = baseRotRef.current.head
      const cuteTilt = isDancing
        ? Math.sin(t * 2.0 + phase) * 0.07
        : Math.sin(t * 1.3 + phase) * 0.06
      const cuteNod =
        activeSection === 'question'
          ? Math.sin(t * 1.8 + phase) * 0.05
          : Math.sin(t * 1.5 + phase) * 0.04

      bonesRef.current.head.rotation.z = THREE.MathUtils.lerp(
        bonesRef.current.head.rotation.z,
        base.z + cuteTilt,
        lerpSpeed
      )
      bonesRef.current.head.rotation.y = THREE.MathUtils.lerp(
        bonesRef.current.head.rotation.y,
        base.y + (isDancing ? (isBoy ? 0.14 : -0.06) : mouseParallax.x * 0.12),
        lerpSpeed
      )
      bonesRef.current.head.rotation.x = THREE.MathUtils.lerp(
        bonesRef.current.head.rotation.x,
        base.x + cuteNod,
        lerpSpeed
      )
    }

    if (bonesRef.current.spine && baseRotRef.current.spine) {
      const base = baseRotRef.current.spine
      const breath = Math.sin(t * 1.9 + phase) * 0.035
      const sway = isDancing
        ? Math.sin(t * 1.6 + phase) * 0.04
        : Math.sin(t * 1.0 + phase) * 0.025

      bonesRef.current.spine.rotation.x = THREE.MathUtils.lerp(
        bonesRef.current.spine.rotation.x,
        base.x + breath,
        lerpSpeed
      )
      bonesRef.current.spine.rotation.z = THREE.MathUtils.lerp(
        bonesRef.current.spine.rotation.z,
        base.z + sway,
        lerpSpeed
      )
    }

    if (!outerRef.current) return

    const waltzSwayX = isDancing ? Math.sin(t * 1.3) * 0.035 : 0
    const cuteBounce = isDancing
      ? Math.abs(Math.sin(t * 2.0 + phase)) * 0.045
      : Math.sin(t * 1.6 + phase) * 0.03

    outerRef.current.position.x = THREE.MathUtils.lerp(
      outerRef.current.position.x,
      targetX + waltzSwayX + mouseParallax.x * 0.07,
      0.08
    )
    outerRef.current.position.y = THREE.MathUtils.lerp(
      outerRef.current.position.y,
      targetY + cuteBounce - mouseParallax.y * 0.04,
      0.08
    )

    const curScale = outerRef.current.scale.x
    const nextScale = THREE.MathUtils.lerp(curScale, targetScale, 0.08)
    outerRef.current.scale.setScalar(nextScale)

    // Smooth romantic waltz sway while holding hands (never twists shoulder backwards!)
    let danceRotY = mouseParallax.x * 0.07
    if (isDancing) {
      const waltzTurn = Math.sin(t * 1.15) * 0.18
      danceRotY = isBoy ? 0.18 + waltzTurn : -0.18 + waltzTurn
    }

    outerRef.current.rotation.y = THREE.MathUtils.lerp(
      outerRef.current.rotation.y,
      danceRotY,
      0.09
    )
    outerRef.current.rotation.z = THREE.MathUtils.lerp(
      outerRef.current.rotation.z,
      Math.sin(t * 1.1 + phase) * 0.02,
      0.08
    )
    outerRef.current.updateMatrixWorld(true)

    if (isDancing) {
      // Shared 3D hand-hold pivot right between & in front of them, well within both arms' reach
      const pivotX = (isMobile ? 0.04 : 0.06) + waltzSwayX
      const pivotY = isMobile ? 0.78 : 0.92
      const pivotZ = 0.34
      const sharedHandTarget = new THREE.Vector3(pivotX, pivotY, pivotZ)

      if (isBoy) {
        // Boy's LEFT arm reaches cleanly to sharedHandTarget (elbow bends outward/down/forward)
        solveTwoBoneIK(
          bonesRef.current.leftArm,
          bonesRef.current.leftForeArm,
          bonesRef.current.leftHand,
          sharedHandTarget,
          new THREE.Vector3(-0.3, -0.5, 0.7),
          0.25
        )
        // Boy's RIGHT arm stays naturally at his right side (zero torso clipping!)
        if (bonesRef.current.rightArm && baseRotRef.current.rightArm) {
          const base = baseRotRef.current.rightArm
          bonesRef.current.rightArm.rotation.x = THREE.MathUtils.lerp(
            bonesRef.current.rightArm.rotation.x,
            base.x - 0.08 + Math.sin(t * 1.4) * 0.04,
            0.08
          )
          bonesRef.current.rightArm.rotation.z = THREE.MathUtils.lerp(
            bonesRef.current.rightArm.rotation.z,
            base.z - 0.06,
            0.08
          )
        }
        if (bonesRef.current.rightForeArm && baseRotRef.current.rightForeArm) {
          const base = baseRotRef.current.rightForeArm
          bonesRef.current.rightForeArm.rotation.x = THREE.MathUtils.lerp(
            bonesRef.current.rightForeArm.rotation.x,
            base.x - 0.15,
            0.08
          )
        }
      } else {
        // Girl's RIGHT arm reaches cleanly to the exact same sharedHandTarget while twirling!
        solveTwoBoneIK(
          bonesRef.current.rightArm,
          bonesRef.current.rightForeArm,
          bonesRef.current.rightHand,
          sharedHandTarget,
          new THREE.Vector3(0.3, -0.4, 0.75),
          0.28
        )
        // Girl's LEFT arm stays gracefully poised outward on her left side
        if (bonesRef.current.leftArm && baseRotRef.current.leftArm) {
          const base = baseRotRef.current.leftArm
          bonesRef.current.leftArm.rotation.x = THREE.MathUtils.lerp(
            bonesRef.current.leftArm.rotation.x,
            base.x - 0.12 + Math.sin(t * 1.8) * 0.05,
            0.08
          )
          bonesRef.current.leftArm.rotation.z = THREE.MathUtils.lerp(
            bonesRef.current.leftArm.rotation.z,
            base.z - 0.18,
            0.08
          )
        }
        if (bonesRef.current.leftForeArm && baseRotRef.current.leftForeArm) {
          const base = baseRotRef.current.leftForeArm
          bonesRef.current.leftForeArm.rotation.x = THREE.MathUtils.lerp(
            bonesRef.current.leftForeArm.rotation.x,
            base.x - 0.18,
            0.08
          )
        }
      }
    } else {
      // Non-dancing sections: smooth return to relaxed baseRots + cute gestures
      if (bonesRef.current.rightArm && baseRotRef.current.rightArm) {
        const base = baseRotRef.current.rightArm
        let deltaX = Math.sin(t * 1.4 + phase) * 0.05
        let deltaZ = Math.sin(t * 1.1 + phase) * 0.04
        if (isBoy && activeSection === 'hero') {
          deltaX = -0.18 + Math.sin(t * 2.4) * 0.08
          deltaZ = -0.12 + Math.sin(t * 2.8) * 0.08
        } else if (isBoy && activeSection === 'question') {
          deltaX = -0.24 + Math.sin(t * 1.6) * 0.04
        }
        bonesRef.current.rightArm.rotation.x = THREE.MathUtils.lerp(
          bonesRef.current.rightArm.rotation.x,
          base.x + deltaX,
          0.07
        )
        bonesRef.current.rightArm.rotation.z = THREE.MathUtils.lerp(
          bonesRef.current.rightArm.rotation.z,
          base.z + deltaZ,
          0.07
        )
      }
      if (bonesRef.current.rightForeArm && baseRotRef.current.rightForeArm) {
        const base = baseRotRef.current.rightForeArm
        const deltaX =
          isBoy && activeSection === 'hero'
            ? -0.22 + Math.sin(t * 2.8) * 0.12
            : Math.sin(t * 1.4 + phase) * 0.05
        bonesRef.current.rightForeArm.rotation.x = THREE.MathUtils.lerp(
          bonesRef.current.rightForeArm.rotation.x,
          base.x + deltaX,
          0.07
        )
      }
      if (bonesRef.current.leftArm && baseRotRef.current.leftArm) {
        const base = baseRotRef.current.leftArm
        bonesRef.current.leftArm.rotation.x = THREE.MathUtils.lerp(
          bonesRef.current.leftArm.rotation.x,
          base.x + Math.sin(t * 1.3 + phase) * 0.05,
          0.07
        )
        bonesRef.current.leftArm.rotation.z = THREE.MathUtils.lerp(
          bonesRef.current.leftArm.rotation.z,
          base.z + Math.sin(t * 1.0 + phase) * 0.03,
          0.07
        )
      }
      if (bonesRef.current.leftForeArm && baseRotRef.current.leftForeArm) {
        const base = baseRotRef.current.leftForeArm
        bonesRef.current.leftForeArm.rotation.x = THREE.MathUtils.lerp(
          bonesRef.current.leftForeArm.rotation.x,
          base.x + Math.sin(t * 1.3 + phase) * 0.04,
          0.07
        )
      }
    }
  })

  return (
    <group ref={outerRef}>
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
    console.error('FixedCoupleStage3D error:', error)
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export const FixedCoupleStage3D: React.FC<FixedCoupleStage3DProps> = ({
  scrollProgress,
  activeSection,
  mouseParallax,
  started,
}) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-20 transition-opacity duration-1000 ${
        started ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 6.2], fov: 38, near: 0.05, far: 100 }}
          dpr={[1, 1.25]}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          style={{ background: 'transparent' }}
        >
          <Environment resolution={64}>
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
          <pointLight position={[0, 1.4, 3.5]} intensity={1.25} color="#fff8f0" />

          <Sparkles
            count={activeSection === 'forever' ? 28 : 14}
            scale={[5.5, 3.4, 2]}
            size={activeSection === 'forever' ? 3.2 : 2.2}
            speed={0.45}
            color="#E8C87E"
            opacity={0.75}
          />

          <Suspense fallback={null}>
            <CharacterRunner
              url="./assets/models/sashwat.glb"
              side="boy"
              scrollProgress={scrollProgress}
              activeSection={activeSection}
              mouseParallax={mouseParallax}
            />
            <CharacterRunner
              url="./assets/models/smriti.glb"
              side="girl"
              scrollProgress={scrollProgress}
              activeSection={activeSection}
              mouseParallax={mouseParallax}
            />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  )
}

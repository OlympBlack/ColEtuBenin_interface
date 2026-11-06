import { useEffect, useRef } from 'react'
import { useThree, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { TextureLoader } from 'three'
import { EquirectangularReflectionMapping } from 'three'

export interface PanoramaViewerProps {
  url: string
  alt?: string
  width?: number
  height?: number
}

export function PanoramaViewer({ url, alt = 'Visite virtuelle 360°', width = 800, height = 400 }: PanoramaViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    mountRef.current!.appendChild(renderer.domElement)

    const textureLoader = new TextureLoader()
    const texture = textureLoader.load(url, () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })

    texture.mapping = EquirectangularReflectionMapping

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 32),
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
      })
    )
    scene.add(sky)

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2)
    scene.add(light)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = true

    const resize = () => {
      const w = mountRef.current!.clientWidth
      const h = mountRef.current!.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', resize)

    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      mountRef.current!.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [url, width, height])

  return (
    <div
      ref={mountRef}
      style={{
        width,
        height,
        borderRadius: 12,
        overflow: 'hidden',
        background: '#000',
      }}
    />
  )
}
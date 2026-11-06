import { useEffect, useRef } from 'react'
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  TextureLoader,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  HemisphereLight,
  BackSide,
  EquirectangularReflectionMapping,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface PanoramaViewerProps {
  url: string
  width?: number
  height?: number
}

export function PanoramaViewer({ url, width = 800, height = 400 }: PanoramaViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new Scene()
    const camera = new PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(0, 0, 0)

    const renderer = new WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    mountRef.current!.appendChild(renderer.domElement)

    const textureLoader = new TextureLoader()
    const texture = textureLoader.load(url, () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })

    texture.mapping = EquirectangularReflectionMapping

    const sky = new Mesh(
      new SphereGeometry(500, 32, 32),
      new MeshBasicMaterial({
        map: texture,
        side: BackSide,
      })
    )
    scene.add(sky)

    const light = new HemisphereLight(0xffffff, 0x444444, 1.2)
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
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
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

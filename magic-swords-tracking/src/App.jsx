import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import MagicSwords from "./components/MagicSwords";

export default function App() {
  const videoRef = useRef(null);
  const [handLandmarks, setHandLandmarks] = useState(null);

  useEffect(() => {
    let camera = null;
    const initTracking = () => {
      if (!window.Hands || !window.Camera || !videoRef.current) {
        setTimeout(initTracking, 500);
        return;
      }

      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // Nhẹ nhất để mượt
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: true // QUAN TRỌNG: Phải để true để không bị ngược trái phải
      });

      hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
          setHandLandmarks(results.multiHandLandmarks[0]);
        } else {
          setHandLandmarks(null);
        }
      });

      camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    };
    initTracking();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <video ref={videoRef} style={{ display: "none" }} playsInline />
      
      <Canvas 
        gl={{ antialias: false }} 
        camera={{ position: [0, 0, 15], fov: 45 }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#020202"]} />
        <ambientLight intensity={1} />
        
        <MagicSwords handLandmarks={handLandmarks} />

        <EffectComposer disableNormalPass>
          <Bloom 
            intensity={2.5} 
            luminanceThreshold={0.2} 
            mipmapBlur 
            radius={0.7}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
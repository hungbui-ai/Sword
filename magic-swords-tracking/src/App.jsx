import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette, Noise } from "@react-three/postprocessing";
import MagicSwords from "./components/MagicSwords";

export default function App() {
  const videoRef = useRef(null);
  const [handData, setHandData] = useState(null);

  useEffect(() => {
    let camera = null;
    const init = () => {
      if (!window.Hands || !window.Camera || !videoRef.current) {
        setTimeout(init, 500);
        return;
      }
      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1, // Tăng độ chính xác cho cử chỉ
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
        selfieMode: true
      });
      hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
          setHandData(results.multiHandLandmarks[0]);
        } else {
          setHandData(null);
        }
      });
      camera = new window.Camera(videoRef.current, {
        onFrame: async () => { await hands.send({ image: videoRef.current }); },
        width: 1280, height: 720,
      });
      camera.start();
    };
    init();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <video ref={videoRef} style={{ display: "none" }} playsInline />
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }} gl={{ antialias: false }}>
        <color attach="background" args={["#010101"]} />
        <MagicSwords handData={handData} />
        <EffectComposer disableNormalPass>
          <Bloom intensity={2.5} luminanceThreshold={0.15} mipmapBlur />
          <Noise opacity={0.05} />
          <Vignette darkness={0.6} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
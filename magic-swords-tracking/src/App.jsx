import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import MagicSwords from "./components/MagicSwords";

export default function App() {
  const videoRef = useRef(null);
  const [handLandmarks, setHandLandmarks] = useState(null);

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
        modelComplexity: 0,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
        selfieMode: true
      });
      hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
          setHandLandmarks(results.multiHandLandmarks[0]);
        } else {
          setHandLandmarks(null);
        }
      });
      camera = new window.Camera(videoRef.current, {
        onFrame: async () => { await hands.send({ image: videoRef.current }); },
        width: 640,
        height: 480,
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
        <MagicSwords handLandmarks={handLandmarks} />
        <EffectComposer disableNormalPass>
          <Bloom intensity={2} luminanceThreshold={0.1} mipmapBlur />
          <Vignette darkness={0.7} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
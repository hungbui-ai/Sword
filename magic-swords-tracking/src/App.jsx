import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import MagicSwords from "./components/MagicSwords";

export default function App() {
  const videoRef = useRef(null);
  const [handData, setHandData] = useState(null);

  useEffect(() => {
    let camera = null;
    let isTracking = true;

    const initTracking = () => {
      if (!window.Hands || !window.Camera || !videoRef.current || !isTracking) {
        setTimeout(initTracking, 500);
        return;
      }

      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        // QUAN TRỌNG: Dùng model nhẹ nhất để giảm lag
        modelComplexity: 0, 
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: true
      });

      hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
          // Lấy tọa độ ngón giữa (landmark 9) để ổn định hơn ngón trỏ
          setHandData(results.multiHandLandmarks[0][9]);
        } else {
          setHandData(null);
        }
      });

      camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (isTracking && videoRef.current) {
             await hands.send({ image: videoRef.current });
          }
        },
        // Độ phân giải tối ưu cho tốc độ
        width: 640,
        height: 480,
      });
      camera.start();
    };

    initTracking();

    return () => {
      isTracking = false;
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000", margin: 0, overflow: 'hidden' }}>
      <video ref={videoRef} style={{ display: "none" }} playsInline />
      
      {/* Tắt antialias để tăng fps, dpr thấp để nhẹ máy */}
      <Canvas gl={{ antialias: false, alpha: false }} dpr={[1, 1.5]} camera={{ position: [0, 0, 14], fov: 45 }}>
        <color attach="background" args={["#020202"]} />
        
        <MagicSwords handData={handData} />

        <EffectComposer disableNormalPass>
          {/* Tăng luminanceThreshold để chỉ phần kiếm phát sáng, nền tối đi */}
          <Bloom intensity={2.5} luminanceThreshold={0.4} mipmapBlur radius={0.7} />
          <Vignette darkness={0.5} />
        </EffectComposer>
      </Canvas>

      {!handData && (
        <div style={{
          position: "absolute", bottom: "10%", width: "100%", textAlign: "center",
          color: "#55ffaa", fontFamily: "monospace", letterSpacing: '2px', pointerEvents: "none"
        }}>
          [ ĐANG TÌM TÍN HIỆU TAY... ]
        </div>
      )}
    </div>
  );
}
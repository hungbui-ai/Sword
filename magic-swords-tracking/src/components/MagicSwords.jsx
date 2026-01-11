// Trong phần return của MagicSwords.jsx
return (
  <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
    <coneGeometry args={[0.05, 0.6, 3]} /> 
    <meshStandardMaterial 
      color="#00ffaa" 
      emissive="#00ffaa" 
      emissiveIntensity={5} 
      toneMapped={false} 
    />
  </instancedMesh>
);
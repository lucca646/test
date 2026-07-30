/**
 * SVG filters Liquid Glass — réfraction SDF + aberration chromatique.
 * Monter une fois près de la racine (main.jsx).
 */

export default function LiquidGlassFilter({
  id = "liquid-lens",
  mapSrc = "/liquid-lens-pill.png",
  scale = -42,
  chromaticAberration = true,
  chromaSpread = 3,
}) {
  const c = chromaSpread;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <filter
        id={id}
        colorInterpolationFilters="sRGB"
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
      >
        <feImage
          href={mapSrc}
          preserveAspectRatio="none"
          x="0"
          y="0"
          width="100%"
          height="100%"
          result="map"
        />

        {chromaticAberration ? (
          <>
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale - c}
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="dR"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="dG"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale + c}
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="dB"
            />

            <feBlend in="dR" in2="dG" mode="screen" result="dRG" />
            <feBlend in="dRG" in2="dB" mode="screen" />
          </>
        ) : (
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        )}
      </filter>
    </svg>
  );
}

export function LiquidGlassFilters() {
  return (
    <>
      {/* Loupe Apple douce */}
      <LiquidGlassFilter
        id="liquid-lens-soft"
        mapSrc="/liquid-lens-blob.png"
        scale={-26}
        chromaticAberration={false}
      />
      {/* Drag : loupe + légère aberration sur les bords */}
      <LiquidGlassFilter
        id="liquid-lens-soft-strong"
        mapSrc="/liquid-lens-blob.png"
        scale={-36}
        chromaticAberration
        chromaSpread={2.5}
      />
      <LiquidGlassFilter
        id="liquid-lens-pill"
        mapSrc="/liquid-lens-pill.png"
        scale={-28}
        chromaticAberration={false}
      />
      <LiquidGlassFilter
        id="liquid-lens-blob"
        mapSrc="/liquid-lens-blob.png"
        scale={-40}
        chromaticAberration={false}
      />
    </>
  );
}

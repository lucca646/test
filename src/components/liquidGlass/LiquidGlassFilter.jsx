/**
 * SVG filters Liquid Glass — réfraction SDF + aberration chromatique.
 * Monter une fois près de la racine (main.jsx).
 */

export default function LiquidGlassFilter({
  id = "liquid-lens",
  mapSrc = "/liquid-lens-pill.png",
  scale = -42,
  chromaticAberration = true,
}) {
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
              scale={scale - 4}
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
              scale={scale + 4}
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
      <LiquidGlassFilter
        id="liquid-lens-pill"
        mapSrc="/liquid-lens-pill.png"
        scale={-36}
        chromaticAberration
      />
      <LiquidGlassFilter
        id="liquid-lens-blob"
        mapSrc="/liquid-lens-blob.png"
        scale={-52}
        chromaticAberration
      />
      <LiquidGlassFilter
        id="liquid-lens-blob-strong"
        mapSrc="/liquid-lens-blob.png"
        scale={-68}
        chromaticAberration
      />
    </>
  );
}

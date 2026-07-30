/**
 * SVG filters Liquid Glass — à monter une fois près de la racine.
 */
import blobMap from "../assets/liquid-lens-blob.png";
import pillMap from "../assets/liquid-lens-pill.png";

export function LiquidGlassFilter({
  id = "liquid-lens",
  mapSrc,
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

/** Monte les filtres SDF (à placer une fois dans l’app). */
export function LiquidGlassFilters() {
  return (
    <>
      <LiquidGlassFilter
        id="lgn-lens-soft"
        mapSrc={blobMap}
        scale={-26}
        chromaticAberration={false}
      />
      {/* Drag : map pill (ovale) + loupe plus forte */}
      <LiquidGlassFilter
        id="lgn-lens-soft-strong"
        mapSrc={pillMap}
        scale={-58}
        chromaticAberration
        chromaSpread={3.5}
      />
      <LiquidGlassFilter
        id="lgn-lens-pill"
        mapSrc={pillMap}
        scale={-28}
        chromaticAberration={false}
      />
    </>
  );
}

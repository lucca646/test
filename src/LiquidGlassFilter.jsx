export function LiquidGlassFilter({
  id = "liquid-lens",
  mapSrc = "/liquid-lens-pill.png",
  scale = -42,
  chromaticAberration = true,
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}
    >
      <filter
        id={id}
        colorInterpolationFilters="sRGB"
        x="-8%"
        y="-8%"
        width="116%"
        height="116%"
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
              scale={scale - 3}
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
              scale={scale + 3}
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
      <LiquidGlassFilter id="liquid-lens-pill" mapSrc="/liquid-lens-pill.png" scale={-38} />
      <LiquidGlassFilter id="liquid-lens-blob" mapSrc="/liquid-lens-blob.png" scale={-56} />
    </>
  );
}

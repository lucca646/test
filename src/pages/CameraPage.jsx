import { useCallback, useEffect, useRef, useState } from "react";
import {
  Page,
  Navbar,
  Block,
  Button,
} from "konsta/react";
import { usePlatform } from "../platform/PlatformContext.jsx";

function WebappCamera() {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [shot, setShot] = useState(null);
  const streamRef = useRef(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Caméra non dispo dans ce navigateur.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e) {
        setError(e?.message || "Accès caméra refusé.");
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [stop]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setShot(canvas.toDataURL("image/jpeg", 0.9));
  };

  return (
    <div className="wa-camera">
      <div className="wa-camera-stage">
        {shot ? (
          <img src={shot} alt="Capture" className="wa-camera-preview" />
        ) : (
          <video
            ref={videoRef}
            className="wa-camera-preview"
            playsInline
            muted
          />
        )}
        {!ready && !error && !shot ? (
          <p className="wa-camera-status">Ouverture caméra…</p>
        ) : null}
        {error ? <p className="wa-camera-status is-err">{error}</p> : null}
      </div>
      <div className="wa-camera-actions">
        {shot ? (
          <button
            type="button"
            className="wa-btn wa-btn-ghost"
            onClick={() => setShot(null)}
          >
            Reprendre
          </button>
        ) : (
          <button
            type="button"
            className="wa-camera-shutter"
            onClick={capture}
            disabled={!ready}
            aria-label="Prendre une photo"
          />
        )}
      </div>
      <p className="wa-camera-hint">Style BeReal — déclencheur central blanc</p>
    </div>
  );
}

export default function CameraPage() {
  const { lab } = usePlatform();

  if (!lab) return <WebappCamera />;

  return (
    <Page colors={{ bgIos: "bg-transparent", bgMaterial: "bg-transparent" }}>
      <Navbar title="Caméra" large transparent className="top-0 sticky" />
      <Block className="mt-2">
        <div className="hero-card hero-blue">
          <p className="hero-kicker">BEREAL · CAM</p>
          <h2>Caméra</h2>
          <p>Ouvre l’onglet hors lab pour le viseur plein écran.</p>
        </div>
      </Block>
      <Block>
        <Button large rounded onClick={() => (window.location.href = "/camera/")}>
          Ouvrir le viseur
        </Button>
      </Block>
    </Page>
  );
}

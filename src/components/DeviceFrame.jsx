import { usePlatform } from "../platform/PlatformContext.jsx";

/**
 * Cadre device — en live web : plein écran navigateur, sans faux chrome.
 * En lab (?lab=1) : miroirs iOS / Android / Web desktop.
 */
export default function DeviceFrame({ children, nav, liveWeb = false }) {
  const { platform } = usePlatform();

  if (liveWeb || platform === "web") {
    return (
      <div className="device-frame device-web device-web-live">
        <div className="device-frame-inner device-web-inner">
          {nav}
          <div className="device-web-body">{children}</div>
        </div>
      </div>
    );
  }

  if (platform === "android") {
    return (
      <div className="device-frame device-android">
        <div className="device-frame-inner">
          <div className="android-status" aria-hidden>
            <span>21:56</span>
            <span className="android-punch" />
            <span>5G · 82%</span>
          </div>
          {children}
          {nav}
          <div className="android-gesture" aria-hidden />
        </div>
      </div>
    );
  }

  // Lab iOS
  return (
    <div className="device-frame device-ios">
      <div className="device-frame-inner">
        <div className="phone-notch" aria-hidden />
        {children}
        {nav}
      </div>
    </div>
  );
}

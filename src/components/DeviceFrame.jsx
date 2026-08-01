import { usePlatform } from "../platform/PlatformContext.jsx";

/**
 * Cadre device selon la plateforme — même contenu enfants.
 */
export default function DeviceFrame({ children, nav }) {
  const { platform } = usePlatform();

  if (platform === "web") {
    return (
      <div className="device-frame device-web">
        <div className="web-chrome" aria-hidden>
          <div className="web-traffic">
            <i />
            <i />
            <i />
          </div>
          <div className="web-url">
            <span>liquid.glass</span>
            <em>/preview?platform=web</em>
          </div>
        </div>
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

  // iOS
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

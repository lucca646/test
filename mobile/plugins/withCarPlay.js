/**
 * Config plugin CarPlay (prototype).
 *
 * Génère, au `expo prebuild`, tout le natif iOS nécessaire pour que
 * `react-native-carplay` reçoive la scène CarPlay :
 *   1. Entitlement `com.apple.developer.carplay-audio` (catégorie Audio — la
 *      plus riche en templates : tab bar + list + grid + information + now
 *      playing). ⚠️ Entitlement « restreint » : nécessite l'approbation Apple
 *      (formulaire CarPlay) pour un vrai boîtier / TestFlight.
 *   2. `UIApplicationSceneManifest` déclarant UNIQUEMENT la scène CarPlay
 *      (le window scene iPhone reste géré classiquement par l'AppDelegate RN).
 *   3. Un `CarSceneDelegate` (Objective-C) qui relaie connect/disconnect vers
 *      `RNCarPlay`, ajouté à la target Xcode.
 */
const {
  withEntitlementsPlist,
  withInfoPlist,
  withDangerousMod,
  withXcodeProject,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const DELEGATE_NAME = "CarSceneDelegate";

const HEADER = `#import <UIKit/UIKit.h>
#import <CarPlay/CarPlay.h>

@interface ${DELEGATE_NAME} : UIResponder <CPTemplateApplicationSceneDelegate>
@end
`;

// Note: sans use_frameworks!, l'en-tête du pod est en import quote form.
// Avec use_frameworks!, remplacer par: #import <react_native_carplay/RNCarPlay.h>
const IMPL = `#import "${DELEGATE_NAME}.h"
#import "RNCarPlay.h"

@implementation ${DELEGATE_NAME}

- (void)templateApplicationScene:(CPTemplateApplicationScene *)templateApplicationScene
   didConnectInterfaceController:(CPInterfaceController *)interfaceController
                        toWindow:(CPWindow *)window {
  [RNCarPlay connectWithInterfaceController:interfaceController window:window];
}

- (void)templateApplicationScene:(CPTemplateApplicationScene *)templateApplicationScene
 didDisconnectInterfaceController:(CPInterfaceController *)interfaceController
                       fromWindow:(CPWindow *)window {
  [RNCarPlay disconnect];
}

@end
`;

function withCarPlayEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults["com.apple.developer.carplay-audio"] = true;
    return cfg;
  });
}

function withCarPlaySceneManifest(config) {
  return withInfoPlist(config, (cfg) => {
    const info = cfg.modResults;
    const manifest = info.UIApplicationSceneManifest || {};
    manifest.UIApplicationSupportsMultipleScenes = true;
    const configurations = manifest.UISceneConfigurations || {};
    configurations.CPTemplateApplicationSceneSessionRoleApplication = [
      {
        UISceneConfigurationName: "CarPlay",
        UISceneClassName: "CPTemplateApplicationScene",
        UISceneDelegateClassName: DELEGATE_NAME,
      },
    ];
    manifest.UISceneConfigurations = configurations;
    info.UIApplicationSceneManifest = manifest;
    return cfg;
  });
}

function withCarPlayDelegateFiles(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const { platformProjectRoot, projectName } = cfg.modRequest;
      const dir = path.join(platformProjectRoot, projectName);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${DELEGATE_NAME}.h`), HEADER);
      fs.writeFileSync(path.join(dir, `${DELEGATE_NAME}.m`), IMPL);
      return cfg;
    },
  ]);
}

function withCarPlayXcodeTarget(config) {
  return withXcodeProject(config, (cfg) => {
    const proj = cfg.modResults;
    const projectName = cfg.modRequest.projectName;
    const relH = `${projectName}/${DELEGATE_NAME}.h`;
    const relM = `${projectName}/${DELEGATE_NAME}.m`;

    if (proj.hasFile(relM)) return cfg;

    const groupKey =
      proj.findPBXGroupKey({ name: projectName }) ||
      proj.findPBXGroupKey({ path: projectName });
    const target = proj.getFirstTarget().uuid;

    proj.addHeaderFile(relH, {}, groupKey);
    proj.addSourceFile(relM, { target }, groupKey);
    return cfg;
  });
}

module.exports = function withCarPlay(config) {
  config = withCarPlayEntitlement(config);
  config = withCarPlaySceneManifest(config);
  config = withCarPlayDelegateFiles(config);
  config = withCarPlayXcodeTarget(config);
  return config;
};

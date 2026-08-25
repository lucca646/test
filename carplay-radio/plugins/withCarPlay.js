/**
 * Config plugin CarPlay — catégorie « Audio ».
 *
 * Génère, au `expo prebuild`, tout le natif iOS nécessaire pour que
 * `react-native-carplay` reçoive la scène CarPlay :
 *   1. Entitlement `com.apple.developer.carplay-audio`. L'app est un lecteur
 *      de radios : elle est bien « designed primarily to provide audio
 *      playback services » (CarPlay Developer Guide, Guidelines §1).
 *      ⚠️ Entitlement « restreint » : nécessite l'approbation Apple
 *      (developer.apple.com/carplay) pour un vrai boîtier / TestFlight.
 *   2. `UIApplicationSceneManifest` déclarant LES DEUX scènes — iPhone et
 *      CarPlay — comme le fait l'exemple officiel Apple. Dès que cette clé
 *      existe dans Info.plist, iOS considère l'app "scene-based" : une
 *      `UIWindow` qui n'est jamais rattachée à une `UIWindowScene`
 *      (`window.windowScene = ...`) reste invisible, même créée.
 *
 *      ⚠️ Piège n°1 : ne PAS déplacer la création de la fenêtre depuis
 *      `AppDelegate.didFinishLaunchingWithOptions` vers le scene delegate.
 *      `expo-dev-launcher` (builds debug uniquement) fait, dans
 *      `ExpoDevLauncherAppDelegateSubscriber.swift` :
 *          guard let window = UIApplication.shared.delegate?.window ?? …
 *          else { fatalError("Cannot find the keyWindow…") }
 *      — une fenêtre nil à cet instant fait donc planter l'app au lancement.
 *      `AppDelegate` garde la création + `startReactNative` tels que générés ;
 *      `MainSceneDelegate` ne fait que le RATTACHEMENT (`window.windowScene`).
 *
 *      ⚠️ Piège n°2 : `MainSceneDelegate` doit être annoté `@objc(...)` —
 *      voir le commentaire dans MAIN_SCENE_DELEGATE_IMPL ci-dessous.
 *   3. `CarSceneDelegate` (Objective-C) qui relaie connect/disconnect vers
 *      `RNCarPlay`, et `MainSceneDelegate` (Swift) qui rattache la fenêtre
 *      iPhone à sa scène — tous deux ajoutés à la target Xcode.
 *      `AppDelegate.swift` n'est pas modifié.
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
const MAIN_SCENE_DELEGATE_NAME = "MainSceneDelegate";

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

/**
 * Rattache la fenêtre déjà créée par `AppDelegate.didFinishLaunchingWithOptions`
 * à la scène iPhone qu'iOS vient de connecter. Ne crée PAS de nouvelle fenêtre
 * et n'appelle PAS `startReactNative` une deuxième fois — `AppDelegate` garde
 * l'entière responsabilité de la création et du démarrage de React Native,
 * exactement comme le génère le template Expo. Voir le commentaire d'en-tête.
 */
const MAIN_SCENE_DELEGATE_IMPL = `import UIKit

// @objc explicite OBLIGATOIRE : iOS résout \`UISceneDelegateClassName\` de
// Info.plist via le runtime Objective-C. Sans cet attribut, le nom runtime
// d'une classe Swift est mangé (\`_TtC6Radios17MainSceneDelegate\`), iOS ne
// trouve pas la classe, le scene delegate n'est jamais instancié — et la
// fenêtre n'est jamais rattachée à sa scène : écran noir, sans crash ni log.
// (\`CarSceneDelegate\` échappe au problème : il est en Objective-C.)
@objc(${MAIN_SCENE_DELEGATE_NAME})
class ${MAIN_SCENE_DELEGATE_NAME}: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene else { return }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let existingWindow = appDelegate.window else { return }

    existingWindow.windowScene = windowScene
    self.window = existingWindow
    existingWindow.makeKeyAndVisible()
  }
}
`;

function withCarPlayEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    // Une seule catégorie : demander plusieurs entitlements CarPlay sans
    // qu'Apple les ait tous accordés fait échouer la signature.
    cfg.modResults["com.apple.developer.carplay-audio"] = true;
    return cfg;
  });
}

function withCarPlaySceneManifest(config) {
  return withInfoPlist(config, (cfg) => {
    const info = cfg.modResults;
    const manifest = info.UIApplicationSceneManifest || {};
    // Les deux scènes tournent simultanément dès que le téléphone est
    // branché à la voiture — nécessaire, pas juste permissif.
    manifest.UIApplicationSupportsMultipleScenes = true;
    const configurations = manifest.UISceneConfigurations || {};
    configurations.UIWindowSceneSessionRoleApplication = [
      {
        UISceneConfigurationName: "Default Configuration",
        UISceneClassName: "UIWindowScene",
        UISceneDelegateClassName: MAIN_SCENE_DELEGATE_NAME,
      },
    ];
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

function withMainSceneDelegateFile(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const { platformProjectRoot, projectName } = cfg.modRequest;
      const dir = path.join(platformProjectRoot, projectName);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, `${MAIN_SCENE_DELEGATE_NAME}.swift`),
        MAIN_SCENE_DELEGATE_IMPL,
      );
      return cfg;
    },
  ]);
}

function withMainSceneDelegateXcodeTarget(config) {
  return withXcodeProject(config, (cfg) => {
    const proj = cfg.modResults;
    const projectName = cfg.modRequest.projectName;
    const relSwift = `${projectName}/${MAIN_SCENE_DELEGATE_NAME}.swift`;

    if (proj.hasFile(relSwift)) return cfg;

    const groupKey =
      proj.findPBXGroupKey({ name: projectName }) ||
      proj.findPBXGroupKey({ path: projectName });
    const target = proj.getFirstTarget().uuid;

    proj.addSourceFile(relSwift, { target }, groupKey);
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
  config = withMainSceneDelegateFile(config);
  config = withMainSceneDelegateXcodeTarget(config);
  return config;
};

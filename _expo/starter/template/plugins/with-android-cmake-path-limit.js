/**
 * Keeps Android native (CMake) builds working from long Windows folder paths.
 *
 * Windows limits most build-tool paths to 260 characters. Apps with native C++
 * modules (Reanimated, Skia, on-device AI, and others) generate CMake object
 * paths deep enough to exceed it, and the build fails with "file name too long"
 * or missing object files. This plugin, together with scripts/lib/android.sh,
 * fixes that without moving the project:
 *   1. caps CMake object path length (CMAKE_OBJECT_PATH_MAX=180),
 *   2. stages native build output in APP_ANDROID_CXX_DIR (default ~/.app-cxx),
 *   3. rewrites the generated autolinking CMake file to use the short drive
 *      letter in APP_ANDROID_SHORT_APP_ROOT when the launcher has set it.
 * Every step is a no-op on macOS and Linux and when those variables are unset.
 */
const { withAppBuildGradle } = require("expo/config-plugins");

const CMAKE_ARGUMENT = "-DCMAKE_OBJECT_PATH_MAX=180";
const STAGING_VARIABLE = "appCmakeStagingDir";
const SHORT_ROOT_VARIABLE = "appShortAppRoot";
const SHORT_PATH_HOOK = "APP_SHORT_CMAKE_PATH_HOOK";

function insertAfter(contents, pattern, text, label) {
  if (!pattern.test(contents))
    throw new Error(`with-android-cmake-path-limit: could not find ${label} in app/build.gradle.`);
  return contents.replace(pattern, `$1${text}`);
}

module.exports = function withAndroidCmakePathLimit(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      throw new Error("with-android-cmake-path-limit requires a Groovy app/build.gradle file.");
    }
    let contents = cfg.modResults.contents;

    if (!contents.includes(STAGING_VARIABLE)) {
      contents = insertAfter(
        contents,
        /(def projectRoot = .*\r?\n)/u,
        `def ${STAGING_VARIABLE} = System.getenv("APP_ANDROID_CXX_DIR") ?: "\${System.getProperty('user.home')}/.app-cxx"\n`,
        "projectRoot",
      );
    }
    if (!contents.includes(SHORT_ROOT_VARIABLE)) {
      contents = insertAfter(
        contents,
        new RegExp(`(def ${STAGING_VARIABLE} = .*\\r?\\n)`, "u"),
        `def ${SHORT_ROOT_VARIABLE} = System.getenv("APP_ANDROID_SHORT_APP_ROOT")\n`,
        STAGING_VARIABLE,
      );
    }
    if (!contents.includes(CMAKE_ARGUMENT)) {
      contents = insertAfter(
        contents,
        /(\s+defaultConfig\s*\{\r?\n)/u,
        `        externalNativeBuild {\n            cmake {\n                arguments "${CMAKE_ARGUMENT}"\n            }\n        }\n`,
        "android.defaultConfig",
      );
    }
    if (!contents.includes(`buildStagingDirectory file(${STAGING_VARIABLE})`)) {
      contents = insertAfter(
        contents,
        /(android\s*\{\r?\n)/u,
        `    externalNativeBuild {\n        cmake {\n            buildStagingDirectory file(${STAGING_VARIABLE})\n        }\n    }\n`,
        "android block",
      );
    }
    if (!contents.includes(SHORT_PATH_HOOK)) {
      const hook = [
        "",
        `// ${SHORT_PATH_HOOK}`,
        'def shortenAutolinkingCmakePaths = tasks.register("shortenAutolinkingCmakePaths") {',
        '    dependsOn("generateAutolinkingNewArchitectureFiles")',
        "    doLast {",
        `        if (!${SHORT_ROOT_VARIABLE}) return`,
        '        def cmakeFile = file("$buildDir/generated/autolinking/src/main/jni/Android-autolinking.cmake")',
        '        if (!cmakeFile.exists()) throw new GradleException("Missing generated Android-autolinking.cmake")',
        '        def longRoot = projectRoot.replace("\\\\", "/")',
        `        def shortRoot = ${SHORT_ROOT_VARIABLE}.replace("\\\\", "/")`,
        '        def original = cmakeFile.getText("UTF-8")',
        "        def rewritten = original.replace(longRoot, shortRoot)",
        "        def shortDirectoryIndex = 0",
        '        rewritten = rewritten.replaceAll(/(?m)^add_subdirectory\\(("[^"]+")\\s+[^)]+\\)$/) { match, source ->',
        '            "add_subdirectory(${source} l${shortDirectoryIndex++})"',
        "        }",
        "        if (rewritten == original && !original.contains(shortRoot)) {",
        '            throw new GradleException("Could not shorten generated CMake source paths")',
        "        }",
        '        cmakeFile.setText(rewritten, "UTF-8")',
        "    }",
        "}",
        "tasks.configureEach { task ->",
        '    if (task.name.startsWith("configureCMake")) task.dependsOn(shortenAutolinkingCmakePaths)',
        "}",
        "",
      ].join("\n");
      const dependencies = /(\r?\ndependencies\s*\{)/u;
      if (!dependencies.test(contents)) {
        throw new Error(
          "with-android-cmake-path-limit: could not find the dependencies block in app/build.gradle.",
        );
      }
      contents = contents.replace(dependencies, `${hook}$1`);
    }
    cfg.modResults.contents = contents;
    return cfg;
  });
};

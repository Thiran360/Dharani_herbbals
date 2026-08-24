# 1. Run codegen generator
node node_modules/react-native/scripts/generate-codegen-artifacts.js -p ./ -t android -o ./

# 2. Remove duplicate Java codegen directory from app to prevent DEX merging duplicate class errors
Remove-Item -Path 'android\app\build\generated\source\codegen\java' -Recurse -Force -ErrorAction SilentlyContinue

# 3. Setup isolated stub for geolocation
$geoJni = 'node_modules\@react-native-community\geolocation\android\build\generated\source\codegen\jni'
New-Item -ItemType Directory -Path $geoJni -Force | Out-Null
$geoCppContent = @"
#include <memory>
#include <string>
#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>

namespace facebook {
namespace react {

std::shared_ptr<TurboModule> RNCGeolocationSpec_ModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params) {
  return nullptr;
}

}
}
"@
Set-Content -Path "$geoJni\dummy.cpp" -Value $geoCppContent
Set-Content -Path "$geoJni\CMakeLists.txt" -Value @"
cmake_minimum_required(VERSION 3.13)
add_library(react_codegen_RNCGeolocationSpec SHARED dummy.cpp)
target_include_directories(react_codegen_RNCGeolocationSpec PUBLIC .)
target_link_libraries(react_codegen_RNCGeolocationSpec fbjni jsi reactnative)
"@

# 4. Setup isolated stub for sound
$soundJni = 'node_modules\react-native-sound\android\build\generated\source\codegen\jni'
New-Item -ItemType Directory -Path $soundJni -Force | Out-Null
$soundCppContent = @"
#include <memory>
#include <string>
#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>

namespace facebook {
namespace react {

std::shared_ptr<TurboModule> RNSoundSpec_ModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params) {
  return nullptr;
}

}
}
"@
Set-Content -Path "$soundJni\dummy.cpp" -Value $soundCppContent
Set-Content -Path "$soundJni\CMakeLists.txt" -Value @"
cmake_minimum_required(VERSION 3.13)
add_library(react_codegen_RNSoundSpec SHARED dummy.cpp)
target_include_directories(react_codegen_RNSoundSpec PUBLIC .)
target_link_libraries(react_codegen_RNSoundSpec fbjni jsi reactnative)
"@

# 5. Copy missing specs into autolinking jni dir
$autolinkJni = 'android\app\build\generated\autolinking\src\main\jni'
New-Item -ItemType Directory -Path $autolinkJni -Force | Out-Null
if (Test-Path 'android\app\build\generated\source\codegen\jni\RNCGeolocationSpec.h') {
    Copy-Item -Path 'android\app\build\generated\source\codegen\jni\RNCGeolocationSpec.h' -Destination "$autolinkJni\RNCGeolocationSpec.h" -Force
}
if (Test-Path 'android\app\build\generated\source\codegen\jni\RNSoundSpec.h') {
    Copy-Item -Path 'android\app\build\generated\source\codegen\jni\RNSoundSpec.h' -Destination "$autolinkJni\RNSoundSpec.h" -Force
}

# 6. Make app codegen CMakeLists.txt compile a clean dummy file with unique target react_codegen_appmodules_spec
$appCodegenJni = 'android\app\build\generated\source\codegen\jni'
$dummyCppContent = @"
#include <memory>
#include <string>
#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>

namespace facebook {
namespace react {

void appmodules_spec_registerComponentDescriptorsFromCodegen(
    std::shared_ptr<const ComponentDescriptorProviderRegistry> providerRegistry) {}

std::shared_ptr<TurboModule> appmodules_spec_ModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params) {
  return nullptr;
}

}
}
"@
Set-Content -Path "$appCodegenJni\app_dummy.cpp" -Value $dummyCppContent

$appCodegenCmake = "$appCodegenJni\CMakeLists.txt"
$cleanCmake = @"
cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_library(
  react_codegen_appmodules_spec
  OBJECT
  app_dummy.cpp
)

target_include_directories(react_codegen_appmodules_spec PUBLIC . react/renderer/components/appmodules_spec)

target_link_libraries(
  react_codegen_appmodules_spec
  fbjni
  jsi
  reactnative
)
"@
Set-Content -Path $appCodegenCmake -Value $cleanCmake

# 7. Map headers to appmodules_spec in autolinking and codegen jni dirs
if (Test-Path "$appCodegenJni\RNCWebViewSpec.h") {
    Copy-Item -Path "$appCodegenJni\RNCWebViewSpec.h" -Destination "$appCodegenJni\appmodules_spec.h" -Force
    Copy-Item -Path "$appCodegenJni\RNCWebViewSpec.h" -Destination "$autolinkJni\appmodules_spec.h" -Force
}

$compDir = "$appCodegenJni\react\renderer\components\RNCWebViewSpec"
if (Test-Path $compDir) {
    $targetCompDir = "$appCodegenJni\react\renderer\components\appmodules_spec"
    New-Item -ItemType Directory -Path $targetCompDir -Force | Out-Null
    Copy-Item -Path "$compDir\*" -Destination $targetCompDir -Recurse -Force
}

# 8. Rename symbol declarations in appmodules_spec headers to match appmodules_spec
Get-ChildItem -Path $appCodegenJni -Recurse -Filter "*.h" | ForEach-Object {
    (Get-Content $_.FullName) -replace 'RNCWebViewSpec_registerComponentDescriptorsFromCodegen', 'appmodules_spec_registerComponentDescriptorsFromCodegen' -replace 'RNCWebViewSpec_ModuleProvider', 'appmodules_spec_ModuleProvider' | Set-Content $_.FullName
}
Get-ChildItem -Path $autolinkJni -Recurse -Filter "*.h" | ForEach-Object {
    (Get-Content $_.FullName) -replace 'RNCWebViewSpec_registerComponentDescriptorsFromCodegen', 'appmodules_spec_registerComponentDescriptorsFromCodegen' -replace 'RNCWebViewSpec_ModuleProvider', 'appmodules_spec_ModuleProvider' | Set-Content $_.FullName
}

# 9. Clean CXX build cache
Remove-Item -Path 'android\app\.cxx' -Recurse -Force -ErrorAction SilentlyContinue

Write-Output "Java codegen cleaned to prevent DEX merging duplicate class errors!"

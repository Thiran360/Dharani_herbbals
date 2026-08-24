Remove-Item -Path 'node_modules\@react-native-community\geolocation\android\build' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path 'node_modules\react-native-sound\android\build' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path 'android\app\.cxx' -Recurse -Force -ErrorAction SilentlyContinue

# Ensure codegen is run for app
node node_modules/react-native/scripts/generate-codegen-artifacts.js -p ./ -t android -o ./

# Create geo directory
$geoJni = 'node_modules\@react-native-community\geolocation\android\build\generated\source\codegen\jni'
New-Item -ItemType Directory -Path "$geoJni\react\renderer\components\RNCGeolocationSpec" -Force | Out-Null
Copy-Item -Path "android\app\build\generated\source\codegen\jni\react\renderer\components\RNCGeolocationSpec\*" -Destination "$geoJni\react\renderer\components\RNCGeolocationSpec" -Recurse -Force

$geoCmake = @"
cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB react_codegen_RNCGeolocationSpec_SRC CONFIGURE_DEPENDS
  react/renderer/components/RNCGeolocationSpec/*.cpp
  *.cpp
)

add_library(react_codegen_RNCGeolocationSpec SHARED `${react_codegen_RNCGeolocationSpec_SRC})

target_include_directories(react_codegen_RNCGeolocationSpec PUBLIC .)

target_link_libraries(react_codegen_RNCGeolocationSpec
  fbjni
  jsi
  reactnative
)
"@
Set-Content -Path "$geoJni\CMakeLists.txt" -Value $geoCmake

# Create sound directory
$soundJni = 'node_modules\react-native-sound\android\build\generated\source\codegen\jni'
New-Item -ItemType Directory -Path "$soundJni\react\renderer\components\RNSoundSpec" -Force | Out-Null
Copy-Item -Path "android\app\build\generated\source\codegen\jni\react\renderer\components\RNSoundSpec\*" -Destination "$soundJni\react\renderer\components\RNSoundSpec" -Recurse -Force

$soundCmake = @"
cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB react_codegen_RNSoundSpec_SRC CONFIGURE_DEPENDS
  react/renderer/components/RNSoundSpec/*.cpp
  *.cpp
)

add_library(react_codegen_RNSoundSpec SHARED `${react_codegen_RNSoundSpec_SRC})

target_include_directories(react_codegen_RNSoundSpec PUBLIC .)

target_link_libraries(react_codegen_RNSoundSpec
  fbjni
  jsi
  reactnative
)
"@
Set-Content -Path "$soundJni\CMakeLists.txt" -Value $soundCmake

Write-Output "Autolink C++ targets configured accurately!"

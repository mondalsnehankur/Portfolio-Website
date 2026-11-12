#!/bin/sh
# Builds wasm/space.wasm and wasm/space-wasm.js (base64, so the demo also works from file://).
# Needs clang with the wasm32 target and wasm-ld. With Emscripten you could instead run:
#   emcc src/physics.c src/planets.c src/wasm_api.c -O2 -o space.js
set -e
cd "$(dirname "$0")/src"
clang --target=wasm32 -O2 -nostdlib -ffreestanding -fno-math-errno -Ishim -I. \
  -Wl,--no-entry -Wl,--allow-undefined \
  physics.c planets.c wasm_api.c shim/libm_shim.c -o ../space.wasm
cd ..
printf 'window.SPACE_WASM_B64="%s";\n' "$(base64 -w0 space.wasm)" > space-wasm.js
ls -l space.wasm

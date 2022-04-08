#include <napi.h>
#include "guessHandleType.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  return InitPlugin(env, exports);
}

NODE_API_MODULE(guessHandleType, InitAll)

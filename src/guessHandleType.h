#include <napi.h>
#include <uv.h>

std::string guessHandleType(int file);
Napi::String guessHandleTypeWrapped(const Napi::CallbackInfo& info);
Napi::Object InitPlugin(Napi::Env env, Napi::Object exports);

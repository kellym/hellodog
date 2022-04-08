#include "guessHandleType.h"

std::string guessHandleType(int file) {
  uv_handle_type t;
  const char* type = nullptr;

  t = uv_guess_handle(file);
  switch (t) {
    case UV_TCP:
      type = "TCP";
      break;
    case UV_TTY:
      type = "TTY";
      break;
    case UV_UDP:
      type = "UDP";
      break;
    case UV_FILE:
      type = "FILE";
      break;
    case UV_NAMED_PIPE:
      type = "PIPE";
      break;
    default:
      type = "UNKNOWN";
  }
  return type;
}

Napi::String guessHandleTypeWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
  }
  Napi::Number first = info[0].As<Napi::Number>();
  Napi::String returnValue = Napi::String::New(env, guessHandleType(first.Int32Value()));
  return returnValue;
}

Napi::Object InitPlugin(Napi::Env env, Napi::Object exports) {
  exports.Set(
    "guessHandleType", Napi::Function::New(env, guessHandleTypeWrapped)
  );
  return exports;
}

{
  "targets": [{
     "target_name": "guessHandleType",
     "cflags!": [ "-fno-exceptions" ],
     "cflags_cc!": [ "-fno-exceptions" ],
     "sources": [
       "src/main.cpp",
       "src/guessHandleType.cpp"
     ],
     'include_dirs': [
       "<!@(node -p \"require('node-addon-api').include\")"
     ],
     'libraries': [],
     'dependencies': [
       "<!(node -p \"require('node-addon-api').gyp\")"
     ],
     'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
  }]
}

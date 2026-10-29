# Vendored tesseract.js assets (PRIV-8/P7: no CDN at runtime)

| File | Source | sha256 |
| --- | --- | --- |
| eng.traineddata | https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata (downloaded 2026-10-29) | 7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2 |
| worker.min.js | npm tesseract.js@5.1.1 | aca1229639fc9907d86f96e825955a2b7c5716d17f3bc3acd71f9c7ab66181fc |
| tesseract-core-lstm.wasm | npm tesseract.js-core@5.1.1 | 5db58ea4d1bd4256be81e8ae3b4fa226c4625dfba1850b1b3308dbf3700e9929 |
| tesseract-core-lstm.wasm.js | npm tesseract.js-core@5.1.1 | 8f04aa0cc81e7bde33f80e92fa01a7a665f0b4884d098acf5de9c7104a11dfaa |
| tesseract-core-simd-lstm.wasm | npm tesseract.js-core@5.1.1 | 66b601224a0c4a8977bc9d92dd39841189f9ca22cc4122fcd7208cdb0961eeef |
| tesseract-core-simd-lstm.wasm.js | npm tesseract.js-core@5.1.1 | ce20eda9533cbed1e6c2b4276fbae1e0adc61b6754b5513084be601787b457cf |

Re-copy the npm-derived files from node_modules when tesseract.js is upgraded; they must stay in step with the package (see worker.ts).

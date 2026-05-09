# NOTICE

MotsDits © Copyright {{COMPANY_NAME}}, {{YEAR}}. All rights reserved.

## Origin

MotsDits is a derivative work of [Handy](https://github.com/cjpais/Handy)
(© 2025 CJ Pais), used and redistributed under the terms of the MIT License.
The full text of the original Handy license is included in
[`THIRD-PARTY-LICENSES.md`](./THIRD-PARTY-LICENSES.md) under the section
"Handy (upstream fork base)".

## Third-party components

MotsDits bundles 961 Rust crates and 130 NPM packages. A complete itemized
list with license attribution is provided in
[`THIRD-PARTY-LICENSES.md`](./THIRD-PARTY-LICENSES.md).

All bundled components are governed by permissive licenses (MIT, Apache-2.0,
BSD, ISC) or weak-copyleft licenses (MPL-2.0). No GPL, AGPL, or strong-copyleft
component is incorporated.

## Trademarks

"MotsDits" and the MotsDits logo are trademarks of {{COMPANY_NAME}}.
"Whisper" is a trademark of OpenAI, Inc.
"Tauri" is a trademark of the Tauri Programme within The Commons Conservancy.
All other trademarks are the property of their respective owners.

## Optional models

When the user opts in to download the Quebec French Whisper model
(`whisper-large-v3-turbo-fr-quebecois`), that model is governed by the license
of its original author (ele-sage on Hugging Face). MotsDits does not relicense
the model; it merely converts it from Safetensors to GGML format for
compatibility with whisper.cpp.

LLM post-processing providers (OpenAI, Anthropic, Google Gemini, Groq, etc.)
are accessed via their public APIs under credentials supplied by the end user.
Their respective terms of service apply; MotsDits is not a party to those
agreements.

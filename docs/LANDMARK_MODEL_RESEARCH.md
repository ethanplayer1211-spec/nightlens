# Licensed landmark models: acquisition and placement limits

Checked November 15, 2026. This pass acquired original model binaries and source provenance only. It did not change the renderer, edit textures, place a model, or certify architectural accuracy.

## Acquired source models

| Model | Creator and source | License | Original public GLB |
|---|---|---|---|
| Petronas Twin Towers | [NanoRay](https://sketchfab.com/3d-models/petronas-twin-towers-4111f3de53f24ab0a9547205723665b1) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `public/data/realism/models/petronas-nanoray.glb`, 1,854,460 bytes |
| Sydney Opera House | [Nick Reinhardt / Nickardiamond](https://sketchfab.com/3d-models/sydney-opera-house-317b2d540f0a4f7e8d87dd3b0372712d) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `public/data/realism/models/opera-house-nickardiamond.glb`, 11,466,660 bytes |

Both came from the **official public [Ai2 Objaverse dataset](https://huggingface.co/datasets/allenai/objaverse)**. Its dataset card states that individual objects retain their Creative Commons licenses and that per-object metadata supplies the applicable license. The collection as a database has the separate ODC-By 1.0 license. The [official downloading implementation](https://github.com/allenai/objaverse-xl/blob/main/objaverse/__init__.py) documents the UID index, metadata shards and original GLB paths used here.

For each object, the current public Sketchfab API identifies the creator, marks it downloadable and specifies CC BY 4.0. The archived Objaverse metadata agrees on the exact object UID, creator and `by` license. Each GLB also contains `asset.extras` with the author, original source URL, title and CC-BY-4.0 statement. This cross-check distinguishes the acquired assets from merely finding an unrelated marketplace preview. Sketchfab's anonymous official download endpoint returned HTTP 401; no account access, viewer extraction or authorization workaround was used. The download source was the independently public Creative Commons dataset linked from the primary Objaverse project.

`data/landmark-model-sources.json` records exact URLs, source/raw files, timestamps, original byte counts, SHA-256, architecture limits and candidate decisions. Original GLBs are also preserved under `data/raw/`. Attribution accompanies the public models in `public/data/realism/models/ATTRIBUTION.txt`. The published application must retain visible creator/source/license credit and identify any subsequent transformations. Model licenses remain separate from MIT application code.

Run `python scripts/acquire_landmark_models.py` to verify the acquired model hashes, binary headers, preserved-original equality, and matching GLB source/license extras without network. `--refresh` reacquires only the pinned public archive binaries and refuses changed hashes or files over 15 MB.

## Petronas integration notes

The file contains **5 meshes, 5 materials, 7 nodes, no images or textures, and no required extensions**. Each primitive is a triangle list. Positions and normals are Float32; indices are UInt32. This makes it feasible to consume its actual indexed geometry in the existing native renderer without a heavyweight engine or image processing.

The node hierarchy matters: the root includes a rotation and translation. Source local position bounds across meshes are approximately `[-24.822, -180.5, -16.75]` to `[30, 0, 10]`, a height of **180.5 source units**, not 452 metres. Apply the complete node transforms, normalize the transformed base, and deliberately scale/rotate/place it against the selected published architectural height and mapped tower anchors. Do not silently treat source units or orientation as surveyed metres or north. A single uniform fit to height alone does not prove that tower spacing, bridge dimensions or detailed proportions agree with the map. This is an artist-authored architectural representation; registration and visual inspection remain the renderer owner's work.

Five material definitions include base colour, metallic and roughness factors. There are no baked photographic windows or lighting textures. A night-lighting adaptation must remain visibly labeled illustrative, and any change to the original appearance should be documented as a model adaptation.

## Opera House integration notes

The original GLB has **10 meshes, 10 materials, 23 embedded images, and no required extensions**. It is larger and has a deeper transform hierarchy, including decorative scene context. The creator describes it as a contribution to a **Stylized Station challenge**, modeled in Blender with a Substance Painter PBR workflow. It should therefore be evaluated as a detailed artistic source, not presented as a heritage scan or surveyed CAD model. Its surrounding planes/decorative components and shell structure need inspection before importing all meshes into a geographic scene. No embedded image or texture was edited or re-encoded during acquisition.

## Why the previous 3DMR Petronas source was not acquired

The [official 3DMR model page](https://3dmr.eu/model/3) expressly labels its Petronas model **CC0 1.0**, and [its API](https://3dmr.eu/api/info/3) identifies revision 1, uploaded March 17, 2018 by user `72555` / `-karlos-`. However, the same primary page and API description link to TurboSquid item 311222 and retain the uploader's statement that they are checking extended-use clearances. The repository's software license is not evidence about a third-party model. The source therefore has a concrete unresolved provenance conflict; this pass did not assume that either the CC0 label resolves the upstream question or that the model is definitively unlicensed. The model binary was not downloaded. The exact original API response is preserved as `data/raw/landmark-3dmr-petronas-info.json`.

## Other candidates and boundaries

- **KL Tower:** a free “Menara KL Tower” TurboSquid listing exists, but no open asset-redistribution grant, direct authorized download and complete source chain were established in this bounded pass. Marketplace “free” describes price, not a Creative Commons license. No purchase, new account flow or viewer extraction occurred. A dimension-constrained original reconstruction remains available while a better licensed source is sought.
- **Brooklyn Bridge:** the [CMBC model](https://sketchfab.com/3d-models/0aeb37ea6cdf480aab19eb204f5255ee) has a clear CC BY 4.0 record and an official Objaverse archive path. A HEAD response reported **161,319,676 bytes**, with source metadata reporting about 1.48 million faces. This exceeded the 15 MB acquisition bound, so no binary was fetched. An optional [Union / krprom model](https://sketchfab.com/3d-models/brooklyn-bridge-a1ea746e42d6499080d73db514848d6b) is listed as CC Attribution and much smaller in geometry, but its 2024 UID was absent from the original Objaverse index and the normal provider download requires authenticated access.
- **Generated assets:** AI-generated landmark candidates were not used as evidence of true architectural fidelity.

These source models improve the available artistic geometry. Their licenses and downloads do not independently validate dimensions, materials, current construction, facade operation, eye pose or the visibility of a selected-time sky.

Current integration: NanoRay’s model is rendered with the documented registration and bridge replacement. The optional Opera House binary is retained only in `data/raw` for research; it is not a public runtime asset or rendered in Sydney. The verifier accepts research-only records with no publicFile.

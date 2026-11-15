# 3D model credits

The Apollo 11, Viking 1, Opportunity and InSight models are from NASA's 3D Resources (https://science.nasa.gov/3d-resources/, mirrored at
https://github.com/nasa/NASA-3D-Resources). NASA 3D Resources are free to use under the NASA Images and Media
Usage Guidelines (https://www.nasa.gov/nasa-brand-center/images-and-media/). Credit: NASA.

Licence check (2026-11-15): the NASA Images and Media Usage Guidelines page says NASA content, including files used in 3D models such as texture maps and polygon data, is generally not subject to copyright in the US. Educational or informational use, including computer graphical simulations and Internet web pages, is permitted. NASA should be acknowledged as the source, and use must not imply endorsement. The GitHub repository page could not be read by the fetch tool, so the per-model terms in the repository were not checked. Acknowledgement: "Mission images and the Apollo 11, Viking 1, Opportunity and InSight 3D models: NASA." (shown under Credits in the app).

The Surveyor 3 and Apollo 17 models are not NASA models. They were generated with Claude Code (Anthropic) for this project and are not official NASA assets. They are simplified representations, not exact reproductions of the spacecraft.

The NASA originals are Draco-compressed GLB files. `scripts/prepare-models.js` decodes them to plain GLB (the app has no
Draco decoder), welds and quantizes geometry, and removes unused data. Originals are kept in `raw-models/` (not committed).

| File | Mission | Source | Size | Triangles |
| --- | --- | --- | --- | --- |
| apollo11.glb | Apollo 11 Eagle (Apollo Lunar Module) | https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Apollo%20Lunar%20Module | 1.64 MB | 97,588 |
| viking1.glb | Viking 1 lander | https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Viking%20Lander | 1.37 MB | 99,526 |
| opportunity.glb | Opportunity (MER-B) | https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Mars%20Exploration%20Rover%20-%20Opportunity%20(MER-B) | 0.12 MB | 3,845 |
| insight.glb | InSight lander (replaced by the developer on 2026-11-15 with a different NASA GLB; exact download page not recorded; Draco-decoded and decimated to ~60% for the 5 MB budget; original kept in raw-models/insight-new-original.glb) | https://science.nasa.gov/3d-resources/ (NASA 3D Resources; specific model page not recorded) | 4.55 MB | 92,227 |

## Generated models (not from NASA)
| File | Mission | Source | Size |
| --- | --- | --- | --- |
| surveyor3.glb | Surveyor 3 lander | Generated with Claude Code | 0.43 MB |
| apollo17.glb | Apollo 17 Lunar Roving Vehicle | Generated with Claude Code | 0.77 MB |

No NASA 3D model was found for either craft in NASA 3D Resources.

Notes: the Apollo model is the whole Apollo Lunar Module (not only the descent stage). The previous InSight model was the cruise-configuration lander; the current one was supplied by the developer (NASA), so its pose is unchecked.

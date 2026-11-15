# Licence check

Checked 2026-11-15 (task 31.6).

| Asset group | Licence | Attribution required | Verdict |
|---|---|---|---|
| Moon and Mars textures | CC BY 4.0 (Solar System Scope) | Yes | OK with attribution, shown in app |
| Audio (9 files, 6 OpenGameArt pages) | CC0 | No | OK |
| NASA 3D models (4 GLB) | NASA media usage guidelines | Acknowledge NASA as source | OK |
| Chapter images (28 images in `missions.json`) | NASA, generally not copyrighted | Acknowledge NASA as source | OK, credits match |
| Fonts Orbitron, Exo 2 | SIL OFL 1.1 via Google Fonts | No | OK |

## Textures
- Files: `moon_2k.jpg`, `mars_2k.jpg` from https://www.solarsystemscope.com/textures/.
- Licence evidence: the textures page text we fetched has no licence statement, and `/license/` returns 404. CC BY 4.0 is confirmed by the Qt 3D documentation attribution page and by Wikimedia Commons pages for other Solar System Scope textures. Use in a hackathon website is permitted by CC BY (commercial and non-commercial use allowed) if the conditions are met.
- Conditions: give credit, link the licence, state changes. Files are unmodified.
- Attribution text: "Moon and Mars textures courtesy of Solar System Scope (www.solarsystemscope.com), licensed under CC BY 4.0. Based on NASA elevation and imagery data. Used unmodified." Link: https://creativecommons.org/licenses/by/4.0/
- In-app: a collapsible "Credits" block (`src/ui/creditsBlock.js`, text from `src/data/credits.json`) in the opening overlay footer and on the closing screen. The opening view is the first place the textures appear and every user sees it.
- Unverified: the first-party licence statement. The live page may show it only in script-rendered content. Re-check it in a browser before release.

## Audio
All six OpenGameArt pages were fetched and each still states CC0 / public domain: Steller Dreams (synth-thetic), Iridescent Deep, Gates to Infinity, Alien World, Waking States (Tsorthan Grove), Dark Sci-Fi Audio Pack (SRG774). No attribution is required. A courtesy line is shown under Credits: "Music and sounds: synth-thetic, Tsorthan Grove and SRG774, CC0, via OpenGameArt.org."
- Unverified: pages could change after this date, and the uploader's own rights to the work cannot be verified.

## NASA 3D models
Source: NASA 3D Resources. The NASA Images and Media Usage Guidelines (https://www.nasa.gov/nasa-brand-center/images-and-media/) say NASA content, including texture maps and polygon data for 3D models, is generally not subject to copyright in the US. Educational or informational use, including web pages, is allowed. NASA should be acknowledged and endorsement must not be implied. The NASA logo, insignia and worm must not be used. Attribution text: "Mission images and 3D models: NASA. Used under the NASA Images and Media Usage Guidelines. Not an official NASA product and not endorsed by NASA."
- Unverified: the GitHub repository page could not be read with the fetch tool, so any per-model notes there were not checked. Models were also re-processed (decoded, welded, quantized, one decimated).

## Chapter images
The NASA Image and Video Library API (images-api.nasa.gov) was queried for each `nasaId` in `missions.json`. All 28 records were found. For every image the `center` or `secondary_creator` field is consistent with the caption credit (JSC records for Apollo 12, 11 and 17 captions; JPL and the credited partner for PIA records, such as NASA/GSFC/Arizona State University for PIA12922). No record named a copyright holder or a non-NASA source, and none of the descriptions contained the words "copyright", "courtesy" or "permission". No image is flagged. `missions.json` was not edited.
- Unverified: the API returns no explicit rights field, so a rights note appearing only on an images.nasa.gov detail page was not checked.

## Fonts
Google Fonts metadata (github.com/google/fonts) lists both as `license: "OFL"`: Orbitron (Matt McInerney, copyright The Orbitron Project Authors) and Exo 2 (Natanael Gama, copyright The Exo 2 Project Authors). SIL OFL 1.1 permits web use, loaded from the Google Fonts CDN, with no attribution. No in-app credit is required.
- Unverified: the fonts.google.com licence page could not be read by the fetch tool.

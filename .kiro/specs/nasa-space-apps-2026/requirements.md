# Requirements Document

## Introduction

This project is an interactive 3D space-themed website built for the NASA Space Apps 2026 challenge. The site lets users "fly" through space between the Moon and Mars, land near specific NASA hardware left behind on each world, inspect 3D models of the equipment, and experience each mission's story from the hardware's first-person perspective. The target audience is school-age space enthusiasts aged 10–17. The project is built by a single developer using Three.js, HTML, CSS, and JavaScript, with free NASA 3D models sourced from nasa3d.arc.nasa.gov.

Six missions are featured:

| Mission | Hardware | Location |
|---|---|---|
| Surveyor 3 | Surveyor 3 Lander | Ocean of Storms, Moon |
| Apollo 11 | Eagle Descent Stage | Tranquility Base, Moon |
| Apollo 17 | Lunar Roving Vehicle | Taurus-Littrow Valley, Moon |
| Viking 1 | Viking 1 Lander | Chryse Planitia, Mars |
| Opportunity | Opportunity Rover | Perseverance Valley, Mars |
| InSight | InSight Lander | Elysium Planitia, Mars |

---

## Glossary

- **Space_Scene**: The animated Three.js 3D environment that renders stars, the Moon, and Mars in a single browser canvas.
- **Celestial_Body**: Either the Moon or Mars as rendered in the Space_Scene.
- **Mission_Marker**: A glowing 3D indicator placed on a Celestial_Body at the real-world coordinates of NASA hardware.
- **Hardware_Model**: A Three.js-rendered 3D model (OBJ or GLTF format) representing a specific piece of NASA equipment.
- **Story_Panel**: An HTML overlay that displays the mission name, dates, first-person narrative, key science discoveries, and final status for one mission.
- **First_Person_Narrative**: Text written from the perspective of the Hardware_Model (e.g., "I am Eagle, I touched down on the Sea of Tranquility…"), targeted at readers aged 10–17.
- **Mission_Quiz**: An optional set of three multiple-choice questions about a mission, offered from the end-of-story summary after the reader has scrolled past the final Story_Chapter of that mission.
- **Camera**: The Three.js perspective camera that the user controls to navigate the Space_Scene.
- **Fly_Animation**: A smooth, animated Camera transition between two positions in the Space_Scene.
- **Source_Citation**: A link or reference to the NASA official source that verifies a scientific fact used in the Story_Panel.
- **NASA_3D_Library**: The collection of free 3D models available at https://nasa3d.arc.nasa.gov/models in OBJ or GLTF format.
- **Story_Chapter**: A named narrative segment within a mission story (e.g., "Launch", "Landing", "Discovery", "Farewell"). Each mission has between 3 and 5 Story_Chapters.
- **Scroll_Progress**: A normalised value between 0.0 and 1.0 representing how far the user has scrolled through the current Story_Chapter, derived from the page scroll position relative to the chapter's scroll range.
- **Scroll_Trigger**: A scroll position threshold at which a Story_Chapter becomes active and its associated 3D camera state or Hardware_Model animation begins.
- **Chapter_Image**: A NASA public domain photograph or illustration sourced from images.nasa.gov, displayed inline within a Story_Chapter between narrative paragraphs to visually support the chapter's text.
- **Full_Journey_Mode**: A guided, sequential playback of all six mission narratives in chronological order (Surveyor 3 → Apollo 11 → Apollo 17 → Viking 1 → Opportunity → InSight), triggered by a single button on the opening Space_Scene, using the same scroll-driven storytelling and 3D camera animations as the individual marker-click flow.
- **Surface_Texture**: A high-resolution image map applied to a Celestial_Body sphere in Three.js to render its real surface appearance — lunar craters, maria, and highlands for the Moon; rust-coloured terrain, Valles Marineris, and Olympus Mons for Mars. Sourced from NASA public domain imagery or CC-licensed texture libraries such as Solar System Scope (solarsystemscope.com/textures).
- **Ambient_Track**: A looping background music or sound composition that plays during a specific site or Story_Chapter to reinforce the emotional tone of the narrative. Sourced from royalty-free or Creative Commons licensed audio libraries.
- **Audio_Controller**: The site-wide UI element that allows the user to mute, unmute, or adjust the volume of all Ambient_Tracks without interrupting the visual experience.
- **UI_Sound_Effect**: A short, space-themed audio cue (such as a soft chime, tone, or subtle electronic blip) played in response to a user interaction with a specific UI element, distinct from Ambient_Tracks and sourced from royalty-free or NASA public domain audio collections.
- **Heading_Font**: The typeface used for all headings, chapter titles, mission names, and UI button text — specified as Orbitron (Google Fonts), a geometric sans-serif with a space-tech character, loaded via Google Fonts CDN.
- **Body_Font**: The typeface used for all narrative body text, science callouts, captions, and tooltips — specified as Exo 2 (Google Fonts), a humanist sans-serif designed for readability at all sizes, loaded via Google Fonts CDN.

---

## Requirements

### Requirement 1: Animated 3D Space Scene

**User Story:** As a space enthusiast aged 10–17, I want to open the site and immediately see an animated 3D space environment, so that I feel immersed in space before I start exploring.

#### Acceptance Criteria

1. THE Space_Scene SHALL render a starfield background with at least 1,000 individual star points pseudo-randomly distributed such that no quadrant of the viewport contains fewer than 100 star points.
2. THE Space_Scene SHALL display a 3D sphere representing the Moon and a 3D sphere representing Mars, both occupying at least 5% of the viewport width each and fully within the viewport bounds from the initial Camera position; each sphere SHALL have a Surface_Texture applied that renders its real surface appearance — the Moon sphere SHALL display recognisable lunar features including crater patterns, dark maria, and bright highlands, and the Mars sphere SHALL display recognisable Martian features including the reddish-orange terrain, Valles Marineris canyon system, and polar ice cap regions.
3. WHEN the page finishes loading with all 3D assets ready, THE Space_Scene SHALL begin animating within 500 milliseconds without requiring any user interaction.
4. THE Space_Scene SHALL maintain a minimum frame rate of 30 frames per second and SHALL NOT render at more than 60 frames per second, on a device meeting the minimum hardware requirement of a laptop with integrated graphics.
5. IF the browser does not support WebGL, THEN THE Space_Scene SHALL display a static fallback message informing the user that a WebGL-capable browser is required and suggesting they upgrade or switch browsers.
6. THE Space_Scene SHALL display the site title 'Silent Explorers' and, directly beneath it, the subtitle 'The untold stories of NASA's machines, still resting on the Moon and Mars, abandoned but not forgotten', both centred horizontally in the upper portion of the viewport above the Moon and Mars spheres and rendered in the Heading_Font (Orbitron) in the colour `#FFFFFF` with a subtle text-shadow or glow effect to make the text stand out against the starfield; the title SHALL be at least 36 pixels and the subtitle at least 18 pixels, and the subtitle SHALL be permitted to wrap onto multiple centred lines on narrower viewports without overflowing the viewport width; the title and subtitle text SHALL be defined in the site content data and SHALL be visible from the moment the Space_Scene begins animating.

---

### Requirement 2: Space Flight Navigation

**User Story:** As a user, I want to "fly" between the Moon and Mars by controlling the camera, so that I experience the journey through space as an explorer.

#### Acceptance Criteria

1. WHEN the user drags using a mouse, trackpad, or touch input, THE Space_Scene SHALL rotate the camera view in the direction of the drag input.
2. WHEN the user scrolls or pinches using a mouse, trackpad, or touch input, THE Space_Scene SHALL zoom the camera such that the distance to the focal point stays within a range that keeps at least one Celestial_Body fully visible and does not penetrate the surface of any Celestial_Body.
3. WHEN the user selects a Celestial_Body for travel, THE Camera SHALL execute a Fly_Animation that transitions from the current position to a distance that frames the entire Celestial_Body within the viewport, completing the transition in 2 to 4 seconds at no fewer than 30 frames per second.
4. WHILE a Fly_Animation is in progress, THE Space_Scene SHALL continue rendering the starfield and Celestial_Bodies at no fewer than 30 frames per second.
5. WHILE a Fly_Animation is in progress, THE Space_Scene SHALL ignore camera rotate and zoom inputs from the user.
6. WHILE the user is viewing a Celestial_Body as the current focal point, THE Space_Scene SHALL display an on-screen label identifying that Celestial_Body by name.

---

### Requirement 3: Mission Markers on Celestial Bodies

**User Story:** As a user orbiting a Celestial_Body, I want to see glowing markers at the locations of NASA hardware, so that I know where to explore.

#### Acceptance Criteria

1. THE Space_Scene SHALL display exactly three Mission_Markers on the Moon: one at the Surveyor 3 site (Ocean of Storms, Oceanus Procellarum), one at the Apollo 11 site (Tranquility Base), and one at the Apollo 17 site (Taurus-Littrow Valley).
2. THE Space_Scene SHALL display exactly three Mission_Markers on Mars: one at Chryse Planitia (Viking 1), one at Perseverance Valley (Opportunity), and one at Elysium Planitia (InSight).
3. EACH Mission_Marker SHALL pulse or glow continuously, with a rendered screen radius no greater than 2% of the viewport's smaller dimension, so that the marker draws visual attention without obscuring the Celestial_Body surface beneath it.
4. WHEN the user hovers over or focuses a Mission_Marker, THE Space_Scene SHALL display a tooltip containing the mission name and landing location name, with tooltip text no longer than 80 characters total.
5. WHEN the user clicks or activates a focused Mission_Marker, THE Space_Scene SHALL expand the tooltip to include the mission year and a one-sentence mission description of no more than 160 characters.
6. IF a Mission_Marker cannot be loaded due to a rendering error, THEN THE Space_Scene SHALL render a static fallback marker at the expected coordinates, log the error to the browser console, and continue rendering the remaining Mission_Markers.

---

### Requirement 4: Camera Fly-In to Mission Site

**User Story:** As a user, I want to click a mission marker and have the camera fly in close to that location, so that I feel like I am arriving at the landing site.

#### Acceptance Criteria

1. WHEN the user clicks or taps a Mission_Marker, THE Camera SHALL execute a Fly_Animation that transitions from the orbital view to a surface-level view no further than 500 meters above the mission site surface, over a duration between 2 and 5 seconds.
2. WHEN the Fly_Animation to a mission site completes, THE Space_Scene SHALL display the Hardware_Model for that mission positioned within 10 meters of the recorded landing coordinates at surface level.
3. WHEN the Fly_Animation to a mission site completes, THE Story_Panel for that mission SHALL appear simultaneously with the Hardware_Model, rendered adjacent to it within the same viewport.
4. THE Camera Fly_Animation SHALL use a non-linear easing function (ease-in-out) so that the motion accelerates from the start and decelerates before reaching the destination, with no instantaneous cuts at any point during the transition.
5. IF the user clicks or taps a different Mission_Marker while a Fly_Animation is in progress, THEN THE Camera SHALL cancel the current Fly_Animation and immediately begin a new Fly_Animation toward the newly selected mission site.
6. IF the Hardware_Model for the selected mission fails to load before the Fly_Animation completes, THEN THE Space_Scene SHALL still complete the Fly_Animation, display an error message indicating the model could not be loaded, and automatically dismiss that error message after 5 seconds while keeping the mission site view visible.

---

### Requirement 5: Hardware 3D Model Display and Inspection

**User Story:** As a user who has arrived at a mission site, I want to see and rotate a 3D model of the NASA hardware, so that I can inspect what was left on that world.

#### Acceptance Criteria

1. THE Space_Scene SHALL load and display a Hardware_Model for each of the six missions using assets sourced from the NASA_3D_Library in OBJ or GLTF format.
2. WHEN a Hardware_Model is loaded, THE Space_Scene SHALL display the Hardware_Model centered in the viewport and scaled so that the full model fits within the viewport without the user zooming.
3. WHEN a Hardware_Model is displayed, THE user SHALL be able to rotate it freely on both the horizontal and vertical axes by clicking and dragging with a mouse or by dragging with a single finger on a touch screen.
4. WHEN a Hardware_Model is displayed, THE user SHALL be able to zoom in and out on the Hardware_Model using a scroll wheel or a two-finger pinch gesture, within a range of 0.5× to 5× of the default view scale.
5. THE Hardware_Model SHALL be lit with at least one ambient light source and at least one directional light source such that no face of the Hardware_Model is rendered entirely unlit.
6. IF a Hardware_Model file fails to load, THEN THE Space_Scene SHALL display a placeholder shape labelled with the mission name and the text "model unavailable" in the model's position and show an error message indicating that the model could not be loaded.
7. WHEN the user navigates away from a mission site, THE Space_Scene SHALL remove the Hardware_Model from the scene so that it is no longer rendered.

---

### Requirement 6: Scroll-Driven Mission Storytelling

**User Story:** As a user exploring a mission site, I want the mission story to unfold as I scroll down, with the 3D hardware model reacting to what I'm reading, so that I feel immersed in the mission narrative. Able to connect emotionally with the mission and learn its science.

#### Acceptance Criteria

1. WHEN the user arrives at a mission site, THE Space_Scene SHALL lock the Three.js canvas in a fixed (sticky) position on screen so that the canvas remains visible while the user scrolls through the mission narrative.
2. WHILE the canvas is sticky, THE site SHALL render a scrollable narrative column alongside the canvas containing the Story_Chapters for the selected mission.
3. THE narrative column for each mission SHALL contain between 3 and 6 Story_Chapters, where each Story_Chapter has a chapter title, a First_Person_Narrative paragraph written at or below a 7th-grade reading level, and at least one Chapter_Image sourced from images.nasa.gov that visually relates to that chapter's narrative content.
4. WHEN a Story_Chapter enters the viewport as the user scrolls, THE site SHALL reveal the chapter title and narrative paragraph using a fade-in or slide-in animation of no more than 600 milliseconds.
5. WHEN a Story_Chapter's Scroll_Trigger is reached, THE Hardware_Model SHALL transition to the camera angle, rotation, or zoom level associated with that chapter, using a smooth animation of no more than 800 milliseconds.
6. THE First_Person_Narrative for Apollo 11 SHALL include Story_Chapters covering: (1) the landing on July 20, 1969 — during descent the lunar module guidance computer reported 1202 and 1201 program alarms, Neil Armstrong took manual control to fly past a crater and boulders, and Mission Control thought the descent stage had about 17 seconds of fuel left when he landed at Tranquility Base, with the first words from the surface being 'Houston, Tranquility Base here. The Eagle has landed'; (2) Armstrong's first step onto the lunar surface and Buzz Aldrin's description of the view as 'magnificent desolation', with the two astronauts spending about two and a half hours outside and about 21.6 hours on the surface in total before leaving in the ascent stage; (3) the scientific legacy of the samples — about 21.6 kg of lunar rock and soil, the first samples from another world, with basalts between 3 and 4 billion years old, which together with later Apollo samples helped scientists develop the giant impact theory of how the Moon formed; and (4) the hardware left behind at Tranquility Base — the descent stage, a passive seismic experiment, and a laser ranging retroreflector of 100 quartz glass prisms that scientists still use today to measure that the Moon moves about 3.8 cm farther from Earth each year.
7. THE First_Person_Narrative for Apollo 17 SHALL include Story_Chapters covering: (1) the final crewed Moon landing on December 11, 1972 at Taurus-Littrow Valley, a site chosen so that rocks both older and younger than earlier samples might be found, and the crew's liftoff on December 14, 1972; (2) the Lunar Roving Vehicle's traverses covering 35.9 km in about 4 hours 26 minutes of driving, the greatest distance driven by any crewed vehicle on the Moon; (3) geologist-astronaut Harrison Schmitt spotting orange soil at Shorty Crater during the second moonwalk, which proved to be tiny volcanic glass beads formed about 3.5 billion years ago in ancient lava fountains; and (4) the science legacy — about 110 kg of samples, a record Apollo haul that scientists still study, Eugene Cernan being the last person to have walked on the Moon, and the rover still parked in the valley.
8. THE First_Person_Narrative for Viking 1 SHALL include Story_Chapters covering: (1) the landing on July 20, 1976 on the western slopes of Chryse Planitia — NASA's first truly successful landing on Mars, since the Soviet Mars 3 lander touched down in 1971 but lost contact within seconds — including that orbiter photos showed the original target site was rougher than expected so scientists chose a new site, and that the lander set down about 28 km from its new target; (2) the first photograph from the surface, taken within minutes of landing and showing rocks and sand about 1.4 metres from a lander camera, followed by high-quality three-colour images and a 300-degree panorama, including the first colour image on July 21 which showed orange-red ground and a sky with a reddish cast caused by reddish dust suspended in the atmosphere; (3) the biology experiments — on July 28, 1976 the robot arm scooped the first soil samples into the lander's biological laboratory, and the data from four samples could have been read as a weak sign of life, but the test for organic compounds gave negative results, and NASA reports no definitive evidence of living microorganisms, so scientists still discuss how to interpret the results; (4) more than six years of operation, far beyond the planned 90 days, with recorded temperatures from about minus 86 degrees Celsius before dawn to about minus 33 degrees Celsius in the afternoon, the lander being renamed the Thomas Mutch Memorial Station in January 1982 in honour of the leader of the Viking imaging team, and its operation ending on November 11, 1982 when a faulty command sent from Earth interrupted communications and further attempts to regain contact failed; and (5) its twin, Viking 2, which landed at Utopia Planitia on September 3, 1976, photographed the first clear frost on the Martian surface seen by a lander camera in 1977, and ended communications on April 11, 1980, leaving Viking 1 as the only working spacecraft on the Martian surface for the remaining two and a half years. THE first Story_Chapter of Viking 1 SHALL include one light cross-reference sentence, written in the narrator's voice, noting that the Viking lander looked superficially like a much larger version of NASA's Surveyor Moon landers, such as Surveyor 3 which landed in 1967; the sentence SHALL be phrased so that it makes sense to a reader who has not read the Surveyor 3 story, SHALL appear identically in explore mode and in Full_Journey_Mode, and SHALL NOT require or assume that the reader has visited Surveyor 3.
9. THE First_Person_Narrative for Opportunity SHALL include Story_Chapters covering: (1) the landing in Meridiani Planum on January 24, 2004 (Pacific time), a site chosen because mineral deposits suggested that Mars had a wet history, with a planned mission of about 90 Martian days (sols); (2) the discovery of small hematite-rich spheres nicknamed 'blueberries' and other rock evidence, announced in March 2004, which together with Spirit's findings confirmed that water was long standing on the surface of Mars in ancient times; (3) the long drive — more than 14 years of operation, about 60 times the planned lifetime, and 45.16 km (28.06 miles) driven, ending at Perseverance Valley, a distance that was the off-Earth roving record until NASA's Perseverance rover passed it on October 11, 2026; and (4) the June 2018 global dust storm that blocked the rover's sunlight, its last communication on June 10, 2018, more than a thousand recovery commands, and NASA's announcement that the mission was over on February 13, 2019; THE narrative SHALL NOT present the line 'my battery is low and it's getting dark' as a literal message sent by Opportunity, and WHERE that line is used it SHALL be labelled as a poetic paraphrase of the rover's last data written by a journalist; THE narrative SHALL NOT state that Opportunity currently holds the off-Earth driving record.
10. THE First_Person_Narrative for InSight SHALL include Story_Chapters covering: (1) the landing at Elysium Planitia on November 26, 2018 and the first seismometer ever placed on the surface of Mars, which recorded its first likely marsquake on April 6, 2019 (the 128th Martian day); (2) the heat probe known as the Mole, designed to burrow about 5 metres into Mars, which after nearly two years of attempts was abandoned in January 2021 because the clumpy soil gave it too little friction; (3) more than 1,300 marsquakes, including a magnitude 5 quake in May 2022 whose vibrations lasted at least six hours, and what the data revealed about Mars's interior layers and liquid core; (4) dust building up on the solar panels, falling power, the last communication with Earth on December 15, 2022, and NASA retiring the mission on December 21, 2022; and (5) the legacy — the data is archived for researchers worldwide, and in 2024 NASA's Mars Reconnaissance Orbiter imaged the retired lander to study how dust moves on Mars.
11. THE First_Person_Narrative for Surveyor 3 SHALL include Story_Chapters covering: (1) the landing on April 20, 1967 (UTC) in the southeastern part of Oceanus Procellarum, in a crater about 200 metres wide later named Surveyor crater — highly reflective rocks confused the descent radar, the engine did not shut off at the right moment, and the lander bounced twice before settling on its third touchdown, as the second Surveyor to soft-land on the Moon; (2) the surface sampling tests — the scoop arm, which could reach about 1.5 metres from the lander and dig about 18 centimetres deep, dug four trenches and performed four bearing tests and thirteen impact tests, from which scientists concluded that the lunar soil had a consistency similar to wet sand and was solid enough to support an Apollo lunar module; (3) the long wait — Surveyor 3 sent 6,326 television pictures, NASA's last contact was on May 4, 1967, two days after the lunar night began, and the spacecraft then sat on the Moon for about 31 months; (4) the Apollo 12 pinpoint landing about 180 metres (roughly 600 feet) from Surveyor 3 and the visit by Pete Conrad and Alan Bean on November 19–20, 1969, when they became the first humans to touch a spacecraft that had landed on another world and recovered its television camera, soil scoop and other parts for study; (5) the bacteria story — researchers reported Streptococcus mitis in foam inside the returned camera, but later analysis suggests it was most likely contamination from Earth, a lesson in keeping samples clean; and (6) a closing chapter on the rest of Surveyor 3 remaining in its crater since 1967, as seen by NASA's Lunar Reconnaissance Orbiter, and its legacy as a robot that helped prepare for human landings. THE narrative SHALL NOT include invented dialogue attributed to Conrad, Bean or any other real person.
12. WHILE a Story_Chapter is visible, THE site SHALL display a key science discovery callout for that chapter, sourced from NASA official documentation, accompanied by a Source_Citation hyperlink to a URL on the nasa.gov domain.
13. WHEN the user scrolls past the final Story_Chapter, THE site SHALL display an end-of-story summary showing the mission name, hardware name, mission dates, final operational status, and a "Return to Space" action.
14. WHEN the user activates "Return to Space", THE Space_Scene SHALL release the sticky canvas and execute a Fly_Animation returning the Camera to the orbital view of the current Celestial_Body.
15. THE site SHALL display a scroll progress indicator showing the user's current position within the mission narrative relative to the total number of Story_Chapters.
16. WHEN a Chapter_Image enters the viewport as the user scrolls, THE site SHALL reveal the image using a fade-in animation of no more than 400 milliseconds, appearing after the chapter's narrative paragraph text.
17. EACH Chapter_Image SHALL include a descriptive caption of no more than 120 characters stating what the image shows and its NASA source credit (e.g., "Buzz Aldrin's bootprint on the lunar surface. Credit: NASA Apollo 11").
18. ALL Chapter_Images SHALL be sourced exclusively from the NASA Image and Video Library (images.nasa.gov) or other NASA public domain collections, and SHALL NOT reproduce any third-party copyrighted material.
19. THE site SHALL display a persistent 'Return to Space' home button fixed at the bottom-right corner of the viewport at all times while a mission story is active — both during individual mission exploration (Mode 1) and outside of Full_Journey_Mode — rendered as borderless text with no background or border, so that the user can return to the opening Space_Scene at any point during a story without scrolling to the end; WHEN the user hovers over or focuses this button, THE site SHALL scale the button text up by 120% using a CSS transition of no more than 200 milliseconds and play a UI_Sound_Effect; WHEN the user activates this persistent button, THE site SHALL immediately stop the current story, unload the Hardware_Model, crossfade the Ambient_Track back to the Space_Scene Ambient_Track over 2 seconds, and execute a Fly_Animation returning the Camera to the opening Space_Scene view showing both Celestial_Bodies.

---

### Requirement 7: Optional Mission Quiz

**User Story:** As a curious user who has read a mission story, I want to answer a short quiz about the mission, so that I can test what I learned.

#### Acceptance Criteria

1. WHERE the Mission_Quiz feature is enabled, THE end-of-story summary defined in Requirement 6 criterion 13 SHALL display a 'Test what you learned' button positioned below the mission recap and above the 'Return to Space' action, rendered as borderless Heading_Font text consistent with the other site buttons, and the quiz SHALL remain optional so that the user can skip it without any effect on progress.
2. WHERE the Mission_Quiz feature is enabled, WHEN the user activates the quiz for a mission, THE site SHALL present exactly three multiple-choice questions about that mission, each with exactly four answer choices.
3. WHERE the Mission_Quiz feature is enabled, WHEN the user submits an answer, THE site SHALL indicate whether the answer is correct or incorrect within 1 second, displaying a visual correct or incorrect indicator alongside a brief text explanation of the correct answer.
4. WHERE the Mission_Quiz feature is enabled, WHEN the user completes all three questions, THE site SHALL display the user's score as a number out of three and a non-empty congratulatory or motivational message regardless of score.
5. WHERE the Mission_Quiz feature is enabled, THE quiz questions and answers for each mission SHALL be factually accurate and verifiable against the Source_Citations for that mission.
6. WHERE the Mission_Quiz feature is enabled, WHEN the user completes a quiz and activates the 'Test what you learned' button again for the same mission, THE site SHALL reset the quiz and present the three questions in a randomized order, with the four answer choices for each question also randomized, and no answers pre-selected.
7. WHERE the Mission_Quiz feature is enabled, WHEN the user activates the 'Test what you learned' button, THE site SHALL open the quiz as a pop-up panel positioned over the story column on the right half of the viewport, using the same semi-transparent dark background as the story column so that the Hardware_Model and Three.js canvas on the left half remain visible; THE pop-up SHALL display a close icon (an 'X' symbol) in its top-right corner as the control for dismissing it, rendered in `#FFFFFF` with no background or border, with a touch and click target of at least 44 by 44 pixels, an accessible name of 'Close quiz' exposed to screen readers, and a visible focus indicator meeting Requirement 8 criterion 4; WHILE the pop-up is open, THE site SHALL move keyboard focus into the pop-up and keep it there, and SHALL label the pop-up for screen readers as a dialog; WHEN the user activates the close icon or presses the Escape key, THE site SHALL dismiss the pop-up and return keyboard focus to the 'Test what you learned' button; WHEN the quiz is completed or dismissed, THE site SHALL return the user to the end-of-story summary without altering the user's position in the mission story.

---

### Requirement 8: Performance and Accessibility

**User Story:** As a student using a standard school laptop, I want the site to load and run smoothly, so that slow hardware does not prevent me from experiencing the content.

#### Acceptance Criteria

1. THE Space_Scene SHALL complete initial load within 10 seconds on a connection of at least 10 Mbps, measured from navigation start until the opening 3D scene is fully rendered and all Mission_Markers are visible and interactive.
2. WHILE the user is performing navigation actions (orbiting, zooming, or clicking Mission_Markers), THE Space_Scene SHALL maintain a frame rate of at least 30 fps on a device with integrated graphics equivalent to Intel UHD 620 or better and 4 GB RAM.
3. THE Story_Panel SHALL use a minimum font size of 16 pixels and a color contrast ratio of at least 4.5:1 between text and background to meet WCAG 2.1 Level AA for the text content.
4. WHEN an interactive element (Mission_Marker, button, or navigation control) receives keyboard focus, THE site SHALL display a focus indicator with a contrast ratio of at least 3:1 between the focused and unfocused states to support keyboard navigation.
5. ALL Hardware_Model images and Story_Panel images SHALL include descriptive alt text or aria-label attributes.
6. THE site SHALL NOT require the user to install any browser plugins or extensions; WHERE the browser supports WebGL, THE site SHALL provide the full 3D experience, and IF the browser does not support WebGL, THEN THE site SHALL display the static fallback message described in Requirement 1 Criterion 5.

---

### Requirement 9: Science Accuracy and Attribution

**User Story:** As a teacher or parent supervising a student using the site, I want all scientific content to be accurate and sourced, so that I can trust the information being presented.

#### Acceptance Criteria

1. THE Story_Panel SHALL only state facts about each mission that are verifiable against NASA official documentation, press releases, or mission reports.
2. THE Story_Panel SHALL display at least one Source_Citation per mission, where each Source_Citation includes a descriptive label and a URL that resolves to a page on the nasa.gov domain.
3. THE Space_Scene SHALL place each Mission_Marker at coordinates within 100 km of the published landing site coordinates for that mission as recorded in NASA official mission reports, measured as great-circle distance on the Celestial_Body surface.
4. THE Hardware_Model for each mission SHALL visually represent the key structural features of the real NASA equipment — including overall shape, major component arrangement, and identifying markings — as documented in NASA official imagery or the NASA_3D_Library, such that no key feature visible in the reference imagery is absent or contradicted by the model.
5. IF a Source_Citation URL does not resolve to a page on the nasa.gov domain, THEN THE Story_Panel SHALL display the citation label alongside an inline "unavailable" indicator without hiding or removing the citation entry.
6. THE site SHALL attribute any quotation to its documented speaker and NASA source, SHALL NOT present invented dialogue as a real quotation, and SHALL present each hardware's first-person narration as the narrator's voice rather than as recorded speech or transmitted messages.
7. WHEN a figure is approximate, uncertain, or reported differently by NASA sources, THE narrative SHALL word it as approximate (for example 'about' or 'more than'), and the Source_Citation for that Story_Chapter SHALL link to the NASA page the figure was taken from.

---

### Requirement 10: Full Journey Mode

**User Story:** As a user who wants to experience all mission stories without navigating manually, I want a single button that takes me through every mission from start to finish in chronological order, so that I can enjoy the complete narrative as one unbroken journey.

#### Acceptance Criteria

1. THE Space_Scene SHALL display an 'Experience the Full Journey' button visible on the opening view, alongside or near the navigation controls for selecting individual Celestial_Bodies, rendered as borderless text with no background or border; WHEN the user hovers over or focuses this button, THE site SHALL scale the button text up by 120% using a CSS transition of no more than 200 milliseconds and play a UI_Sound_Effect; WHEN the user activates the button, THE site SHALL enter Full_Journey_Mode as described in criterion 2.
2. WHEN the user activates the "Experience the Full Journey" button, THE site SHALL enter Full_Journey_Mode and display a brief introductory title card stating the chronological span of the six missions (1967–2022) before beginning the first mission narrative.
3. WHILE in Full_Journey_Mode, THE site SHALL present all six mission narratives in chronological order: Surveyor 3 (1967), Apollo 11 (1969), Apollo 17 (1972), Viking 1 (1976), Opportunity (2004), and InSight (2018).
4. WHILE in Full_Journey_Mode, THE site SHALL use the same scroll-driven storytelling experience for each mission as defined in Requirement 6, including the sticky Three.js canvas, Story_Chapters, Chapter_Images, Scroll_Triggers, Hardware_Model animations, and science discovery callouts.
5. WHEN a mission's final Story_Chapter is scrolled past in Full_Journey_Mode, THE site SHALL display that mission's end-of-story summary containing, in this order, WHERE the Mission_Quiz feature is enabled the optional 'Test what you learned' button, and a 'Continue to Next Mission' action, both rendered as borderless Heading_Font text consistent with the other site buttons and without a 'Return to Space' action; WHEN the user activates 'Continue to Next Mission' (including after completing or dismissing the quiz), THE site SHALL transition to the next mission in the sequence by executing a Fly_Animation from the current mission site back to the Space_Scene and then forward to the next mission site, without requiring any other navigation click. On the end-of-story summary of the sixth mission (InSight), THE site SHALL label the 'Continue to Next Mission' action 'Finish the Journey' instead, since no further mission follows.
6. WHEN the automatic transition Fly_Animation between missions completes in Full_Journey_Mode, THE site SHALL display a mission transition card showing the name, hardware, and year of the next mission for no more than 3 seconds before beginning that mission's Story_Chapters.
7. WHEN the user is in Full_Journey_Mode, THE site SHALL display a persistent progress indicator showing which mission number the user is currently on out of six (e.g., "Mission 2 of 6") and the mission name.
8. WHEN the user activates the 'Finish the Journey' action on the end-of-story summary of the sixth mission (InSight) in Full_Journey_Mode, THE site SHALL execute a Fly_Animation returning the Camera to the opening Space_Scene view showing both Celestial_Bodies, crossfade the Ambient_Track to the Space_Scene Ambient_Track over 2 seconds, and display a closing summary screen over the Space_Scene showing the site title 'Silent Explorers', the span 1967–2022, and all six mission names, their hardware, and their years; the closing summary screen SHALL include an 'Explore on Your Own' action which, WHEN activated, SHALL dismiss the closing summary screen, exit Full_Journey_Mode, and return the user to the interactive Space_Scene with the Mission_Markers selectable.
9. WHILE in Full_Journey_Mode, THE site SHALL display a persistent 'Exit Journey' control fixed at the bottom-right corner of the viewport, rendered as borderless Heading_Font text with no background or border; WHEN the user hovers over or focuses this control, THE site SHALL scale its text up by 120% using a CSS transition of no more than 200 milliseconds and play a UI_Sound_Effect; WHEN the user activates this control at any time, THE site SHALL exit Full_Journey_Mode, return the Camera to the orbital view of the Celestial_Body of the mission that was active when the user exited, and crossfade the Ambient_Track to the Space_Scene Ambient_Track over 2 seconds.
10. WHEN the user exits Full_Journey_Mode, THE site SHALL preserve the user's scroll position so that re-entering Full_Journey_Mode from the Space_Scene restarts from the beginning rather than the exit point.

---

### Requirement 11: Ambient Audio and Soundtrack

**User Story:** As a user reading a mission story, I want space-themed music and sound to play in the background that matches the mood of each chapter, so that the experience feels immersive and emotionally engaging.

#### Acceptance Criteria

1. THE site SHALL play an Ambient_Track automatically when the user first interacts with the site, after an explicit user gesture (such as clicking a button or the scene) to comply with browser autoplay policies.
2. THE opening Space_Scene SHALL play a dedicated soft space ambient Ambient_Track — characterised by wide, slow-moving pads and minimal melodic content to evoke the vastness and silence of space — beginning after the initial user gesture described in criterion 1, and continuing to loop for as long as the user remains on the opening Space_Scene view without a mission selected.
3. THE site SHALL play a distinct Ambient_Track for each of the six missions that reflects the emotional tone of that mission's narrative — the Surveyor 3 track SHALL be sparse and solitary; the Apollo 11 track SHALL build from tense to triumphant; the Apollo 17 track SHALL be adventurous with a bittersweet resolution; the Viking 1 track SHALL be mysterious and wide; the Opportunity track SHALL be hopeful and fade to quiet and melancholic for the final chapter; and the InSight track SHALL be deep, resonant, and geological in character.
4. WHEN the user transitions between the opening Space_Scene and a mission site, THE site SHALL crossfade between the Space_Scene Ambient_Track and the mission-specific Ambient_Track over a duration of 2 seconds so that the audio transition is not abrupt.
5. WHEN the user scrolls to the final Story_Chapter of Opportunity (the dust storm farewell chapter), THE site SHALL transition the Ambient_Track to a quieter, lower-register variation of the Opportunity track to match the emotional tone of the ending.
6. THE site SHALL display a persistent Audio_Controller accessible from all views that allows the user to mute and unmute all audio with a single interaction.
7. THE Audio_Controller SHALL default to an unmuted state on first load, after the initial user gesture that starts audio playback.
8. WHEN the user mutes audio using the Audio_Controller, THE site SHALL immediately silence all Ambient_Tracks and SHALL NOT resume audio playback without another explicit user interaction.
9. ALL Ambient_Tracks SHALL be sourced exclusively from royalty-free, Creative Commons licensed, or NASA public domain audio collections, and SHALL NOT use any copyrighted music without a valid licence.
10. THE site SHALL preload the Ambient_Track for the next mission during the Fly_Animation transition so that the audio crossfade in criterion 4 begins without buffering delay.
11. WHILE in Full_Journey_Mode, THE site SHALL continue to apply mission-specific Ambient_Tracks as defined in criterion 3, transitioning automatically between tracks as the user moves from one mission to the next.
12. WHERE the Mission_Quiz feature is enabled, WHEN the user opens the quiz pop-up, THE site SHALL crossfade from the current mission-specific Ambient_Track to the Space_Scene Ambient_Track over 2 seconds and keep it playing while the pop-up is open; WHEN the quiz is completed or dismissed, THE site SHALL crossfade back over 2 seconds to the mission-specific Ambient_Track variation that was playing when the pop-up was opened, unless the user has meanwhile activated 'Continue to Next Mission', 'Finish the Journey', 'Return to Space' or 'Exit Journey', in which case the audio transition defined for that action SHALL apply instead; WHILE the Audio_Controller is muted, THE site SHALL keep all audio silent during these transitions.

---

### Requirement 12: Typography

**User Story:** As a young reader aged 10–17, I want the text on the site to be easy to read and feel like it belongs in a space exploration experience, so that I can enjoy the stories without strain.

#### Acceptance Criteria

1. THE site SHALL load Orbitron from Google Fonts as the Heading_Font and Exo 2 from Google Fonts as the Body_Font, both loaded via the Google Fonts CDN using a preconnect link in the HTML head for performance.
2. THE Heading_Font (Orbitron) SHALL be applied to all chapter titles, mission names, section headings, the site title, and all UI button text including "Return to Space", "Experience the Full Journey", and "Exit Journey".
3. THE Body_Font (Exo 2) SHALL be applied to all First_Person_Narrative paragraphs, science discovery callouts, Chapter_Image captions, tooltip text, quiz questions and answers, and all other body-level text.
4. THE site SHALL use a minimum font size of 18 pixels for Body_Font narrative paragraphs and science callouts to ensure comfortable reading for users aged 10–17.
5. THE site SHALL use a minimum font size of 22 pixels for Heading_Font chapter titles.
6. THE site SHALL use a minimum font size of 14 pixels for Body_Font captions and secondary labels, with no text rendered below 12 pixels anywhere on the site.
7. THE site SHALL set Body_Font line height to at least 1.6 for all narrative paragraph text to ensure adequate vertical spacing for young readers.
8. IF either Heading_Font or Body_Font fails to load from Google Fonts, THEN THE site SHALL fall back to system fonts in this order: for Heading_Font, the fallback SHALL be 'Arial', sans-serif; for Body_Font, the fallback SHALL be 'Georgia', serif.
9. ALL text rendered on the site SHALL maintain a colour contrast ratio of at least 4.5:1 between text colour and its background colour to meet WCAG 2.1 Level AA, consistent with Requirement 8 criterion 3.
10. THE story column panel SHALL use a semi-transparent dark overlay background of `rgba(10, 10, 15, 0.85)` — 85% opacity over the Three.js canvas — so that the starfield rendered behind the panel remains faintly visible through the text area, maintaining the immersive space atmosphere on both sides of the split-screen layout; the remaining 15% transparency SHALL allow star points from the Space_Scene to show through without reducing text readability below the 4.5:1 contrast ratio specified in criterion 12.
11. THE site SHALL apply the following text colours throughout: Heading_Font text (chapter titles, mission names, section headings, site title) SHALL use `#FFFFFF` (pure white); Body_Font narrative paragraph text SHALL use `#E8E8E8` (soft white, reducing eye strain on dark backgrounds); science discovery callout text SHALL use `#A8D8EA` (pale sky blue, visually distinct from body text); Chapter_Image caption text SHALL use `#B0B0B0` (light grey, subordinate to body text); and UI button text SHALL use `#FFFFFF` (pure white).
12. THE site SHALL verify that all text colour and background colour combinations specified in criterion 11 achieve a minimum contrast ratio of 4.5:1 against the `#0A0A0F` background as measured by the WCAG 2.1 contrast algorithm — `#FFFFFF` on `#0A0A0F` achieves approximately 20:1, `#E8E8E8` on `#0A0A0F` achieves approximately 17:1, `#A8D8EA` on `#0A0A0F` achieves approximately 10:1, and `#B0B0B0` on `#0A0A0F` achieves approximately 7:1, all of which exceed the 4.5:1 minimum.
---

### Requirement 13: Responsive and Mobile Experience

**User Story:** As a student using a phone or tablet, I want the whole experience to work on my device, so that I can enjoy the stories without needing a laptop.

#### Acceptance Criteria

1. THE site SHALL render all views without horizontal scrolling, clipped content or overlapping controls at viewport widths from 320 pixels to 2560 pixels, in both portrait and landscape orientations.
2. THE site SHALL function on the latest two major versions of Chrome, Firefox, Safari and Edge on desktop, and on Safari on iOS and Chrome on Android on mobile devices.
3. WHERE the viewport width is below 768 pixels, THE site SHALL stack the story layout so that the Hardware_Model is shown in the upper 40% of the viewport and the story column occupies the lower 60% at full width, using the same semi-transparent background defined in Requirement 12.
4. WHERE the viewport width is below 768 pixels, THE quiz pop-up SHALL open as a full-width panel covering the story column area, SHALL retain the close icon, dialog behaviour and focus handling defined in Requirement 7 criterion 7, and SHALL be scrollable if its content is taller than the panel.
5. WHERE the device has no hover capability, THE site SHALL apply the 120% text scale-up and the UI_Sound_Effect to text buttons when the user presses them instead of on hover, and SHALL display each Mission_Marker's mission name as a visible label near the marker instead of relying on a hover tooltip.
6. THE site SHALL make every interactive element, including Mission_Markers, text buttons, the Audio_Controller and the quiz close icon, a touch target of at least 44 by 44 CSS pixels.
7. WHILE the user touches and drags within the story column, THE site SHALL scroll the story column and SHALL NOT rotate the Hardware_Model; WHILE the user touches and drags within the 3D area, THE site SHALL rotate the Hardware_Model or camera and SHALL NOT scroll the page.
8. THE fixed bottom-right 'Return to Space' and 'Exit Journey' controls SHALL remain fully visible and tappable on mobile devices, not hidden by browser toolbars or device safe areas such as the iPhone home indicator, by using dynamic viewport units and safe-area insets.
9. THE site SHALL maintain at least 30 frames per second during navigation on a mid-range phone with 4 GB of RAM; WHEN the measured frame rate stays below 30 frames per second for more than 3 consecutive seconds, THE site SHALL automatically reduce rendering quality, first by lowering the pixel ratio and then by reducing the number of stars, until the frame rate recovers; and THE site SHALL use Surface_Textures no wider than 2048 pixels and Hardware_Model files no larger than 5 MB each.

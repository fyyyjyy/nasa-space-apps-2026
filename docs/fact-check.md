# Fact-check report (task 31.1)

Scope: `src/data/missions.json` (6 missions: chapters, callouts, finalStatus, description, tooltip, dates, image alt/caption) and `src/data/quizzes.json` (questions, answers, explanations). Read-only review. No data files were edited.

Verdict key: **verified** = a NASA page states it; **paraphrase ok** = wording differs but meaning matches NASA; **unverified** = I could not find a NASA statement; **wrong** = contradicts NASA.

Method: I fetched the cited pages where they loaded, plus other nasa.gov, jpl.nasa.gov, science.nasa.gov, curator.jsc.nasa.gov, ntrs.nasa.gov and images-api.nasa.gov pages. Those are listed in the Source column.

Pages I could not read:
- `nssdc.gsfc.nasa.gov` (LRV and Apollo 17 info pages) timed out. I used NASA search snippets of those pages instead and say so where it matters.
- `hq.nasa.gov/pao/History/SP-4205/app-e.html` (Chariots for Apollo, Appendix E) returned 403 or 404. It is the cited source for the Apollo 11 sample claims.
- The NTRS PDF `Moon debris mission.pdf` is a PDF, which my fetcher cannot read. I used its search snippet and the NTRS record page.

All the PIA/AS image IDs below were checked against `images-api.nasa.gov`, except those marked "not checked".

---

## Headline findings

| # | Item | Verdict | Short answer |
|---|---|---|---|
| 1 | Apollo 11 "about 17 seconds of fuel" (and chapter title "Seventeen Seconds") | **unverified, likely wrong** | No NASA page says 17 s. NASA says "only seconds" (SP-350). Houston called "60 seconds" then "30 seconds" (ALSJ). ALSJ post-flight analysis gives about 45 s of usable fuel, including 20 s for an abort. Reword. |
| 2 | Apollo 11 sample mass "21.6 kg" | **wrong by rounding** | NASA gives 21.55 / 21.5 kg (47.5 lb), "47 lbs" (NASA Science), and 20 kg / 44 lb (ALSJ overview). "21.6" matches none of them. 21.6 is the surface-stay hours figure. Use "about 21.5 kg". |
| 3 | Apollo 17 rover 35.9 km vs 30.5 km | **both are NASA figures** | NSSDC: 35.9 km in 4 h 26 min. Apollo 17 Mission Details: 30.5 km. JPL and NASA Science (2013 record story): 35.744 km (22.210 mi). Use "about 36 km". |
| 4 | Apollo 17 "Cernan last person on the Moon" | **verified, but the callout cites the wrong page** | NASA Cernan biography says he was the last human to leave footprints on the Moon. The cited Mission Details page only says "last lunar landing mission". |
| 5 | Apollo 17 "rover still parked" | **paraphrase ok, uncited** | NASA describes the "parked" LRV during the mission, and the rover was left behind. I found no nasa.gov line that says it is there today. Optionally add a citation (LRO Apollo 17 lithograph). |
| 6 | Viking 2 end date April 11 vs 12, 1980 | **NASA disagrees with itself** | `science.nasa.gov/mission/viking-2/`: April 12. NASA Astrobiology Viking page and the NSSDC/MOLA page: April 11 (last data). Text says "April 1980". That is safe. Keep. |
| 7 | Viking 1 as "only working spacecraft ... two and a half years" | **inference, sound** | April 1980 to Nov 1982 is about 2 years 7 months. No NASA page states "only working spacecraft". It is arithmetic plus the fact that no other surface mission was operating. Say "more than two and a half years" or "for the next two and a half years" (current wording is fine). |
| 8 | Viking 1 "scientists still talk about what my results mean" | **paraphrase ok, weak** | NASA Astrobiology says the results are "helping to shape" life-detection strategy. "Still debate" is true in the wider press but not on a NASA page. |
| 9 | InSight retired Dec 21, 2022 | **verified (date from NASA release day)** | NASA's Dec 21, 2022 retirement release. NASA's mission page lists "End of Mission: Dec. 15, 2022" (last contact). Both dates are used correctly in `finalStatus`. |
| 10 | InSight core radius ~1,800 km | **verified** | NASA Science highlights: about 1,120 miles (about 1,800 km). |
| 11 | InSight "NASA planned to stop listening at the end of 2024" | **verified** | NASA MRO release (Oct 2024) says NASA "will stop listening ... at the end of this year". |
| 12 | Opportunity "March 2004" blueberries announcement | **verified, citation missing** | NASA/JPL release "Opportunity Rover Finds Strong Evidence Meridiani Planum Was Wet", March 2, 2004. The hematite-in-blueberries result came about a week later. The cited pages do not carry a date. |
| 13 | Opportunity ch3 "Perseverance passed it on October 11, 2026" | **verified (wording matches)** | NASA mission page and MER page both say "Oct. 11, 2026". The MER page says Perseverance reached 28.10 mi (45.22 km) "and counting". |
| 14 | Surveyor 3 "about 31 months" | **verified** | NASA History, Apollo 12: Journey Home: "31 months". Surveyor mission page says "nearly two-and-a-half years". Both fit. |
| 15 | "Apollo 12 Nov 19-20" | **consistent** | NASA image archive dates the second EVA photos 20 Nov 1969 (UT). LRO and Footpads pages give landing as Nov 19. NASA's Surveyor 3 mission page says Nov 18 landing and Nov 19 EVA 2. That is a different day convention (probably US time zones). Chapter text only says "November 1969". The caption "Nov. 20, 1969" matches the image archive. |
| 16 | AS12-48-7134 caption (Bean vs Conrad) | **caption is safe** | NASA's title says "Astronaut Alan L. Bean ... and two U.S. spacecraft". NASA's description says "Conrad examines the Surveyor's TV camera". NASA contradicts itself. Our caption says "An Apollo 12 astronaut", which is correct either way. Keep. |
| 17 | Opportunity landing coordinates | **unverified for the marker** | NASA gives Eagle Crater as 1.9483° S, 354.47417° E (= -1.9483, -5.5258). Data uses -2.3, -5.5 labelled Perseverance Valley. No NASA number found for Perseverance Valley. |
| 18 | InSight landing coordinates | **verified (published value), source note outdated** | Published landing fix is 4.502° N, 135.623° E (Golombek et al., LPSC and AGU, 2019; NASA-funded, not hosted on nasa.gov). NASA pages give only the targeted region centre, 4.5° N, 135.9° E. Data 4.5, 135.62 matches the published fix. |
| 19 | Surveyor 3 ch5 "probably hitched a ride before I ever left" | **unverified** | NASA (Ames/NTRS) slides support "reported in foam deep inside the camera" and "most likely contamination". The cited NASA source does not (as far as I could read it) say the bacteria were on the camera before launch. Other sources argue for contamination during handling after return. Soften. |

---

## Surveyor 3

Main sources:
- S3 = https://science.nasa.gov/mission/surveyor-3/
- FP = https://science.nasa.gov/solar-system/moon/footpads-and-footprints-humans-and-machine-meet-on-the-moon
- LRO = https://www.nasa.gov/missions/lunar-reconnaissance-orbiter-looks-at-apollo-12-surveyor-3-landing-sites/
- A12 = https://www.nasa.gov/history/50-years-ago-apollo-12-the-journey-home/
- NTRS = https://ntrs.nasa.gov/citations/20205003575
- IMG = images-api.nasa.gov (item ID)

| Claim | Where | Verdict | NASA source | Note |
|---|---|---|---|---|
| Launched Apr 17, last contact May 4, 1967 | dates, finalStatus | verified | S3 | |
| Landed in the Ocean of Storms, SE Oceanus Procellarum | ch1, locationName | verified | S3, FP | |
| Radar confused by shiny rocks, engine did not cut off at the right moment | ch1, callout, q1 | verified | S3 | |
| Bounced twice, third touchdown stayed | ch1, description, q1 | verified | S3 | |
| Bounce heights about 10 m, then about 3 m | ch1 callout | verified | S3 | S3 says 33 ft (10 m), then 10 ft (3 m). |
| Landing date "April 20, 1967" | ch1 | verified | S3, FP, LRO | NASA image captions say April 19. The date depends on UT vs US time. 20 April is the NASA Science/LRO convention. Fine. |
| Crater "about 200 meters wide", named Surveyor crater | ch1 | verified | FP, LRO | FP says about 650 ft (200 m). |
| "Second Surveyor to soft-land" | ch1 | verified | S3 | |
| Arm reaches about 1.5 m, digs about 18 cm | ch2 | verified | S3 | |
| Four trenches, four bearing tests, thirteen impact tests | ch2, callout, q2 | verified | S3 | |
| Soil like wet sand, strong enough for an Apollo LM | ch2, callout, q2 | verified | S3, FP | |
| Bearing strength about 10 psi | ch2 callout | verified | S3 | |
| "First trenches in lunar soil" | description | paraphrase ok | S3 | S3 says it was the first Surveyor to carry a sampling instrument. |
| 6,326 TV pictures | ch3, callout, q3 | verified | S3 | |
| First pictures began arriving less than an hour after landing | ch3 | verified | S3 | |
| Last contact May 4, two days after lunar night began | ch3, callout, q3 | verified | S3, FP | NASA FP says "two Earth days". |
| Solar powered, went silent in the dark | ch3, q3 | verified | FP | |
| Stayed "about 31 months" | ch3, ch4 callout | verified | A12 | |
| Apollo 12 landed about 180 m (roughly 600 ft) away | ch4 | paraphrase ok | S3 (197 yd, 180 m), LRO and FP (170 yd, 155 m), image captions (600 ft) | NASA is inconsistent: 155 to 183 m. "About 600 feet" is the most-cited. Fine as written. |
| Conrad and Bean walked to it | ch4 | verified | FP | |
| "First humans to touch a spacecraft that had landed on another world" | ch4 | paraphrase ok | FP | FP: "first and only time" a human and a machine met on another world. |
| They took the TV camera, scoop, other parts | ch4, callout | verified | FP, S3, A12 | |
| Second Apollo 12 moonwalk | ch4 callout | verified | A12, IMG | |
| S. mitis reported in foam deep inside the camera | ch5, callout | verified | NTRS (snippet: "foam insulation embedded deeply within Surveyor 3 camera body") | |
| Later analysis suggests contamination from Earth | ch5, callout | paraphrase ok | NTRS/Ames slides ("survivor or contamination?"), NASA Rummel talk | |
| "Probably hitched a ride before I ever left" | ch5 | unverified | not found | See recommendation 3. |
| LRO imaged Apollo 12 lander, footpaths, Surveyor 3 | ch6, callout | verified | LRO, FP | |
| "I am still keeping watch" | ch6 | paraphrase ok | FP ("still carrying out its long, silent vigil") | |
| Image AS12-48-7121 caption/alt (Surveyor in crater, Apollo 12, 1969) | ch1 image | verified | IMG as12-48-7121 | |
| AS12-48-7110 (footpad, scoop, bounce imprint) | ch2 image | verified | IMG as12-48-7110 | |
| AS12-48-7099 ("600 feet apart") | ch3 image | verified | IMG as12-48-7099 | |
| AS12-48-7133 ("Pete Conrad beside Surveyor 3 ... Nov. 20, 1969") | ch4 image | paraphrase ok | IMG AS12-48-7133 | NASA text says Conrad examining the camera. Date 20 Nov 1969 matches. |
| AS12-48-7134 (generic "an Apollo 12 astronaut") | ch5 image | verified | IMG AS12-48-7134 | See item 16. |
| PIA12922 caption | ch6 image | not checked | | |
| Landing 3°S, 23.41°W | referenceLanding | verified | S3 | |
| Quiz q1, q2, q3 and explanations | quizzes | verified | S3 | Same claims as above. |

---

## Apollo 11

Main sources:
- ALSJ = https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11ov.html
- ALSJ-L = https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11.landing.html
- SP350 = https://www.nasa.gov/wp-content/uploads/static/history/SP-350/ch-11-4.html
- 50Y = https://www.nasa.gov/history/50-years-ago-one-small-step-one-giant-leap/
- WIDE = https://www.nasa.gov/missions/apollo/apollo-11/wide-awake-on-the-sea-of-tranquillity/
- LRRR = https://www.nasa.gov/missions/apollo/apollo-11/the-apollo-experiment-that-keeps-on-giving/

| Claim | Where | Verdict | NASA source | Note |
|---|---|---|---|---|
| Dates July 16–24, 1969 | dates | verified | ALSJ | |
| Landing July 20, 1969 | ch1 | verified | ALSJ, 50Y | |
| 1202 and 1201 alarms, computer overloaded, Houston said go | ch1, callout, q1 | verified | SP350, 50Y | |
| Armstrong saw a boulder field, took manual control, flew past a crater and rocks | ch1, q1 | verified | SP350 (Armstrong: "football-field-sized crater ... flying manually over the rock field"), WIDE, 50Y | |
| **"Mission Control thought I had about 17 seconds of fuel left"** | ch1 | **unverified, likely wrong** | SP350: "only seconds of fuel remaining". SP350 transcript: Houston "30 seconds". ALSJ-L: Houston "60 seconds" then 30. 50Y: at about 100 ft, 5% fuel, about 90 s of hover. ALSJ-L: landed with about 45 s of usable fuel (about 20 s of it abort reserve). | No NASA page gives 17 s. Do not use. Recommendation 1. |
| Chapter title "Seventeen Seconds" | ch1 title | unverified | same | Rename with the text fix. |
| "Only seconds of fuel remaining" | ch1 callout | verified | SP350 | Keep. |
| "Houston, Tranquility Base here. The Eagle has landed." (Armstrong) | ch1 | verified | SP350, WIDE | |
| Hours after landing, Armstrong climbed down | ch2 | verified | WIDE (about 3 hours to the okay), 50Y (step at 9:56 pm vs landing 3:17 pm Houston time, about 6.6 h) | "Hours after" is correct. |
| First person on the Moon; Aldrin followed | ch2 | verified | WIDE, 50Y | |
| "Magnificent desolation" attributed to Aldrin | ch2 | verified | WIDE | |
| Black sky, bright ground | ch2 | verified | WIDE | |
| About two and a half hours outside (one EVA) | ch2, callout | verified | ALSJ (2 h 31 min), WIDE | |
| Surface stay 21.6 hours | ch2, callout, q2 | verified | ALSJ | |
| Ascent stage left, descent stage stayed | ch2, q2 | verified | ALSJ, 50Y | |
| **"About 21.6 kilograms" of samples** | ch3 | **wrong (rounding)** | NASA ARES NTRS 20090011852: 21.5 kg; Lunar Sample Compendium 21.55 kg; WIDE: 47 lb (21.3 kg); ALSJ: 20 kg (44 lb) | Use "about 21.5 kg". Recommendation 2. |
| "More than 21 kilograms" | ch3 callout | verified | same | Fine. |
| First samples from another world | ch3 | verified | WIDE, 50Y | |
| Basalts 3 to 4 billion years old | ch3, callout | verified | NASA SP-4214 ch.11-4 ("between 3 and 4 billion years old"); 3.6–3.9 Gyr in NTRS | Cited source is Appendix E. I could not open it. SP-4214 is already in the mission citations. Swap the callout to that. |
| Samples helped scientists develop the giant impact theory | ch3 | paraphrase ok | NASA curator.jsc.nasa.gov/lunar/ (Moon's chemistry compatible with a glancing impact of a Mars-sized body); NTRS Ahrens | Not cited in the data. Consider adding. "Support" is safer than "develop". |
| Passive seismic experiment left behind | ch4 | verified | WIDE, 50Y, image IMG | |
| Laser reflector: 100 quartz glass prisms, no power | ch4, callout, q3 | verified | LRRR | |
| Moon moves away about 3.8 cm (1.5 in) a year | ch4, callout, q3 | verified | LRRR | |
| Scientists still aim lasers at it | ch4 | verified | LRRR | |
| as11-37-5458 (view from LM window) | ch1 image | not checked | | |
| as11-40-5903 (Aldrin near the leg) | ch2 image | verified | IMG | |
| S69-40749 (Lunar Receiving Lab, bulk sample sieve) | ch3 image | verified | IMG | |
| as11-40-5948 (EASEP deployed) | ch4 image | verified | IMG | |
| Landing 0.6734° N, 23.473° E | referenceLanding | verified | ILRS page (in data); ALSJ gives 0.67409, 23.47298 | Difference is under 0.001°. |
| Quizzes q1, q2, q3 | quizzes | verified | as above | q2 explanation "about 21.6 hours" is correct (hours, not kg). |

---

## Apollo 17

Main sources:
- MD = https://www.nasa.gov/missions/apollo/apollo-17-mission-details/
- HOME = https://www.nasa.gov/history/50-years-ago-apollo-17-heads-home-to-earth/
- LRV = https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html (page timed out; search snippet read)
- JPL13 = https://www.jpl.nasa.gov/news/nine-year-old-mars-rover-passes-40-year-old-record/
- OPP = https://science.nasa.gov/mission/mer-opportunity/
- ORANGE = https://curator.jsc.nasa.gov/education/diskdetails.cfm?class=Orange%20Soil&disk=45 (timed out; read other "Orange Soil" disk pages with the same text)
- CERNAN = https://www.nasa.gov/former-astronaut-eugene-a-cernan/

| Claim | Where | Verdict | NASA source | Note |
|---|---|---|---|---|
| Dates Dec 7–19, 1972 | dates | verified | MD | |
| Challenger landed Dec 11, 1972; lifted off Dec 14 | ch1, ch4, callout, q1 | verified | MD, HOME | |
| Last crewed landing / last lunar landing mission | ch1, description, ch4 callout | verified | MD | |
| Site picked for rocks older and younger than earlier samples | ch1, callout, q1 | verified | MD | |
| Cernan and Schmitt drove the rover | ch1 | verified | MD | |
| Three trips | ch2 | verified | MD (three EVAs), image IMG | |
| About 35.9 km, 4 h 26 min of driving | ch2, callout | verified (NSSDC snippet) | LRV | Other NASA totals: MD 30.5 km; JPL13 and OPP 35.744 km. The callout already says "slightly different totals". Recommendation 4. |
| "Greatest distance driven by any crewed vehicle on the Moon" | ch2, callout | paraphrase ok | OPP and JPL13 (record for any NASA vehicle on another body until Opportunity in 2013) | NASA does not use this exact phrase. The narrative says "NASA says". Reword slightly. |
| Battery powered, no engine noise | ch2 | verified | MD ("battery-powered") | "No engine noise" is a fair inference. |
| Orange soil seen on second moonwalk near Shorty Crater by Schmitt | ch3, q2 | verified | IMG as17-137-20990 (Station 4, Shorty Crater, EVA 2, "Schmitt ... first spotted") | |
| Schmitt a geologist | ch3 | verified | HOME ("first trained geologist") | |
| Tiny glass beads, formed about 3.5 billion years ago from lava sprays | ch3, callout, q2 | verified | ORANGE (curator pages) | NASA APOD gives 3.64 billion. "About 3.5" is the curator figure. |
| "Volcanic ash rather than a soil" | ch3, callout, q2 | verified | curator disk page | |
| About 110 kg (110.4 kg, 243 lb) of samples | ch4, callout, q3 | verified | MD | |
| "A record Apollo haul" | ch4, q3 | paraphrase ok | NTRS 20090011852: Apollo 17 total 110.5 kg; I did not fetch the other missions' totals | Largest of the six landings by my own recollection, not by a page I fetched. Low risk. |
| **Cernan "the last person to have walked on the Moon"** | ch4, callout | **verified, citation mismatch** | CERNAN ("last human to leave his footprints on the lunar surface"); LRO Apollo 17 lithograph (Cernan and Schmitt "the last people to set foot on the Moon (for now)") | The callout cites MD, which does not say it. Recommendation 5. |
| **Rover "still" parked in Taurus-Littrow Valley** | ch4, finalStatus, description | paraphrase ok | NASA historian page calls it the "parked Lunar Roving Vehicle"; HOME says Challenger crashed, rover camera filmed liftoff | I found no nasa.gov page that states the rover is still there today. True and uncontroversial. Optionally cite the LRO Apollo 17 lithograph. |
| as17-134-20435 (wide view, caption "December 1972") | ch1 image | not checked | | |
| as17-134-20454 (Schmitt on LRV, Dec 13, 1972) | ch2 image | verified | IMG | |
| as17-137-20990 (orange soil) | ch3 image | verified | IMG | |
| S72-55421 (liftoff, Dec 14, 1972) | ch4 image | verified | IMG | |
| Landing 20.19° N, 30.77° E | referenceLanding | verified | LROC (ASU) 20.1911, 30.7723; MD says 20.16 N, 30.77 E (20°10′ N, 30°46′ E) | NSSDC page timed out, so I used LROC. The values differ by under 0.03° (about 1 km). |
| Quizzes q1, q2, q3 | quizzes | verified | MD, ORANGE | |

---

## Viking 1

Main sources:
- V1 = https://science.nasa.gov/mission/viking-1/
- V2 = https://science.nasa.gov/mission/viking-2/
- VP = https://science.nasa.gov/astrobiology/missions/viking-project/
- FIRST = https://science.nasa.gov/photojournal/first-photograph-taken-on-mars-surface/
- COLOR = https://science.nasa.gov/resource/first-color-image-from-viking-lander-1/
- FROST = https://science.nasa.gov/photojournal/frost-on-utopia-planitia/
- MODEL = https://science.nasa.gov/resource/viking-lander-model/

| Claim | Where | Verdict | NASA source | Note |
|---|---|---|---|---|
| Looks like a larger Surveyor lander | ch1 | verified | V1 | |
| Landed July 20, 1976 | ch1, callout, q1 | verified | V1 | |
| First site was rougher than expected; new site on western slopes of Chryse Planitia | ch1 | verified | V1 | |
| About 28 km (17 mi) from the new target | ch1, callout, q1 | verified | V1 | |
| Mars 3 touched down 1971, lost contact within seconds | ch1, callout, q1 | verified | V1 | V1 says "Soviet", the data does too. |
| NASA's first truly successful landing on Mars | ch1, callout, q1 | verified | V1 | |
| First photograph from the Mars surface, within minutes; about 1.4 m from the camera | ch2 | verified | FIRST | |
| Sharper pictures in three colors; 300-degree panorama; gently rolling plains | ch2 | verified | V1 | |
| First color image July 21; orange-red ground; reddish sky from reddish dust | ch2, callout, q2 | verified | COLOR | "Reddish sediment suspended in the lower atmosphere" is paraphrased as "reddish dust". Fine. |
| July 28, 1976 arm scooped soil into the biology lab | ch3, q3 | verified | V1 | |
| Four samples could be read as a weak positive | ch3, callout, q3 | verified | V1 | |
| Organic compounds test negative | ch3, callout, q3 | verified | V1 | |
| "No definitive evidence of living microorganisms" | ch3 | verified | VP | VP is not in the mission's citation list. Add it. |
| "Scientists still talk about what my results mean" | ch3 | paraphrase ok, weak | VP ("results are helping to shape" life-detection strategy) | Recommendation 8. |
| Planned for about 90 days | ch4 | verified | MODEL ("planned to continue for 90 days after landing") | MODEL is already cited. |
| Worked more than six years | ch4, description | verified | V1 (July 1976 to Nov 1982); OPP page: record "6 years and 116 days" | |
| Weather reports daily, then weekly | ch4 | verified | V1 | |
| Minus 86 °C before dawn; about minus 33 °C in the afternoon | ch4, callout | verified | V1 | |
| Renamed Thomas Mutch Memorial Station in January 1982; Mutch led the imaging team | ch4, callout | verified | V1 | |
| Nov 11, 1982, faulty command interrupted communications | ch4, finalStatus, dates | verified | V1 | VP gives "end of mission" Nov 13, 1982, and OPP's 6 years 116 days works out to Nov 13. NASA uses both. The text correctly describes the Nov 11 event. |
| Viking 2 landed Sept 3, 1976 at Utopia Planitia | ch5, callout | verified | V2 | |
| About 6,460 km from Viking 1 | callout | verified | V2 | |
| First clear frost seen by a lander, 1977 | ch5 | verified | FROST (Sept 13, 1977) | |
| Viking 2 ended communications in April 1980 | ch5, callout | verified | V2 (April 12), VP (April 11 last data) | Keep "April 1980". |
| After that, only working spacecraft on the surface, for two and a half years | ch5 | paraphrase ok (inference) | derived: April 1980 to Nov 1982 | See item 7. |
| PIA09703 (model of Viking lander) | ch1 image | not checked | | |
| PIA00563, PIA00395, PIA00392 | ch2–4 images | not checked | | |
| PIA00573 ("Frost at the Viking Lander 2 site") | ch5 image | not checked | | NASA's frost photo is PIA00530 (Sept 13, 1977). PIA00573 may be a different frost frame. Check that its caption and alt still match. |
| Landing 22.483° N, 47.94° W | referenceLanding | verified | V1 | |
| Quizzes q1, q2, q3 | quizzes | verified | V1, COLOR | |

---

## Opportunity

Main sources:
- OPP = https://science.nasa.gov/mission/mer-opportunity/
- MER = https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/
- END = https://science.nasa.gov/missions/mars-exploration-rovers/nasas-opportunity-rover-mission-on-mars-comes-to-end/
- MER-P = https://science.nasa.gov/resource/meridiani-planum-2/
- BB = https://astrobiology.nasa.gov/news/check-type-iron-blueberries/
- MAR04 = https://www.jpl.nasa.gov/news/opportunity-rover-finds-strong-evidence-meridiani-planum-was-wet

| Claim | Where | Verdict | NASA source | Note |
|---|---|---|---|---|
| About the size of a golf cart | ch1 | verified | OPP | |
| Landed Jan 24, 2004 (Pacific time) | ch1, callout | verified | OPP, END | OPP says Jan 24 PST, Jan 25 UTC. PIA21494 says "PDT" (NASA typo; January is PST). The data's "Pacific time" is right. |
| Bounced at least 26 times; stopped in Eagle crater | ch1 | verified | OPP | |
| Meridiani Planum picked because mineral deposits hinted at water | ch1, callout | verified | MER, MER-P | |
| Designed for 90 sols, about three Earth months | ch1, callout | verified | OPP | |
| Spirit landed 20 days earlier, other side of the planet | ch1 | verified | OPP, END | |
| BB-sized gray spheres nicknamed blueberries | ch2, callout, q1 | verified | MER-P, BB | |
| Hematite found by an instrument (Mössbauer) | ch2, q1 | verified | BB, MER-P | |
| Hematite is an iron mineral that often forms in water | ch2, q1 | verified | MER-P | |
| **"In March 2004, the science team shared that my rocks showed Meridiani had been wet"** | ch2 | verified, not cited | MAR04 (March 2, 2004) | Add MAR04 to the citations. The hematite-in-blueberries finding was announced about a week later (BB). |
| Spirit and Opportunity together confirmed long-standing water | ch2, callout, q1 | verified | MER | |
| Kept rolling more than 14 years; about 60 times longer than planned | ch3, description, q2 | verified | OPP, END | OPP says "almost 15 years". "More than 14" is correct. |
| 2013: NASA announced it passed the Apollo 17 rover record | ch3 | verified | OPP (May 16, 2013; 35.744 km) | |
| 2015: first to drive a marathon, 42.195 km | ch3 | verified | OPP (Mar 25, 2015) | |
| Drove 45.16 km (28.06 mi) | ch3, callout, q2 | verified | OPP, MER | |
| Ended in Perseverance Valley on the rim of Endeavour Crater | ch3 | verified | OPP, END, NASA map pages | |
| Distance stood as the record until Perseverance passed it on Oct 11, 2026 | ch3, callout | verified | OPP, MER (both say "Oct. 11, 2026") | Re-check wording just before submission. MER says "28.10 miles ... and counting". |
| June 2018 Mars-wide dust storm; last signal June 10, 2018 | ch4, callout, q3 | verified | END, OPP | |
| More than a thousand commands sent | ch4, callout, q3 | verified | END | |
| Mission declared over Feb 13, 2019 | ch4, finalStatus, dates, q3 | verified | OPP, END | |
| Heading down into Perseverance Valley at the end | ch4 | verified | JPL map caption (PIA23178 text) | |
| Jacob Margolis wrote "My battery is low and it's getting dark." and said it was a paraphrase | ch4 | not NASA, attribution plausible | not found on a NASA page | This is a widely reported 2019 journalist line, and the chapter says it is not NASA's. I did not fetch a source. Keep, but cite a non-NASA source in docs if challenged. |
| PIA21494 (Eagle Crater from orbit, 2017) | ch1 image | verified | IMG | NASA's own alt text says "2015" while the body says 2017 (NASA typo). Our caption says 2017. Fine. |
| PIA05273 (blueberry spheres, 2004) | ch2 image | verified | IMG | |
| PIA19158 (marathon infographic) | ch3 image | verified | IMG date Mar 24, 2015; the local image shows "Opportunity's Marathon Journey" with a path from Eagle Crater to Endeavour Crater | NASA's catalog text for PIA19158 describes a different map. The image file itself matches our alt text. |
| PIA23178 (final traverse map) | ch4 image | not checked | | JPL page confirms the 28.06 mi route from Eagle to Perseverance Valley. |
| Landing coordinates -2.3, -5.5 | landing, referenceLanding | **unverified** | OPP: Eagle Crater 1.9483° S, 354.47417° E (-1.9483, -5.5258) | See recommendation 7. |
| Quizzes q1, q2, q3 | quizzes | verified | MER-P, MER, END | |

---

## InSight

Main sources:
- IN = https://science.nasa.gov/mission/insight/
- SH = https://science.nasa.gov/mission/insight/science-highlights/
- Q1 = https://science.nasa.gov/missions/insight/nasas-insight-detects-first-likely-quake-on-mars/
- MOLE = https://www.nasa.gov/missions/insight/nasa-insights-mole-ends-its-journey-on-mars/
- PWR = https://www.nasa.gov/missions/insight/nasas-insight-still-hunting-marsquakes-as-power-levels-diminish/
- RET = https://www.nasa.gov/missions/insight/nasa-retires-insight-mars-lander-mission-after-years-of-science/
- MRO = https://www.nasa.gov/missions/insight/nasa-mars-orbiter-spots-retired-insight-lander-to-study-dust-movement

| Claim | Where | Verdict | NASA source | Note |
|---|---|---|---|---|
| Launched May 5, 2018 | dates | verified | IN | |
| Landed Nov 26, 2018 | ch1, callout, q1 | verified | IN, PWR | |
| Elysium Planitia, flat smooth plain, chosen for safety | ch1 | verified | IN | |
| Arm lifted a seismometer from the deck and set it on the ground | ch1 | verified | IN, IMG PIA22956 | |
| First seismometer ever placed on the surface of Mars | ch1 | verified | NASA SEIS page and PIA22956 ("first time a seismometer had ever been placed onto the surface of another planet") | |
| April 6, 2019, sol 128, first likely marsquake | ch1, callout, q1 | verified | Q1 | |
| First trembling that appeared to come from inside the planet | callout, q1 | verified | Q1 | |
| Mole built to dig about 5 m (16 ft), trailing a tether | ch2, callout, q2 | verified | RET | MOLE says sensors measure heat once "at least 10 feet (3 meters)" deep. NASA uses both. Fine. |
| Designed for loose sandy soil; clumpy soil gave too little friction | ch2, callout, q2 | verified | MOLE, RET | |
| "For almost two years" engineers tried fixes | ch2 | verified | MOLE ("for two years") | Feb 28, 2019 to Jan 2021 is about 1.9 years. |
| Jan 9, 2021: 500 more hammer strokes, no progress | ch2 | verified | MOLE | |
| NASA called an end to the digging, January 2021 | ch2 | verified | MOLE | Redundant after the previous sentence. Style only. |
| Mole ended just under the surface; still collected soil data | callout, q2 | verified | RET, MOLE (2 to 3 cm) | |
| More than 1,300 marsquakes (1,319) | ch3, description | verified | SH, RET | |
| Some from rock cracking inside Mars, some from space rocks | ch3 | verified | NASA article "marsquakes from meteoroids go deeper than expected" (snippet) | |
| Biggest in May 2022, estimated magnitude 5, at least six hours | ch3, callout | verified | SH, PWR (May 4) | |
| Crust about 25 to 40 km thick | ch3 | verified | SH | |
| Liquid core about 1,800 km radius, larger than expected | ch3, callout | verified | SH | |
| About 5,000 Wh per sol at landing; about 500 in 2022 | ch4, callout, q3 | verified | PWR | |
| Sprinkled dirt from scoop on windy days to sweep dust | ch4 | verified | RET, PWR | |
| Last contact Dec 15, 2022 | ch4, finalStatus, q3 | verified | RET, IN | |
| After two missed calls, retired Dec 21, 2022 | ch4, finalStatus, dates, q3 | verified | RET ("two consecutive attempts"); date confirmed by NASA's Dec 21, 2022 release and coverage | RET's body does not print the date. IN lists "End of Mission: Dec. 15, 2022". Recommendation 9. |
| 2024 MRO photo; panels reddish-brown | ch5, callout | verified | MRO | The page prints "Oct. 23" and release no. 2024-175. The year is implied. |
| Dark landing-rocket marks fading | ch5 | verified | MRO | |
| Scientists use images to study dust, wind, crater age | ch5, callout | verified | MRO | |
| "NASA planned to stop listening for me at the end of 2024" | ch5 | verified | MRO ("will stop listening ... at the end of this year") | Past tense is fine. I did not confirm that they actually stopped. |
| PIA22956 (Dec 19, 2018) | ch1 image | verified | IMG | |
| PIA23896 (scoop holds mole, June 2020) | ch2 image | verified | IMG (June 20, 2020) | |
| PIA25286 (Apr 24, 2022, sol 1,211) | ch4 image | verified | IMG | |
| PIA25282, PIA26515 | ch3, ch5 images | not checked | | |
| Landing 4.5° N, 135.62° E | landing, referenceLanding | verified (published value) | NASA pages: region centre 4.5° N, 135.9° E (JPL press kit, IN). Published fix 4.502° N, 135.623° E (Golombek et al. 2019; DLR/SAO/ADS) | See recommendation 7. |
| Quizzes q1, q2, q3 | quizzes | verified | Q1, RET, PWR | |

---

## Recommended text changes (recommendations only, in priority order)

### P1: change before submission

**1. Apollo 11 ch1: remove "about 17 seconds"** (`apollo11-ch1.narrative` and `title`)

- Old: `Mission Control thought I had about 17 seconds of fuel left.`
- New: `Houston counted down my fuel: "60 seconds," then "30 seconds."`
- Source: SP-350 transcript (Houston: "30 seconds"), ALSJ landing transcript (Duke: "60 seconds").
- Old title: `Seventeen Seconds`. New title: `Seconds to Spare`. If you want to keep a number, use `Thirty Seconds`, which Houston actually called.
- If the title text is used in tests, `strings.js` or the reading-level report, update those too.
- The callout ("only seconds of fuel remaining") is correct as is.

**2. Apollo 11 ch3: sample mass**

- Old: `They carried about 21.6 kilograms home.`
- New: `They carried about 21.5 kilograms home.`
- Callout "More than 21 kilograms" is fine.
- Note: NASA Science's Wide Awake page says 47 lb, and the ALSJ overview says 20 kg. "About 21.5 kg" is the NASA curator figure (21.55 kg).

**3. Surveyor 3 ch5: unsupported mechanism**

- Old: `The germs were most likely contamination from Earth. They probably hitched a ride before I ever left.`
- New: `The germs were most likely contamination from Earth, not a Moon survivor.`
- Callout wording is already acceptable.
- Reason: the NASA slides I could read support "most likely contamination" but not "before launch". Other sources point to handling after return, so the "before I ever left" detail may be wrong.

### P2: strongly recommended

**4. Apollo 17 ch2: rover distance and record**

- Old: `Together, we covered about 35.9 kilometers. That took about 4 hours and 26 minutes of driving. NASA says that is the greatest distance driven by any crewed vehicle on the Moon.`
- New: `Together, we covered about 36 kilometers in about 4 hours and 26 minutes of driving. That was the farthest any NASA vehicle had driven on another world, until Opportunity passed it in 2013.`
- Callout: keep "about 35.9 km" with the note, or switch to "about 36 km (NASA sources give 30.5 to 35.9 km)".
- Source: JPL 2013 release and OPP (35.744 km); NSSDC (35.9 km); Mission Details (30.5 km).
- This also links nicely to Opportunity ch3.

**5. Apollo 17 ch4 callout: fix the citation for the Cernan claim**

- Change the callout `citation` for "Eugene Cernan was the last person to have walked on the Moon" to:
  - label `NASA: Former Astronaut Eugene A. Cernan`
  - url `https://www.nasa.gov/former-astronaut-eugene-a-cernan/`
- Alternatively, keep Mission Details for the 110.4 kg figure and add the Cernan page as a second citation.
- Optionally add the LRO Apollo 17 lithograph (`https://science.nasa.gov/wp-content/uploads/2024/01/lro-apollo-17-litho.pdf`) to support "rover still there".

**6. Apollo 11 ch3 callout: replace an unreachable citation**

- The callout cites Chariots for Apollo, Appendix E, which I could not open.
- Switch the "3 and 4 billion years" claim to NASA History, Where No Man Has Gone Before, ch. 11 (`https://www.hq.nasa.gov/pao/History/SP-4214/ch11-4.html`). It is already in the citations list and the search snippet confirms the wording.
- Keep Appendix E only if you can open it and it confirms the sample mass.

**7. Coordinates**

- Opportunity (`landing` / `referenceLanding`): the marker is labelled Perseverance Valley but uses -2.3, -5.5. NASA gives Eagle Crater as 1.9483° S, 354.47417° E, which is -1.9483, -5.5258.
  - Option A: use Eagle Crater's NASA-verified coordinates and say the marker is the landing site.
  - Option B: keep -2.3, -5.5 and leave the `referenceLanding.source` note saying NASA gives no figure for Perseverance Valley.
  - Whichever you choose, make the source note match the displayed locationName.
- InSight (`referenceLanding.source`): update the note to say the published lander fix is 4.502° N, 135.623° E (Golombek et al., 2019). NASA pages give 4.5° N, 135.9° E as the targeted region centre. The current text calls the baseline "unverified".

**8. Viking 1 ch3: soften "still talk"**

- Old: `Scientists still talk about what my results mean.`
- New: `Scientists still use what I found to plan better ways to look for life.`
- Source: NASA Astrobiology Viking page (results "helping to shape" life-detection strategy).
- Add `https://science.nasa.gov/astrobiology/missions/viking-project/` to the Viking 1 citations. It also supports the "no definitive evidence" sentence.

### P3: optional polish

**9. InSight dates and end date**

- NASA's mission page lists "End of Mission: Dec. 15, 2022"; the retirement announcement was Dec 21. Current `finalStatus` ("Last contact December 15, 2022. Mission retired December 21, 2022.") is accurate.
- `dates` is "May 5, 2018 – December 21, 2022". Either keep it or use December 15, 2022 to match NASA's mission page. If you keep it, make sure the UI does not call December 21 the "end of contact".

**10. Opportunity ch2: add a citation for the March 2004 claim**

- Add `https://www.jpl.nasa.gov/news/opportunity-rover-finds-strong-evidence-meridiani-planum-was-wet` (NASA/JPL, March 2, 2004) to the Opportunity citations.
- Also consider: "In March 2004" → "On March 2, 2004" if you want more precision.

**11. Viking 1 ch5: tighten the "only working spacecraft" inference**

- Old: `I stayed that way for the next two and a half years.`
- New: `I stayed that way for more than two and a half years.`
- Reason: April 1980 to Nov 1982 is about 2 years 7 months.

**12. Viking 1 dates note**

- NASA's Viking page says Nov 11, 1982 (faulty command). NASA Astrobiology and the "6 years 116 days" record on the Opportunity page imply Nov 13. Current text is fine. You could add "(NASA also lists Nov 13, 1982)" in notes only.

**13. Surveyor 3 ch1: date convention**

- NASA Science says "April 20" (UT); NASA image captions say April 19. Leave as is. If a judge compares, explain in notes that dates are UT.

**14. InSight ch2 style**

- Two sentences repeat January 2021. Old: `On January 9, 2021, the mole hammered 500 more times with no progress. In January 2021, NASA called an end to the digging.` New: `On January 9, 2021, the mole hammered 500 more times with no progress. The team then called an end to the digging.`

**15. Image IDs I did not check**

- as11-37-5458, as17-134-20435, PIA12922, PIA09703, PIA00563, PIA00395, PIA00392, PIA00573, PIA23178, PIA25282, PIA26515.
- For PIA00573, NASA's page for the Viking 2 frost photo is PIA00530. Confirm the caption "Frost at the Viking Lander 2 site on Utopia Planitia" matches the PIA00573 record.

---

## Summary of results

- About 150 distinct claims, 18 image records and all 18 quiz questions were checked.
- **Wrong or unsupported (3):** Apollo 11 "17 seconds" (and title), Apollo 11 "21.6 kg", Surveyor 3 ch5 "before I ever left".
- **Citation problems (3):** Cernan callout cites a page that lacks the claim; Apollo 11 ch3 callout cites an unreachable page; the March 2004 claim has no dated source.
- **Source or coordinates to settle (2):** Opportunity marker coordinates; InSight source note.
- **NASA disagrees with itself (not a data error):** Viking 2 end date (Apr 11/12), Viking 1 end (Nov 11/13), Apollo 17 rover distance (30.5/35.744/35.9 km), Apollo 12 distance from Surveyor 3 (155–183 m), Apollo 12 dates (Nov 18–20), AS12-48-7134 astronaut (Bean/Conrad), InSight mole depth (3 m / 5 m).
- All six quiz sets are consistent with their cited pages.

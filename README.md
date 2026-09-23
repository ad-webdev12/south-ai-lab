# South Artificial Intelligence Laboratory (SAIL)

Website for the AI and machine learning club at High School South.
Live at https://ad-webdev12.github.io/south-ai-lab/ once GitHub Pages is switched on
(Settings, Pages, deploy from branch `main`, folder `/ (root)`).

Eighteen static pages, no framework, no dependencies, no build step on the server.

```
build.py             page copy, templates, and the build checks
resources_data.py    everything on the Resources page: plan, learning planner, reading group, decks
*.html               generated output (committed, so GitHub Pages serves it directly)
assets/css/site.css  styles
assets/js/site.js    navigation, join form, planner progress, home hero animation
assets/js/demos.js   hero demos for data science, vision, neural networks, and the shared mount code
assets/js/scene-*.js the Language, Agents and Ethics heroes (one idea each)

assets/img/          figures and project photos
assets/docs/         the project README template that Resources links to
```

## Preview locally

```bash
python -m http.server 4175
```

## Edit, then rebuild

Never edit the `.html` files by hand. Change the data blocks at the top of `build.py`
or `resources_data.py`, then run:

```bash
python build.py
```

| To change | Edit |
| --- | --- |
| Meeting time, room, Classroom code, Instagram | `SITE` in `build.py` (one place, used everywhere) |
| Officers | `TEAM` and `PAST_OFFICERS` |
| Research groups and their pages | `GROUPS` |
| Featured projects, workshop archive | `FEATURED`, `SESSIONS` |
| News | `NEWS` (keep it to announcements that matter) |
| Monthly plan, learning planner, reading group, slide decks | `resources_data.py` |
| Contact email | `LAB_EMAIL` at the top of `assets/js/site.js` |

Adding a research group means adding one dict to `GROUPS`. The menu, home page, comparison
table, join form, and related-group links all pick it up.

## What the build checks

`python build.py` fails loudly on any of these:

- **Contrast.** Every text and background pair used in the CSS must reach WCAG AA (4.5:1).
- **Headings.** Exactly one `h1` per page, and no skipped levels.
- **Phrasing.** No em dashes or en dashes, and none of a list of stock phrases. Add to `BANNED`
  in `build.py` when you catch a new one.
- **Images.** It lists featured projects that have no photo yet.

## Project photos

Featured projects show a figure when one exists. Two already do (a chart built from the real
Titanic training data, and real samples from MNIST and Fashion-MNIST). To add the others, drop
a file in `assets/img/` with the matching name and rebuild:

- `assets/img/teachable-machine.jpg`
- `assets/img/ai-hub.jpg` (a screenshot of the site)

## Still to confirm before you share the link widely

The site states these as fact. They were reconstructed from the Google Classroom archive, so
check each one:

1. **Contact email** in `assets/js/site.js` is a placeholder.
2. **School name** in `SITE["school"]`.
3. **Meeting rhythm.** The site says every other Tuesday, 3:00 to 4:00 PM, Room 700F. Note that the
   August 2026 officers post on Instagram says "every Tuesday", so one of the two needs correcting.
4. **First meeting date.** The top news item says it will be posted. Put the real date in.
5. **Group timing.** The site says Applied Research teams work with their group from October and
   Foundations members join group activities in the second semester. That is a policy decision,
   so make sure the officers agree.
6. **Analyzing AI Models** (January 2026) is listed in the workshop archive only, because the
   actual task members were given isn't recorded anywhere I could see. If you add the task, a
   result, and credits, move it into `FEATURED`.
7. **AI Hub** has no link yet. Add its URL to the `links` list in `FEATURED`.
8. Names on the People page: spelling, and that everyone is fine being listed publicly.

## The home hero

`hero()` in `assets/js/site.js`: a dark field of soft particles that a hidden model keeps pulling into
four calm neighbourhoods around the edges of the name (blue for vision, violet for language, green
for data, warm white for agents). The loop is: scattered signal drifts in from the edges, the field
bends and groups it, the clusters clear (fine strands inside them, a faint contour around each), then
they dissolve back into moving signal. The centre stays dark so the name stays dominant, and the
cursor is a small local disturbance the field settles around. The status line under the caption
brightens one word at a time. The project wall (`heroWall()`) is the Projects page hero.

Every other page opens on a dark band with slow wave lines (`.pagetop`), and sections ease in on scroll.

## Research group demos

Each group page opens with a full-screen hero that is the demo itself, in `assets/js/demos.js`.
The title sits on top of it. Data science, vision and neural networks keep a bar along the bottom
with one short paragraph plus real buttons or a slider; Language, Agents and Ethics have their own
small controls. There are no pause buttons. The copy for each demo is in `DEMOS` in `build.py`.

| Group | What runs |
| --- | --- |
| Applied Data Science | A support vector classifier (RBF kernel), refit on every frame with the pointer as a data point. |
| Computer Vision | Real street footage (`assets/video/street.mp4`) with object boxes drawn from `assets/data/street-tracks.json`. The boxes were computed ahead of time (Faster R-CNN on every frame, then a motion tracker), so nothing heavy runs in the browser. |
| Natural Language Processing | A semantic space (`scene-nlp.js`): the right 40% of the hero shows 80 to 120 words at a time out of twenty thousand, placed by real GloVe 50-d vectors (Wikipedia and news), never under the title column, header or controls (`measureMasks()`). Click or search a word: it grows, its nearest words glide into an orbit with thin strands, the rest dims. Hover shows a few connections without moving the map. Phones show one cluster at a time. Data in `assets/data/words.txt`, `words-xy.bin` (int16 x,y), `words-vec.bin` (int8, 50 per word), about 1.3 MB. To rebuild for a different vocabulary: take the vectors, PCA to 2-D, pull each word toward its neighbours, spread overlaps, quantize. |
| Neural Networks | Gradient descent with momentum on a loss surface. Click to pick the starting point. |
| Agents and RL | A black stage (`scene-agents.js`): the title on the left, an empty pool of light on the right. Tap a letter and it falls straight down to the floor and bounces once; a spotlight comes on, the robot walks in from the right with a step cycle (feet stay planted while the body moves over them, hips turn, arms swing opposite the legs, each foot has a grounded shadow), stops beside the letter, crouches through the knees and hips with the torso folded, pinches the letter, rises, carries it at chest height to the outlined slot, places it with a click, looks at the title, turns and walks out. Three quick knocks make it hurry; five make it lose patience: it drops a letter, the light turns warm red, it kicks the pile across the floor, throws one oversized letter into a visual copy of the navigation (the real links stay usable), stands for a beat and leaves. The stage then shows TITLE SYSTEM OFFLINE and RESTART. The robot is the supplied render cut into pieces (`assets/img/robot2/`: head, torso, arms, thighs, shins, feet, and photo hands with a thumb and four fingers on knuckle pivots), toned to titanium with the wordmark and blue seam removed. Older versions kept unused: `scene-agents-desk2.js`, `scene-agents-seated1.js`, `scene-agents-standing.js`, `scene-agents-robot.js`, `scene-agents-desk.js`. |
| AI, Ethics and Society | A face scan (`scene-ethics.js`): one large matte-gray head, not a real person, rendered from a signed-distance model by a script (ray-marched in numpy) into `assets/img/face.png` with its landmark points, mesh edges and box in `face.json`. A scan beam passes, points lock onto eyes, nose, lips, jaw and cheekbones, a mesh draws in, the box settles, then for half a second the system loses the face (one amber flicker), re-locks, and rests. Loops on its own. |

The street clip is Mixkit video 4000, used under the Mixkit free license. It is sped-up footage, so
people move a long way between frames; the tracker matches on predicted motion, not box overlap.
The scripts that made the track file are not in the repo. To redo it for a new clip: run a detector
over every frame, link detections into tracks, and write `{w, h, dt, n, tracks: [{c, id, s, p, b}]}`
where `b` is one `[x, y, w, h]` per frame starting at frame `s`.

The logo is `assets/img/logo.png` (transparent PNG) and `assets/favicon.png`. The site stores nothing about visitors except
the learning-path checkboxes, which stay in the browser.

The navigation bar is clear over the top of each page and turns to frosted glass once the page
scrolls under it (`nav()` in `assets/js/site.js`, `.masthead` in the stylesheet).

## People page

Portraits in `assets/img/people/` are cropped from the club's own officers post on Instagram.
The one-line descriptions in `TEAM` come from the club's record (past roles, things built for the
club). They were deliberately not researched from LinkedIn or the wider web: the officers are
students, and what is said about each of them publicly should be their call. Ask each officer for
a sentence in their own words and replace the line in `TEAM`.

## Where the learning resources came from

The planner was assembled from two public link collections and a university AI safety syllabus,
then cut down hard: a resource stays only if it is free, widely used, and gets a student closer
to starting a project. Every link was checked by script on 2026-09-21. Re-check them once a year.

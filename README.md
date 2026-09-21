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

`heroWall()` in `assets/js/site.js`: six pieces of real SAIL work (the Titanic chart, MNIST samples, a
labelled review, a first notebook cell, a model card, a detection frame) drift slowly behind the name,
joined by thin paths. Hover or tap a piece to bring it forward. Phones get three pieces and one drift.
The earlier plasma hero is kept as a backup: set `"hero": "plasma"` in `SITE`, or open
`index.html#plasma` to look at it without changing anything.

Every other page opens on a dark band with slow wave lines (`.pagetop`), and sections ease in on scroll.

## Research group demos

Each group page opens with a full-screen hero that is the demo itself, in `assets/js/demos.js`.
The title sits on top of it, and a bar along the bottom holds one short paragraph (what it is and
how to use it) plus real buttons or a slider, so it works with a keyboard or a finger. Pause only
appears where something can be paused. The copy for each demo is in `DEMOS` in `build.py`.

| Group | What runs |
| --- | --- |
| Applied Data Science | A support vector classifier (RBF kernel), refit on every frame with the pointer as a data point. |
| Computer Vision | Real street footage (`assets/video/street.mp4`) with object boxes drawn from `assets/data/street-tracks.json`. The boxes were computed ahead of time (Faster R-CNN on every frame, then a motion tracker), so nothing heavy runs in the browser. |
| Natural Language Processing | Words arranged by meaning (`scene-nlp.js`): about sixty words in a fixed, seeded map. Choosing or searching a word brings its nearest neighbors forward. The vectors are hand-written and the page says so. |
| Neural Networks | Gradient descent with momentum on a loss surface. Click to pick the starting point. |
| Agents and RL | The robot (`bot.js`, `scene-agents.js`) keeps the title in order and adapts to the visitor: moods, pointer and click prediction, escalating reactions, spelling fixes it can get wrong, and a small reward learner fed by the visitor's yes or no. Type `debug` on the page to see its state. `memory.js` loads on this page only and keeps what it learned in the browser. The quieter planning-desk version is kept unused in `scene-agents-desk.js`. |
| AI, Ethics and Society | Two phone feeds (`scene-ethics.js`). A slider sets how often new posts are chosen to match past clicks, and a counter shows how many of the twelve posts the two feeds still share. An illustration, not platform data. |

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

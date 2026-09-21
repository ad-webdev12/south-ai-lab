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
assets/js/demos.js   one teaching demo per research group page
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

A full-screen plasma field in `hero()` in `assets/js/site.js`. Glowing orbs drift around; each one
throws out slow filaments, and when two orbs come near each other, or near the pointer, filaments
jump across and brighten. Filaments are smooth curves that writhe over time, so nothing flashes.
It pauses off screen, has a pause button, starts still for reduced-motion visitors, and drops to
one strand per pair on slow machines.

## Research group demos

Each group page opens with a full-screen hero that is the demo itself, in `assets/js/demos.js`.
The title sits on top of it, and a bar along the bottom holds one short paragraph (what it is and
how to use it) plus real buttons or a slider, so it works with a keyboard or a finger. Pause only
appears where something can be paused. The copy for each demo is in `DEMOS` in `build.py`.

| Group | What runs |
| --- | --- |
| Applied Data Science | A support vector classifier (RBF kernel), refit on every frame with the pointer as a data point. |
| Computer Vision | Real street footage (`assets/video/street.mp4`) with COCO-SSD object detection running in the browser through TensorFlow.js. |
| Natural Language Processing | Attention arcs. The weights are illustrative and the text says so. |
| Neural Networks | Gradient descent with momentum on a loss surface. Click to pick the starting point. |
| Agents and RL | A crowd of agents learns to fly to a goal by trial and error (an evolution strategy). Click to move the goal. |
| AI, Ethics and Society | A simulated feed. A slider sets how often people see posts that match their views, and the crowd splits in two. |

The street clip is Mixkit video 4000, used under the Mixkit free license. TensorFlow.js and the
COCO-SSD model load from the jsdelivr CDN only on the Computer Vision page. If they fail to load,
the page still shows the footage without boxes.

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

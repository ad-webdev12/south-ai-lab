# South Artificial Intelligence Laboratory (SAIL)

Website for the AI and machine learning club at High School South.
Live at https://ad-webdev12.github.io/south-ai-lab/ once GitHub Pages is switched on
(Settings, Pages, deploy from branch `main`, folder `/ (root)`).

Thirteen static pages, no framework, no dependencies, no build step on the server.

```
build.py             page copy, templates, and the build checks
resources_data.py    everything on the Resources page: plan, learning planner, reading group, decks
*.html               generated output (committed, so GitHub Pages serves it directly)
assets/css/site.css  styles
assets/js/site.js    navigation, join form, planner progress, hero animation
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
3. **Meeting rhythm.** The site says every other Tuesday, 3:00 to 4:00 PM, Room 700F, which is what
   the 2025-26 announcements show.
4. **First meeting date.** The top news item says it will be posted. Put the real date in.
5. **Group timing.** The site says Applied Research teams work with their group from October and
   Foundations members join group activities in the second semester. That is a policy decision,
   so make sure the officers agree.
6. **Analyzing AI Models** (January 2026) is listed in the workshop archive only, because the
   actual task members were given isn't recorded anywhere I could see. If you add the task, a
   result, and credits, move it into `FEATURED`.
7. **AI Hub** has no link yet. Add its URL to the `links` list in `FEATURED`.
8. Names on the People page: spelling, and that everyone is fine being listed publicly.

## The hero animation

Particles are carried through a slowly changing vector field, and each one keeps a few seconds of
position history that is drawn as a tapered line, so the streamlines of the field become visible.
Moving the pointer adds a local swirl that fades when the pointer leaves. A click sends out a ring.

It pauses when the hero is off screen or the tab is hidden, has a visible pause button, starts
paused for visitors who ask for reduced motion, and rebuilds itself when the hero changes size.
Tuning lives at the top of `hero()` in `site.js`: particle count in `build()`, trail length in
`HIST` and `SAMPLE`, pointer strength in `advance()`.

## Where the learning resources came from

The planner was assembled from two public link collections and a university AI safety syllabus,
then cut down hard: a resource stays only if it is free, widely used, and gets a student closer
to starting a project. Every link was checked by script on 2026-09-21. Re-check them once a year.

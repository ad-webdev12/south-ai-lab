# South Artificial Intelligence Laboratory (SAIL)

Website for the AI and machine learning lab at High School South. Thirteen static pages, no framework,
no dependencies, no build step on the server.

```
build.py            all site content plus the page templates
*.html              generated output, committed so GitHub Pages can serve it directly
assets/css/site.css layout and type
assets/js/site.js   mobile nav, application form, hero visual
assets/favicon.svg
```

## Local preview

```bash
python -m http.server 4175
```

Then open http://localhost:4175.

## Editing content

Everything readable on the site comes from the data blocks at the top of `build.py`:

| Block | Controls |
| --- | --- |
| `SITE` | Lab name, school, room, meeting time, Classroom code, Instagram |
| `AREAS` | The six research group pages |
| `LEADERSHIP`, `ALUMNI` | People page |
| `TALKS` | Visitors listed on the Research page |
| `PROJECTS` | Projects page and nothing else |
| `NEWS` | News page and the three-column block on the home page |
| `CURRICULUM`, `TOOLING`, `EXTERNAL` | Resources page |

Rebuild after editing:

```bash
python build.py
```

The build refuses to pass silently if an em dash, an en dash, or one of a list of stock phrases
(`delve`, `seamless`, `cutting-edge`, `unlock`, `empower`, `dive into`, and so on) appears in the
output. Keep that check in place; it is the reason the copy reads the way it does.

## The hero visual

The animation behind the home page title is gradient descent with momentum on a two-dimensional loss
surface built from six Gaussian wells plus a shallow quadratic term. The contour lines are computed
with marching squares at runtime, the optimizer runs the real update rule, and the step, loss, learning
rate, and momentum printed in the corner are the live values. The small chart under the numbers is the
loss history for the current run.

Clicking the surface restarts the optimizer from that point, which is worth trying: different starting
points fall into different local minima, and that is the reason this particular visual is on an AI lab
site instead of an abstract pattern.

Tuning lives at the top of the `hero` function in `assets/js/site.js`: `LR`, `MU`, `STEPS_PER_SEC`, and
the `WELLS` array. Steps advance on elapsed time rather than per frame, so the speed is the same on a
fast machine and a slow one. If a visitor has reduced motion turned on, the path is drawn once and the
animation never starts.

## Content policy

The site claims only what the lab has actually done. Sessions and projects listed on the Projects page
and on each group page are taken from the club's own announcement archive, and anything that has not
happened yet is under a heading that says so. Please keep that separation when you add to it. A high
school lab that lists real Teachable Machine sessions and a real Kaggle entry reads better than one
that lists invented research output.

## Before publishing: replace these

1. **Contact email.** `LAB_EMAIL` at the top of `assets/js/site.js` is a placeholder. The footer link
   and the application form both use it.
2. **School name.** `SITE["school"]` says `High School South`.
3. **Interest meeting date.** The first news entry says the date will be posted.
4. Check the spelling of every name on the People page, and that each person is comfortable being
   listed on a public site.

## Publishing on GitHub Pages

The repository is already initialized and committed. Once the GitHub CLI is installed and you are
signed in:

```bash
gh repo create south-ai-lab --public --source . --push
```

```bash
gh api -X POST repos/:owner/south-ai-lab/pages -f "source[branch]=main" -f "source[path]=/"
```

The site appears at `https://<your-username>.github.io/south-ai-lab/` a minute or two later. Without
the CLI, create an empty public repository on github.com and run:

```bash
git remote add origin https://github.com/<your-username>/south-ai-lab.git
```

```bash
git push -u origin main
```

Then turn on Pages under Settings, Pages, "Deploy from a branch", branch `main`, folder `/ (root)`.

Netlify works too: drop this folder onto app.netlify.com/drop for an instant URL, or connect the
repository for automatic deploys. There is nothing to configure in either case, since the HTML is
committed.

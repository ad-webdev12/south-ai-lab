#!/usr/bin/env python3
"""
Static site generator for the South Artificial Intelligence Laboratory.

    python build.py

Writes plain .html files next to this script. No dependencies.
Content lives in the data blocks below. Templates are at the bottom.
"""

import os

HERE = os.path.dirname(os.path.abspath(__file__))

SITE = {
    "name": "South Artificial Intelligence Laboratory",
    "short": "SAIL",
    "school": "High School South",
    "room": "Room 700F",
    "meets": "Tuesdays, 3:00 to 4:00 PM",
    "code": "selpcao",
    "instagram": "hss_aiclub",
    "founded": "2022",
}

MARK = (
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">'
    '<path d="M4 20V4M4 20h16" stroke="currentColor" stroke-width="1.6"/>'
    '<path d="M6 16.5c3.4 0 4.2-9 7-9 2.2 0 2.6 5 5 5" stroke="#b4532a" stroke-width="1.7"/>'
    "</svg>"
)

# ---------------------------------------------------------------- research groups

AREAS = [
    {
        "slug": "nlp.html",
        "code": "G-01",
        "name": "Natural Language Processing",
        "short": "Natural Language Processing",
        "summary": "How text is represented numerically, what sequence models learn from it, and how to judge output that has no single right answer.",
        "overview": [
            "The language group works on models that read and produce text. Our first session on the subject ran in April 2026 and covered tokenization, word representations, and the places where large language models fail. Members submitted working example code at the end of that unit rather than notes.",
            "The group starts from methods that can be inspected by hand, such as bag of words and TF-IDF, before moving to embeddings and attention. Evaluation is treated as part of the work: when a model produces a sentence instead of a label, someone has to decide what counts as correct, and that decision needs to be written down before the results are read.",
        ],
        "topics": [
            "Tokenization and text cleaning",
            "Bag of words, TF-IDF, and what they throw away",
            "Word and sentence embeddings",
            "Attention and the transformer block",
            "Prompting, context, and failure modes of language models",
            "Writing an evaluation rubric for generated text",
        ],
        "done": [
            ("April 2026", "Introduction to NLP session, with slides covering representation, sequence models, and current applications."),
            ("April 2026", "Members wrote and submitted their own NLP example code as the unit assignment."),
            ("January 2026", "The Analyzing AI Models project: pick two models, give them the same task, and report where their behavior differs."),
        ],
        "planned": [
            "Build a text classifier on a dataset the group collects and labels itself.",
            "Read the original transformer paper together across two sessions.",
            "Compare open models on one shared task using a rubric written in advance.",
        ],
        "tools": ["Python", "scikit-learn", "Hugging Face Transformers", "NLTK", "Google Colab"],
        "reading": [
            "Jurafsky and Martin, <i>Speech and Language Processing</i>, chapters 2 through 6 (free online).",
            "Alammar, <i>The Illustrated Transformer</i>.",
            "Vaswani et al., <i>Attention Is All You Need</i> (2017).",
        ],
        "entry": "Python functions, lists, and dictionaries. The attention unit is easier with some linear algebra, which the neural systems group covers.",
    },
    {
        "slug": "vision.html",
        "code": "G-02",
        "name": "Computer Vision",
        "short": "Computer Vision",
        "summary": "Convolutional models on image data, from a first classifier trained in a browser to controlled experiments on standard datasets.",
        "overview": [
            "The vision group works with image data. In March 2026 we ran a session where every person present trained and tested a working image classifier inside the hour using Teachable Machine, then spent the rest of the session finding inputs that broke it. Most sessions follow that order: get something working, then test it against inputs it was not trained on.",
            "From there the work moves to Keras. In December 2025 members built a convolutional network on MNIST from a shared notebook, then extended it to Fashion-MNIST and CIFAR-10, which are harder and produce lower accuracy. The same architecture scores very differently on the three datasets, which is a useful thing to see early.",
        ],
        "topics": [
            "Image preprocessing, normalization, and augmentation",
            "Convolution, pooling, and network depth",
            "Transfer learning on small datasets",
            "Collecting and labeling original image data",
            "Running a model in the browser",
            "Confusion matrices and per-class error analysis",
        ],
        "done": [
            ("March 2026", "Computer vision session using Teachable Machine, covering vision, pose, and audio models."),
            ("December 2025", "Convolutional network on MNIST built from a shared notebook, then extended to Fashion-MNIST and CIFAR-10."),
            ("December 2025", "Architecture exercise: change one component of the network at a time and record what happens to accuracy."),
        ],
        "planned": [
            "A class project on images members photograph and label themselves.",
            "Transfer learning compared against training from scratch on the same small dataset.",
            "A short writeup on where our best model fails and why.",
        ],
        "tools": ["Keras", "TensorFlow", "Teachable Machine", "OpenCV", "Google Colab"],
        "reading": [
            "Keras dataset documentation, used directly in sessions.",
            "Goodfellow, Bengio and Courville, <i>Deep Learning</i>, chapter 9.",
            "Stanford CS231n course notes on convolutional networks.",
        ],
        "entry": "Open to first-year members. The Keras work assumes you have used a notebook before, which the fall sessions cover.",
    },
    {
        "slug": "neural-systems.html",
        "code": "G-03",
        "name": "Neural Systems",
        "short": "Neural Systems",
        "summary": "What a network is doing underneath the framework call: gradients, optimizers, and the mathematics each of them needs.",
        "overview": [
            "This group covers the foundations that the other groups rely on. Sessions in December 2025 introduced neural networks and convolutional networks, and earlier years covered the perceptron and backpropagation alongside demonstrations such as Google Quick, Draw!.",
            "The aim is that members can explain what happens between calling fit and getting a number back. Alongside the implementation work, the group runs a mathematics track that covers the linear algebra, derivatives, and probability each unit actually needs, at the point in the sequence where it comes up.",
        ],
        "topics": [
            "The perceptron and the forward pass",
            "Loss functions and gradient descent",
            "Backpropagation worked through by hand",
            "Momentum, learning rates, and schedules",
            "Overfitting, regularization, and early stopping",
            "Supporting mathematics: vectors, matrices, partial derivatives, probability",
        ],
        "done": [
            ("December 2025", "Sessions on deep learning, neural networks, and convolutional networks."),
            ("Since 2023", "Recurring neural network lessons, introduced through Quick, Draw! and similar demonstrations."),
            ("March 2026", "Python sessions covering the programming background the implementation work assumes."),
        ],
        "planned": [
            "A two-layer network written in NumPy with gradients checked numerically.",
            "Optimizers compared on one dataset under the same budget.",
            "A short set of notes on the mathematics, maintained by members.",
        ],
        "tools": ["NumPy", "Matplotlib", "Keras", "Jupyter", "Google Colab"],
        "reading": [
            "Nielsen, <i>Neural Networks and Deep Learning</i>, chapters 1 and 2 (free online).",
            "3Blue1Brown, neural network video series, used as a companion to the derivation.",
            "Kingma and Ba, <i>Adam: A Method for Stochastic Optimization</i> (2014).",
        ],
        "entry": "Algebra II is enough to start. Calculus helps for the backpropagation unit but is introduced in the session.",
    },
    {
        "slug": "agents.html",
        "code": "G-04",
        "name": "Agents and Reinforcement Learning",
        "short": "Agents and RL",
        "summary": "Systems that take actions rather than return one prediction. New for the 2026 to 2027 year.",
        "overview": [
            "This is a new group. It was added because the questions members asked during the language model sessions were mostly about systems that do things: models that call tools, take several steps, and are judged on whether the task got finished.",
            "The reinforcement learning side starts in environments small enough that the right answer can be worked out by hand, so that a learned policy can be checked against it. The applied side builds small tool-using programs around a language model and keeps a log of where the multi-step plans break.",
        ],
        "topics": [
            "States, actions, rewards, and discounting",
            "Q-learning in gridworlds",
            "Exploration against exploitation",
            "Language models calling tools",
            "Breaking a task into steps, and keeping track of them",
            "Writing a repeatable task set so changes can be compared",
        ],
        "done": [
            ("March 2026", "Members reviewed current industry work on agent systems and brought questions to the following session."),
            ("2026", "Group proposed and approved for the 2026 to 2027 year."),
        ],
        "planned": [
            "A gridworld Q-learning lab that members implement themselves.",
            "A small tool-using assistant with a written log of its failures.",
            "A fixed set of tasks used to compare two agent designs.",
        ],
        "tools": ["Python", "NumPy", "Gymnasium", "Google Colab"],
        "reading": [
            "Sutton and Barto, <i>Reinforcement Learning: An Introduction</i>, chapters 3 through 6 (free online).",
            "Yao et al., <i>ReAct: Synergizing Reasoning and Acting in Language Models</i> (2022).",
        ],
        "entry": "One term of Python, or a completed project in another group. This group assumes you can debug your own code.",
    },
    {
        "slug": "data-science.html",
        "code": "G-05",
        "name": "Applied Data Science",
        "short": "Applied Data Science",
        "summary": "Tabular data, feature engineering, and competition work. The usual starting point for new members.",
        "overview": [
            "This group works with structured data: loading it, handling missing values, choosing which columns to use, and splitting the data so that a score can be trusted. The fall sequence spends most of its time here, since the later units assume all of it.",
            "In November 2025 the lab entered the Titanic competition on Kaggle in teams, with scores submitted through a shared form and results discussed in the following session. The preprocessing notebooks written for that unit are reused every year, and the seaborn and scikit-learn work from the same term is the basis for how members present results.",
        ],
        "topics": [
            "Loading and cleaning data with pandas",
            "Missing values, encoding, and scaling",
            "Train and test splits, and cross-validation",
            "Linear models, decision trees, and ensembles",
            "Metrics past accuracy, and class imbalance",
            "Plots that answer a specific question",
        ],
        "done": [
            ("November 2025", "Titanic survival prediction on Kaggle, entered in teams, with scores collected through a shared form."),
            ("November 2025", "Sessions on seaborn, data cleaning, train and test splitting, scikit-learn, and model evaluation."),
            ("December 2024", "Kaggle Learn courses in Python and introductory machine learning, worked through during meetings."),
            ("April 2025", "pandas sessions covering indexing, grouping, and joining."),
        ],
        "planned": [
            "A second competition entry with teams formed at the start of the term.",
            "A project on a dataset from the school or the district.",
            "A shared style for charts used in presentations.",
        ],
        "tools": ["pandas", "NumPy", "scikit-learn", "seaborn", "Matplotlib", "Kaggle"],
        "reading": [
            "Kaggle Learn, Intro to Python and Intro to Machine Learning.",
            "scikit-learn user guide, model selection section.",
            "VanderPlas, <i>Python Data Science Handbook</i> (free online).",
        ],
        "entry": "No prior experience. This is the recommended first group for members joining the Foundations Program.",
    },
    {
        "slug": "society.html",
        "code": "G-06",
        "name": "AI, Ethics and Society",
        "short": "AI, Ethics and Society",
        "summary": "Fairness, documentation, and the arguments about deployment, run as work with written output rather than open discussion.",
        "overview": [
            "The lab has run ethics sessions since its early years, including a Moral Machine activity on machine decisions with human consequences and a visit from researchers at MIT Lincoln Laboratory who answered questions on the subject from members.",
            "The group works on specific outputs rather than open discussion. Members look at where a model built elsewhere in the lab performs worse on one part of the data than another, write the short documentation that should go with a released model, and read current policy in the original text.",
        ],
        "topics": [
            "Error rates compared across groups within a dataset",
            "What a dataset does not contain, and who that affects",
            "Short model documentation for released work",
            "Student data, privacy, and what is collected",
            "Automation and work",
            "Reading current regulation directly",
        ],
        "done": [
            ("November 2024", "Moral Machine activity and discussion on automated decisions."),
            ("October 2023", "Question session with Rob Seater and Kimberlee Chang of MIT Lincoln Laboratory, with questions prepared by members in advance."),
            ("2025 and 2026", "Discussions on the limits of large language models, run alongside the technical sessions."),
        ],
        "planned": [
            "A one-page model card written for each project that gets presented.",
            "An error breakdown for the vision group's best classifier.",
            "A debate format with positions assigned rather than chosen.",
        ],
        "tools": ["pandas", "Jupyter", "Google Docs"],
        "reading": [
            "Mitchell et al., <i>Model Cards for Model Reporting</i> (2019).",
            "Barocas, Hardt and Narayanan, <i>Fairness and Machine Learning</i>, chapters 1 through 3 (free online).",
            "Moral Machine, from MIT Media Lab.",
        ],
        "entry": "Open to everyone. Reading and writing carry more weight here than code, though the error analysis is done in Python.",
    },
]

# ---------------------------------------------------------------- people

LEADERSHIP = [
    ("Henna Patel", "Co-Director", "Foundations Program and the session schedule"),
    ("Aarav Dey", "Co-Director", "Applied Research Division and lab infrastructure"),
    ("Maushmi Miraj", "Co-Director", "Research groups and end-of-term presentations"),
    ("Maahi Mehta", "Deputy Director", "Instruction and new member onboarding"),
    ("Shriyan Kumar", "Deputy Director", "Project supervision and competition entries"),
    ("Ishan Sarda", "Records and Communications", "Meeting records, announcements, and the archive"),
    ("Jia Arora", "Junior Officer", "Outreach, guest speakers, and recruitment"),
]

ALUMNI = [
    ("2025 to 2026", "Eric Zou, president. Helen Chen and Henna Patel, vice presidents. Maushmi Miraj, secretary. Aarav Dey, treasurer. Syam Paladugu and Jia Arora, junior officers."),
    ("2024 to 2025", "Atin Mathur, president. Eric Zou, vice president. Simran Cheema, secretary. Prajwal Bhat and Vivek Raghuram, treasurers."),
    ("2023 to 2024", "Mahitha Thippireddy, president. Saumya Muthukumar, vice president. Nimai Ponna, secretary. Akshay Sharma, treasurer. Eric Zou, junior officer."),
    ("2022 to 2023", "The founding year. Mahitha Thippireddy, Saumya Muthukumar, and Ramya Gouraiah ran the first sessions in Room 700B."),
]

TALKS = [
    ("October 2023", "Rob Seater and Kimberlee Chang, MIT Lincoln Laboratory",
     "A session on applied research at Lincoln Laboratory and on the ethics of automated systems. Members submitted questions in advance and the session was built around them."),
    ("March 2023", "Prof. F. Xhakaj, Carnegie Mellon University",
     "A talk on university research in intelligent learning systems, followed by questions collected from members through a form beforehand."),
]

# ---------------------------------------------------------------- projects and news

PROJECTS = [
    ("April 2026", "NLP example code", "Natural Language Processing",
     "Members wrote their own small natural language programs after the introductory session and submitted them as the unit assignment."),
    ("March 2026", "Teachable Machine models", "Computer Vision",
     "Vision, pose, and audio classifiers built during a single session, then tested against inputs outside the training data."),
    ("January 2026", "Analyzing AI Models", "Natural Language Processing",
     "A project comparing two language models on the same task and reporting where and why their answers diverge."),
    ("December 2025", "Convolutional networks on MNIST, Fashion-MNIST, and CIFAR-10", "Computer Vision",
     "A shared Keras notebook for digit classification, extended by members to two harder datasets with accuracy compared across all three."),
    ("November 2025", "Titanic survival prediction", "Applied Data Science",
     "Teams entered the Kaggle competition, submitted scores through a shared form, and presented their feature choices in the following session."),
    ("November 2025", "scikit-learn and seaborn analyses", "Applied Data Science",
     "Members chose their own datasets and worked through cleaning, splitting, fitting, and evaluation, then presented the plots."),
    ("April 2025", "AI Hub", "Lab infrastructure",
     "A website collecting club resources and materials in one place, built by Aarav Dey and used in meetings since."),
    ("December 2024", "Kaggle Learn courses", "Applied Data Science",
     "Members worked through the Python and introductory machine learning tracks during meetings, with officers available for questions."),
    ("November 2024", "Moral Machine discussion", "AI, Ethics and Society",
     "A session on automated decisions with human consequences, using the MIT Media Lab activity as the starting point."),
    ("2023", "Neural network sessions", "Neural Systems",
     "Lessons on the perceptron and backpropagation, introduced through Quick, Draw! and similar public demonstrations."),
]

NEWS = [
    ("September 2026", "Recruitment is open for the 2026 to 2027 year",
     "Both tracks are accepting members. The date of the first interest session will be posted here and on Google Classroom. Anyone may attend a meeting before applying."),
    ("June 2026", "Officers named for 2026 to 2027",
     "Henna Patel, Aarav Dey, and Maushmi Miraj were selected as co-presidents, with Maahi Mehta and Shriyan Kumar as co-vice presidents, Ishan Sarda as secretary, and Jia Arora as junior officer. Applicants who were not selected remain eligible for group leads and project roles."),
    ("June 2026", "Last meeting of the year",
     "The final session covered a review of the year and plans for the next one, including a longer project cycle and a written record for each project."),
    ("May 2026", "Officership applications extended",
     "The deadline for the officership interest form was moved to May 26. Meetings paused during AP examinations."),
    ("April 2026", "Introduction to natural language processing",
     "A session on how text is represented and what sequence models do with it, followed by an assignment where members submitted their own example code."),
    ("March 2026", "Computer vision session",
     "An interactive session where everyone present trained a working image classifier, then looked for inputs that broke it. Attendance was the highest of the year."),
    ("March 2026", "Kaggle progress and Python sessions",
     "Members continued their Kaggle coursework and worked through a Python session covering the background the later units assume."),
    ("January 2026", "Large language models and the model analysis project",
     "A session on how large language models work, which introduced the semester project comparing two models on one task."),
    ("December 2025", "Deep learning, neural networks, and convolutional networks",
     "Members built a digit classifier from a shared notebook and then extended it to harder datasets. The notebook is still used as the starting point for the vision group."),
    ("November 2025", "Titanic competition and the modeling pipeline",
     "Teams entered a public Kaggle competition and submitted scores through a shared form. Sessions in the same month covered seaborn, data cleaning, scikit-learn, and evaluation."),
    ("October 2025", "First meeting of the year",
     "An introductory session on what the lab does, the projects planned for the year, and how the two tracks work."),
    ("April 2025", "AI Hub published",
     "A website collecting club materials and resources was built by a member and added to the meeting workflow."),
    ("October 2023", "Researchers from MIT Lincoln Laboratory visit",
     "Rob Seater and Kimberlee Chang answered questions on applied AI research and on ethics, with questions collected from members in advance."),
    ("March 2023", "Guest lecture from Carnegie Mellon",
     "Prof. F. Xhakaj spoke about university research in intelligent learning systems and answered questions submitted by members beforehand."),
    ("September 2022", "The lab holds its first meeting",
     "The first interest session was held in Room 700B, beginning with Python foundations and an introduction to what machine learning is."),
]

CURRICULUM = [
    ("Fall, first sessions", "Python and notebooks",
     "Types, control flow, functions, and working in a browser notebook. Members who already program move ahead after a short check."),
    ("Fall", "Data handling and plots",
     "pandas, cleaning, exploratory analysis, and charts built with seaborn and Matplotlib."),
    ("Late fall", "Classical machine learning",
     "Train and test splits, scikit-learn estimators, cross-validation, and evaluation metrics. The competition entry sits here."),
    ("Winter", "Neural networks",
     "The perceptron, gradient descent, and backpropagation, followed by a convolutional network built in Keras."),
    ("Late winter", "Vision and language",
     "Image classifiers on standard datasets, then how text is represented and what language models do with it."),
    ("Spring", "Group project",
     "A project chosen by the member or the team, with a result, a short writeup, and a presentation at the end of the year."),
]

TOOLING = [
    ("Compute", "Google Colab and Kaggle Notebooks for anything that needs a GPU. School laptops handle every session without one."),
    ("Environment", "Browser notebooks by default, so nothing has to be installed. Members who prefer a local Python setup get help in the first session."),
    ("Code sharing", "GitHub for project code. Applied Research Division projects are expected to have a README that lets another member run them."),
    ("Writing", "Short writeups in Google Docs or Markdown. The project template is provided."),
]

EXTERNAL = [
    ("Kaggle Learn", "https://www.kaggle.com/learn",
     "Short practical courses. The Python and Intro to Machine Learning tracks are used in the fall."),
    ("Keras datasets", "https://keras.io/api/datasets/",
     "MNIST, Fashion-MNIST, and CIFAR-10, used in the neural network and vision units."),
    ("Project Jupyter", "https://jupyter.org/try-jupyter/lab/",
     "Notebooks that run in a browser with nothing installed."),
    ("Teachable Machine", "https://teachablemachine.withgoogle.com/",
     "Used in introductory vision sessions before members move to Keras."),
    ("MIT Beaver Works Summer Institute", "https://bwsi.mit.edu/",
     "A summer program in AI, robotics, and cybersecurity. Members of the lab have attended and can answer questions about applying."),
    ("Moral Machine", "https://www.moralmachine.net/",
     "The activity used in the ethics sessions."),
]

NAV = [("index.html", "Home"), ("research.html", "Research"), ("projects.html", "Projects"),
       ("people.html", "People"), ("resources.html", "Resources"), ("news.html", "News"),
       ("join.html", "Join")]


# ---------------------------------------------------------------- templates

def head(title, desc):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | {SITE["short"]}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title} | {SITE["name"]}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&family=Libre+Franklin:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/site.css">
</head>
<body>
'''


def masthead(active):
    links = []
    for href, label in NAV:
        key = "home" if href == "index.html" else href.replace(".html", "")
        if label == "Research":
            items = "".join(
                f'<li><a href="{a["slug"]}">{a["code"]} &nbsp; {a["short"]}</a></li>' for a in AREAS
            )
            on = " on" if active in ("research", "area") else ""
            links.append(
                f'<div class="navgroup{on}"><button aria-haspopup="true">Research '
                f'<svg viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.8"/></svg>'
                f'</button><ul><li><a href="research.html">Overview of all groups</a></li>{items}</ul></div>'
            )
        else:
            on = " class=\"on\"" if active == key else ""
            links.append(f'<a{on} href="{href}">{label}</a>')
    nav_html = "\n      ".join(links)

    drawer_areas = "\n      ".join(
        f'<a class="sub" href="{a["slug"]}">{a["code"]} &nbsp; {a["short"]}</a>' for a in AREAS
    )

    return f'''<header class="masthead">
  <div class="wrap masthead-in">
    <a class="brand" href="index.html">{MARK}<b>{SITE["short"]}</b><span>{SITE["school"]}</span></a>
    <nav class="mainnav">
      {nav_html}
    </nav>
    <button class="navtoggle" data-navtoggle aria-label="Menu" aria-expanded="false">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
  </div>
  <div class="drawer" data-drawer>
    <div class="wrap">
      <a href="index.html">Home</a>
      <a href="research.html">Research overview</a>
      <p class="lbl">Groups</p>
      {drawer_areas}
      <p class="lbl">More</p>
      <a href="projects.html">Projects</a>
      <a href="people.html">People</a>
      <a href="resources.html">Resources</a>
      <a href="news.html">News</a>
      <a href="join.html">Join</a>
    </div>
  </div>
</header>
'''


def pagetop(crumb, title, lede):
    return f'''<section class="pagetop">
  <div class="wrap">
    <p class="crumb"><a href="index.html">{SITE["short"]}</a> / {crumb}</p>
    <h1>{title}</h1>
    <p class="lede">{lede}</p>
  </div>
</section>
'''


def footer():
    area_links = "\n        ".join(f'<a href="{a["slug"]}">{a["short"]}</a>' for a in AREAS)
    return f'''<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <h5>{SITE["short"]}</h5>
        <p class="foot-about">{SITE["name"]}, the machine learning laboratory at {SITE["school"]}, running since {SITE["founded"]}. Meetings are {SITE["meets"]} in {SITE["room"]}.</p>
      </div>
      <div class="foot-col">
        <h5>Research</h5>
        {area_links}
      </div>
      <div class="foot-col">
        <h5>Lab</h5>
        <a href="projects.html">Projects</a>
        <a href="people.html">People</a>
        <a href="resources.html">Resources</a>
        <a href="news.html">News</a>
      </div>
      <div class="foot-col">
        <h5>Contact</h5>
        <a href="join.html">Join the lab</a>
        <a href="#" data-email>contact</a>
        <a href="https://www.instagram.com/{SITE["instagram"]}/" rel="noopener">Instagram</a>
      </div>
    </div>
    <div class="foot-bot">
      <span>&copy; <span data-year>2026</span> {SITE["name"]}</span>
      <span>Google Classroom code: {SITE["code"]}</span>
      <span>{SITE["room"]} &middot; {SITE["meets"]}</span>
    </div>
  </div>
</footer>
<script src="assets/js/site.js"></script>
</body>
</html>
'''


def h_rule(title, right=""):
    r = f'<span class="right">{right}</span>' if right else ""
    return f'<div class="h-rule"><h2>{title}</h2>{r}</div>'


def area_rows():
    rows = []
    for a in AREAS:
        topics = "; ".join(a["topics"][:3])
        rows.append(f'''<div class="arearow">
      <div class="code">{a["code"]}</div>
      <div>
        <h3><a href="{a["slug"]}">{a["name"]}</a></h3>
        <p>{a["summary"]}</p>
      </div>
      <div class="topics">{topics}</div>
    </div>''')
    return '<div class="arealist">\n    ' + "\n    ".join(rows) + "\n    </div>"


# ---------------------------------------------------------------- pages

def page_index():
    news_items = "\n      ".join(
        f'<li><span class="d">{d}</span><p>{t}</p></li>' for d, t, _b in
        [(n[0], n[1], n[2]) for n in NEWS[:4]]
    )
    return f'''<section class="hero">
  <canvas data-surface aria-hidden="true"></canvas>
  <div class="wrap hero-in">
    <p class="kicker">{SITE["school"]} &middot; Established {SITE["founded"]}</p>
    <h1>A student laboratory for machine learning</h1>
    <p>Six research groups covering language, vision, neural network foundations, agents, applied modeling, and the ethics of deployed systems. Open to every grade, with no prior programming required to start.</p>
    <div class="hero-links">
      <a class="solid" href="join.html">Join the lab</a>
      <a href="research.html">Research groups</a>
    </div>
    <p class="hero-note">Background: gradient descent with momentum on a two-dimensional loss surface, contours drawn with marching squares. Click the surface to start from a different point, or <button data-replay type="button">reinitialize</button>.</p>
    <div class="readout">
      step <b data-out-step>000</b><br>
      loss <b data-out-loss>0.0000</b><br>
      lr <b data-out-lr>0.042</b> &middot; momentum <b data-out-mu>0.88</b>
      <canvas data-spark aria-hidden="true"></canvas>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap cols3">
    <div>
      <h2>About the lab</h2>
      <p>{SITE["short"]} has met at {SITE["school"]} since {SITE["founded"]}. Sessions are taught by members, and the subjects follow a sequence: Python and data handling in the fall, classical models and a competition entry before winter, neural networks and vision after that, and a project in the spring.</p>
      <p>Everything the lab uses is free and runs in a browser. Members have gone on to summer research programs including MIT Beaver Works, and past sessions have included visits from researchers at MIT Lincoln Laboratory and Carnegie Mellon.</p>
    </div>
    <div>
      <h2>How it is organized</h2>
      <p>Members join one of two tracks. The Foundations Program is the taught track, for ninth graders and for sophomores in their first year with the lab. The Applied Research Division is for juniors and seniors working in small project teams, and is open to anyone else who applies with prior work.</p>
      <p>Both tracks attach to one of six research groups. Group assignments happen after the first term, so that the choice is made with some idea of what each group does.</p>
    </div>
    <div>
      <h2>Recent news</h2>
      <ul class="news">
      {news_items}
      </ul>
      <p class="small" style="margin:16px 0 0"><a href="news.html">All updates &rarr;</a></p>
    </div>
  </div>
</section>

<section class="section section--soft">
  <div class="wrap">
    {h_rule("Research groups", "Six groups, 2026 to 2027")}
    {area_rows()}
  </div>
</section>

<section class="section">
  <div class="wrap">
    {h_rule("Two ways to join")}
    <div class="tracks">
      <div class="track">
        <div class="inner">
          <h3>Foundations Program</h3>
          <p class="who">Ninth graders, and sophomores joining the lab for the first time</p>
          <p class="small">Taught sessions with guided exercises. Members write Python in the first session and train a working model before winter. No prior experience is assumed and no course is required beforehand.</p>
          <ul>
            <li>Weekly instruction following the published sequence</li>
            <li>Team entry to a public competition</li>
            <li>A project presented at the end of the year</li>
          </ul>
          <p class="foot"><a href="join.html#foundations">Program details</a></p>
        </div>
      </div>
      <div class="track track--two">
        <div class="inner">
          <h3>Applied Research Division</h3>
          <p class="who">Juniors and seniors, or anyone who applies with prior work</p>
          <p class="small">Project teams of two to four members attached to a research group. Teams choose a question, agree on what they will produce, and present the result to the lab at the end of the term.</p>
          <ul>
            <li>A short proposal agreed before the work starts</li>
            <li>Code in a repository another member can run</li>
            <li>A presentation and a written record at the end of term</li>
          </ul>
          <p class="foot"><a href="join.html#division">Division details</a></p>
        </div>
      </div>
    </div>
  </div>
</section>
'''


def page_research():
    talks = "\n      ".join(
        f'<li><span class="when">{w}</span><div><h4>{who}</h4><p>{d}</p></div></li>'
        for w, who, d in TALKS
    )
    return pagetop("Research", "Six research groups",
                   "Each group owns a subject area, a reading list, and its own projects. Members join a group after their first term and can move between groups at the start of a semester."
                   ) + f'''<section class="section">
  <div class="wrap">
    {h_rule("Groups")}
    {area_rows()}
  </div>
</section>

<section class="section section--soft">
  <div class="wrap split">
    <div class="prose">
      {h_rule("How a project runs")}
      <p>Projects in the Applied Research Division follow the same four steps.</p>
      <dl class="deflist">
        <dt>1. Proposal</dt>
        <dd>One page: the question, the data, what will be measured, and what result would count as a failure. A director signs off before the work starts.</dd>
        <dt>2. Build</dt>
        <dd>Four to six weeks in a shared repository, with a short progress check at each meeting so that problems come up early.</dd>
        <dt>3. Review</dt>
        <dd>A presentation to the lab, followed by questions. Reviewers usually ask whether another member could rerun the work and whether the measurement answers the original question.</dd>
        <dt>4. Record</dt>
        <dd>A short writeup kept with the code, including what did not work. Projects that do not reach a result are written up as well.</dd>
      </dl>
    </div>
    <aside>
      <div class="factbox">
        <h4>What a finished project has</h4>
        <dl>
          <dt>Code</dt><dd>In a repository, with instructions</dd>
          <dt>A measurement</dt><dd>Chosen before results are seen</dd>
          <dt>A writeup</dt><dd>One page, including limitations</dd>
          <dt>A presentation</dt><dd>Ten minutes, plus questions</dd>
        </dl>
        <div class="act"><a class="btn btn--wide" href="projects.html">See past projects</a></div>
      </div>
    </aside>
  </div>
</section>

<section class="section">
  <div class="wrap">
    {h_rule("Visitors", "Invited talks")}
    <p class="lede" style="margin-bottom:22px">Researchers from outside the school have spoken to the lab and taken questions from members.</p>
    <ul class="itemlist">
      {talks}
    </ul>
  </div>
</section>
'''


def page_area(a):
    topics = "".join(f"<li>{t}</li>" for t in a["topics"])
    done = "\n      ".join(
        f'<li><span class="when">{w}</span><div><p>{t}</p></div></li>' for w, t in a["done"]
    )
    planned = "".join(f"<li>{p}</li>" for p in a["planned"])
    reading = "".join(f"<li>{r}</li>" for r in a["reading"])
    tools = "".join(f"<span>{t}</span>" for t in a["tools"])
    overview = "".join(f"<p>{p}</p>" for p in a["overview"])
    others = "".join(
        f'<a href="{x["slug"]}">{x["short"]}</a>{", " if i < len([y for y in AREAS if y["slug"] != a["slug"]]) - 1 else ""}'
        for i, x in enumerate([y for y in AREAS if y["slug"] != a["slug"]])
    )

    return pagetop(f'<a href="research.html">Research</a> / {a["code"]}', a["name"], a["summary"]) + f'''<section class="section">
  <div class="wrap split">
    <div class="prose">
      {overview}

      <h3>What the group covers</h3>
      <ul>{topics}</ul>

      <h3>Sessions and work so far</h3>
      <ul class="itemlist">
      {done}
      </ul>

      <h3>Planned for this year</h3>
      <ul>{planned}</ul>

      <h3>Reading</h3>
      <ol class="refs">{reading}</ol>
    </div>
    <aside>
      <div class="factbox">
        <h4>{a["code"]}</h4>
        <dl>
          <dt>Open to</dt><dd>Both tracks</dd>
          <dt>Group lead</dt><dd>Appointed each fall from the Applied Research Division</dd>
          <dt>Starting point</dt><dd>{a["entry"]}</dd>
          <dt>Meets</dt><dd>{SITE["meets"]}, {SITE["room"]}</dd>
        </dl>
        <div class="act">
          <p class="tags" style="margin:0 0 12px">{tools}</p>
          <a class="btn btn--wide" href="join.html#apply">Apply and name this group</a>
        </div>
      </div>
      <p class="small muted" style="margin-top:18px">Other groups: {others}.</p>
    </aside>
  </div>
</section>
'''


def page_projects():
    rows = "\n      ".join(
        f'<li><span class="when">{w}</span><div><h4>{t}</h4><p>{d}</p>'
        f'<p class="tags" style="margin-top:6px"><span>{g}</span></p></div></li>'
        for w, t, g, d in PROJECTS
    )
    return pagetop("Projects", "Projects and sessions",
                   "Work the lab has actually run, most recent first. Session work is the product of the whole group; project work is done by teams or individual members."
                   ) + f'''<section class="section">
  <div class="wrap">
    {h_rule("Record", str(len(PROJECTS)) + " entries")}
    <ul class="itemlist">
      {rows}
    </ul>
    <p class="small muted" style="margin-top:26px">Project files and notebooks are posted in Google Classroom. Ask an officer if you need access to something older than the current year.</p>
  </div>
</section>
'''


def page_people():
    rows = "\n      ".join(
        f'<tr><td>{n}</td><td class="role">{r}</td><td>{f}</td></tr>' for n, r, f in LEADERSHIP
    )
    past = "\n      ".join(
        f'<tr><td>{y}</td><td colspan="2">{w}</td></tr>' for y, w in ALUMNI
    )
    return pagetop("People", "People",
                   "Officers are selected each spring through an application and a short interview. Group leads are appointed in the fall from the Applied Research Division."
                   ) + f'''<section class="section">
  <div class="wrap">
    {h_rule("Officers, 2026 to 2027")}
    <table class="roster">
      <thead><tr><th>Name</th><th>Role</th><th>Responsibility</th></tr></thead>
      <tbody>
      {rows}
      </tbody>
    </table>
  </div>
</section>

<section class="section section--soft">
  <div class="wrap split">
    <div class="prose">
      {h_rule("Roles")}
      <dl class="deflist">
        <dt>Directors</dt>
        <dd>Set the session schedule, teach or assign each session, and decide what is presented at the end of the term. Three share the position so that no one person carries the year.</dd>
        <dt>Deputy directors</dt>
        <dd>Run instruction and supervise project teams. Most weekly sessions are taught by a deputy director or a group lead.</dd>
        <dt>Group leads</dt>
        <dd>One for each research group, appointed in the fall. A lead maintains the reading list, approves proposals, and reports on the group at the end of term.</dd>
        <dt>Records and communications</dt>
        <dd>Keeps the meeting record, posts announcements, and maintains the archive of past sessions and materials.</dd>
        <dt>Junior officer</dt>
        <dd>Usually an underclassman. Covers outreach, recruitment, and arranging guest speakers.</dd>
      </dl>
    </div>
    <aside>
      <div class="factbox">
        <h4>Selection</h4>
        <dl>
          <dt>When</dt><dd>Applications in April, interviews in May</dd>
          <dt>Who can apply</dt><dd>Any member in good standing</dd>
          <dt>What counts</dt><dd>Attendance, finished work, and teaching other members</dd>
          <dt>Term</dt><dd>One academic year</dd>
        </dl>
        <div class="act"><a class="btn btn--wide" href="join.html">Membership details</a></div>
      </div>
    </aside>
  </div>
</section>

<section class="section">
  <div class="wrap">
    {h_rule("Past officers", "Since " + SITE["founded"])}
    <table class="roster">
      <tbody>
      {past}
      </tbody>
    </table>
    <p class="small muted" style="margin-top:20px">Rosters as recorded in club announcements.</p>
  </div>
</section>
'''


def page_resources():
    cur = "\n      ".join(
        f'<tr><td>{w}</td><td><strong>{t}</strong><br>{d}</td></tr>' for w, t, d in CURRICULUM
    )
    tools = "\n      ".join(f'<dt>{t}</dt><dd>{d}</dd>' for t, d in TOOLING)
    ext = "\n      ".join(
        f'<li><span class="when"><a href="{u}" rel="noopener">open</a></span>'
        f'<div><h4>{n}</h4><p>{d}</p></div></li>' for n, u, d in EXTERNAL
    )
    return pagetop("Resources", "Curriculum and resources",
                   "The taught sequence, the tools used in sessions, and the outside material the lab relies on. Everything listed is free."
                   ) + f'''<section class="section">
  <div class="wrap">
    {h_rule("Sequence", "Foundations Program")}
    <div class="tbl-wrap">
      <table class="tbl">
        <thead><tr><th>When</th><th>Subject</th></tr></thead>
        <tbody>
      {cur}
        </tbody>
      </table>
    </div>
    <p class="small muted" style="margin-top:20px">Applied Research Division members are not held to this sequence. They follow their group reading list and their project schedule.</p>
  </div>
</section>

<section class="section section--soft">
  <div class="wrap split">
    <div class="prose">
      {h_rule("Tools")}
      <dl class="deflist">
      {tools}
      </dl>
    </div>
    <aside>
      <div class="factbox">
        <h4>Before your first session</h4>
        <dl>
          <dt>Accounts</dt><dd>Kaggle and GitHub, both free</dd>
          <dt>Bring</dt><dd>A laptop if you have one</dd>
          <dt>Install</dt><dd>Nothing</dd>
          <dt>Cost</dt><dd>None</dd>
        </dl>
        <div class="act"><a class="btn btn--wide" href="join.html#apply">Apply to join</a></div>
      </div>
    </aside>
  </div>
</section>

<section class="section">
  <div class="wrap">
    {h_rule("Outside resources")}
    <ul class="itemlist">
      {ext}
    </ul>
  </div>
</section>
'''


def page_news():
    groups = {}
    order = []
    for date, title, body in NEWS:
        yr = date.split()[-1]
        if yr not in groups:
            groups[yr] = []
            order.append(yr)
        groups[yr].append(
            f'<li><span class="d">{date}</span><div><h3>{title}</h3><p>{body}</p></div></li>'
        )
    blocks = "\n".join(
        f'''<div style="margin-bottom:34px">
      {h_rule(yr, str(len(groups[yr])) + " entries")}
      <ul class="newspage">{"".join(groups[yr])}</ul>
    </div>''' for yr in order
    )
    return pagetop("News", "News and announcements",
                   "Session notes and announcements. Members get the same information through Google Classroom using code " + SITE["code"] + "."
                   ) + f'''<section class="section">
  <div class="wrap">
    {blocks}
  </div>
</section>
'''


def page_join():
    group_opts = "".join(f'<option>{a["code"]} {a["short"]}</option>' for a in AREAS)
    return pagetop("Join", "Join the lab",
                   "The lab takes new members every fall and reads every application. There is no cost and no prerequisite course."
                   ) + f'''<section class="section">
  <div class="wrap">
    {h_rule("Two tracks")}
    <div class="tracks">
      <div class="track" id="foundations">
        <div class="inner">
          <h3>Foundations Program</h3>
          <p class="who">Ninth graders, and sophomores joining the lab for the first time</p>
          <p>This track is taught from the beginning. Members write Python in the first session, work with real data within the first month or two, and train a convolutional network before the winter.</p>
          <ul>
            <li>Taught sessions with guided exercises and shared notebooks</li>
            <li>The published sequence, from Python through language models</li>
            <li>A team entry to a public competition, with the feature choices explained in the next session</li>
            <li>A project at the end of the year, presented to the lab</li>
            <li>A research group assignment after the first term</li>
          </ul>
          <p class="foot">Expected of members: attend meetings, finish the exercise for each unit, and present once during the year.</p>
        </div>
      </div>
      <div class="track track--two" id="division">
        <div class="inner">
          <h3>Applied Research Division</h3>
          <p class="who">Juniors and seniors, or anyone who applies with prior work</p>
          <p>The division does project work. Teams of two to four attach to a research group, agree on a question and a deliverable, and present the result at the end of the term. Underclassmen with prior projects can apply directly.</p>
          <ul>
            <li>A one-page proposal agreed before the work starts</li>
            <li>A repository with instructions another member can follow</li>
            <li>A progress check at each meeting</li>
            <li>A presentation with questions at the end of the term</li>
            <li>A short written record kept with the code, including what did not work</li>
          </ul>
          <p class="foot">Expected of members: roughly two hours a week outside meetings while a project is running.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section--soft">
  <div class="wrap split">
    <div class="prose">
      {h_rule("What we look for")}
      <p>Applications are not ranked by how much someone already knows. What matters more, for project teams and later for officer roles, is attendance and finished work.</p>
      <dl class="deflist">
        <dt>Attendance</dt>
        <dd>Meetings are every other Tuesday and the sequence builds on itself. Members who attend consistently get the project roles, and attendance is the first thing looked at during officer selection.</dd>
        <dt>Finished work</dt>
        <dd>A small project that works is worth more on an application than an ambitious one that was left unfinished. Include the error analysis if you have it.</dd>
        <dt>A specific interest</dt>
        <dd>On the form below, naming a question you want to answer helps more than naming a field. It makes the group assignment easier to get right.</dd>
        <dt>Explaining things to other members</dt>
        <dd>Most sessions are taught by students, so members who can explain a topic to someone a year behind them are usually the ones appointed as group leads.</dd>
      </dl>
    </div>
    <aside>
      <div class="factbox">
        <h4>Meetings</h4>
        <dl>
          <dt>When</dt><dd>{SITE["meets"]}</dd>
          <dt>Where</dt><dd>{SITE["room"]}, {SITE["school"]}</dd>
          <dt>Classroom code</dt><dd>{SITE["code"]}</dd>
          <dt>Instagram</dt><dd>@{SITE["instagram"]}</dd>
          <dt>Cost</dt><dd>None</dd>
        </dl>
        <div class="act"><a class="btn btn--wide" href="#apply">Go to the form</a></div>
      </div>
    </aside>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div class="prose">
      {h_rule("How to apply")}
      <dl class="deflist">
        <dt>Join the Google Classroom</dt>
        <dd>Use code <strong>{SITE["code"]}</strong>. Announcements, slides, and notebooks are posted there.</dd>
        <dt>Come to a meeting</dt>
        <dd>{SITE["meets"]} in {SITE["room"]}. You do not need to apply first, and visitors are welcome at any session.</dd>
        <dt>Send the form below</dt>
        <dd>Foundations Program applications are accepted through the first month of the fall term. Applied Research Division applications are read at the start of each semester.</dd>
        <dt>Short conversation</dt>
        <dd>Division applicants meet a director for about ten minutes to talk through the project they want to work on. There is no interview for the Foundations Program.</dd>
      </dl>
    </div>
    <aside>
      <div class="factbox">
        <h4>Joining mid-year</h4>
        <dl>
          <dt>Foundations Program</dt><dd>Open while catching up is realistic, usually until the winter unit</dd>
          <dt>After that</dt><dd>Attend as a visitor and join the next cycle</dd>
          <dt>Transfers between groups</dt><dd>At the start of a semester</dd>
        </dl>
      </div>
    </aside>
  </div>
</section>

<section class="section section--soft" id="apply">
  <div class="narrow">
    {h_rule("Application", "Fall 2026")}
    <form class="form" data-apply novalidate>
      <div class="f2">
        <div class="f"><label for="n">Full name</label><input id="n" name="name" type="text" required></div>
        <div class="f"><label for="e">School email</label><input id="e" name="email" type="email" required></div>
      </div>
      <div class="f2">
        <div class="f"><label for="g">Graduating class</label>
          <select id="g" name="grade">
            <option>2030 (grade 9)</option>
            <option>2029 (grade 10)</option>
            <option>2028 (grade 11)</option>
            <option>2027 (grade 12)</option>
          </select>
        </div>
        <div class="f"><label for="t">Track</label>
          <select id="t" name="track">
            <option>Foundations Program</option>
            <option>Applied Research Division</option>
            <option>Not sure yet</option>
          </select>
        </div>
      </div>
      <div class="f"><label for="gr">Research group you are interested in</label>
        <select id="gr" name="group"><option>Undecided</option>{group_opts}</select>
      </div>
      <div class="f"><label for="x">Anything you have done before</label>
        <input id="x" name="experience" type="text" placeholder="Courses, languages, projects, or none">
      </div>
      <div class="f"><label for="s">What would you want to work on, and why</label>
        <textarea id="s" name="statement" placeholder="A few sentences. Naming a specific question helps more than naming a field."></textarea>
      </div>
      <div class="f">
        <label class="fcheck"><input type="checkbox" name="commit" value="yes"><span>I can attend meetings {SITE["meets"]}, and will tell an officer when I cannot.</span></label>
      </div>
      <button class="btn" type="submit">Send application</button>
      <p class="fstatus"></p>
      <p class="fnote">This opens your mail program with the application filled in. If you would rather not use email, post the same information as a private comment on the application assignment in Google Classroom.</p>
    </form>
  </div>
</section>

<section class="section">
  <div class="narrow">
    {h_rule("Questions")}
    <div class="faq">
      <details open><summary>Do I need to know how to code?</summary><div class="ans"><p>Not for the Foundations Program. The first unit teaches Python from the beginning, and the exercises are built so that someone with no background can finish them. The Applied Research Division expects that you can already write and debug your own Python.</p></div></details>
      <details><summary>I am a sophomore. Which track is mine?</summary><div class="ans"><p>If this is your first year with the lab, start in the Foundations Program. If you were here last year, or you have project work you can show, apply to the Applied Research Division.</p></div></details>
      <details><summary>How much time does it take?</summary><div class="ans"><p>The Foundations Program is the meeting plus about an hour between sessions. The Applied Research Division is the meeting plus roughly two hours a week while a project is running, and less between projects.</p></div></details>
      <details><summary>Can I pick my research group right away?</summary><div class="ans"><p>You can name a preference on the form, and it is usually honored. Group assignments happen after your first term so the choice is made with some idea of what each group actually does.</p></div></details>
      <details><summary>Do I need a laptop or a GPU?</summary><div class="ans"><p>No. Every session runs in a browser notebook, and Colab and Kaggle provide free GPU time for the few projects that need it.</p></div></details>
      <details><summary>What if I miss meetings?</summary><div class="ans"><p>Materials for every session are posted in Google Classroom. Tell an officer and catch up. Attendance matters for leadership selection, not for membership.</p></div></details>
      <details><summary>Can I bring a friend?</summary><div class="ans"><p>Yes. Bring them to a Tuesday session. There is no cap and no application needed to visit.</p></div></details>
    </div>
  </div>
</section>
'''


# ---------------------------------------------------------------- build

def build():
    pages = [
        ("index.html", "Home",
         "Student machine learning laboratory at " + SITE["school"] + ". Six research groups, two membership tracks, open to every grade.",
         "home", page_index()),
        ("research.html", "Research",
         "Six research groups covering language, vision, neural network foundations, agents, applied data science, and ethics.",
         "research", page_research()),
        ("projects.html", "Projects",
         "Projects and sessions the lab has run since 2022.", "projects", page_projects()),
        ("people.html", "People",
         "Officers, roles, and past leadership of the laboratory.", "people", page_people()),
        ("resources.html", "Resources",
         "The taught sequence, tools used in sessions, and outside resources.", "resources", page_resources()),
        ("news.html", "News",
         "Announcements and session notes from the laboratory.", "news", page_news()),
        ("join.html", "Join",
         "Membership tracks, what we look for, and the application form.", "join", page_join()),
    ]
    for a in AREAS:
        pages.append((a["slug"], a["name"], a["summary"], "area", page_area(a)))

    written = []
    for filename, title, desc, active, body in pages:
        html = head(title, desc) + masthead(active) + "<main>\n" + body + "</main>\n" + footer()
        with open(os.path.join(HERE, filename), "w", encoding="utf-8") as fh:
            fh.write(html)
        written.append(filename)

    problems = []
    banned = ["—", "–", "delve", "seamless", "cutting-edge", "leverage the",
              "in today's", "game-chang", "unlock", "empower", "robust solution",
              "dive into", "at the intersection of", "journey"]
    for filename in written:
        with open(os.path.join(HERE, filename), encoding="utf-8") as fh:
            text = fh.read().lower()
        for term in banned:
            if term in text:
                problems.append(filename + ": " + term)
    print("built %d pages" % len(written))
    if problems:
        print("FLAGGED:")
        for p in problems:
            print("  " + p)
    else:
        print("copy check passed")


if __name__ == "__main__":
    build()

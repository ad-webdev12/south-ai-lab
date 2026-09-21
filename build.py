#!/usr/bin/env python3
"""
Static site generator for the South Artificial Intelligence Laboratory.

    python build.py

Writes plain .html files next to this script. No dependencies.
Page content lives in the data blocks below. The learning planner on the
Resources page lives in resources_data.py.

The build also runs four checks and reports anything that fails:
text contrast (WCAG AA), heading order, banned phrasing, and missing images.
"""

import glob
import os
import re

from resources_data import BUILD_SECTION, DECKS, IDEAS, PLAN, PROGRAMS, SAFETY, STAGES

HERE = os.path.dirname(os.path.abspath(__file__))
YEAR = "2026-27"

SITE = {
    "name": "South Artificial Intelligence Laboratory",
    "short": "SAIL",
    "school": "High School South",
    "room": "Room 700F",
    "meets": "Every other Tuesday, 3:00 to 4:00 PM",
    "meets_short": "Every other Tuesday, 3 to 4 PM",
    "code": "selpcao",
    "instagram": "hss_aiclub",
}

# ---------------------------------------------------------------- research groups

GROUPS = [
    {
        "key": "data-science",
        "slug": "data-science.html",
        "name": "Applied Data Science",
        "sub": "",
        "first": True,
        "line": "Find patterns in real datasets and compete on Kaggle.",
        "desc": "This group cleans messy data, finds the patterns in it, and builds models that make predictions. It's the best place to start if you're new, and it's the group for members who want to compete on Kaggle.",
        "make_short": "Charts, prediction models, Kaggle entries",
        "level": "None",
        "make": [
            "Charts that answer a question about a dataset",
            "A model that predicts who survived the Titanic",
            "A Kaggle competition entry with your team",
            "An analysis of a dataset you pick, presented to the club",
        ],
        "experience": "None. The fall Foundations sessions start from the first line of Python.",
        "planned": [
            "A second Kaggle competition, with teams formed in October",
            "A project using data from our own school or town",
            "A shared chart style for club presentations",
        ],
        "past": [
            ("Nov 18, 2025", "Workshop on seaborn, data cleaning, train and test splits, scikit-learn, and model evaluation.",
             [("Slides", "deck:python-2")]),
            ("Nov 4, 2025", "Titanic survival prediction on Kaggle, entered in teams.",
             [("Project page", "projects.html#titanic"), ("Kaggle competition", "https://www.kaggle.com/competitions/titanic")]),
            ("Nov 4, 2025", "Python basics, useful libraries, and data preprocessing.",
             [("Slides", "deck:getting-started"), ("Preprocessing notebook", "https://github.com/helenc3/demo_notebooks/blob/main/Data_preprocessing.ipynb")]),
            ("Spring 2025", "pandas lessons, followed by member projects and presentations.", []),
        ],
        "stages": ["data", "classical-ml"],
        "related": ["neural-networks", "society", "vision"],
    },
    {
        "key": "vision",
        "slug": "vision.html",
        "name": "Computer Vision",
        "sub": "",
        "first": False,
        "line": "Train models that recognize what's in a photo or a video.",
        "desc": "Computer vision is about getting a program to understand pictures. Members train models that tell digits, clothes, or hand gestures apart, then test them on photos the model has never seen to find where it breaks.",
        "make_short": "Image classifiers, webcam demos",
        "level": "A little Python",
        "make": [
            "An image classifier trained in your browser in one meeting",
            "A convolutional neural network in Keras that reads handwritten digits",
            "A model trained on photos you take and label yourself",
            "A webcam demo that runs your model live",
        ],
        "experience": "A little Python. If you've used a notebook in the fall sessions, you're ready.",
        "planned": [
            "A group project on photos that members take and label",
            "Transfer learning: reusing a large pretrained model on a small dataset",
            "A short report on where our best model fails, and why",
        ],
        "past": [
            ("Mar 3, 2026", "Computer vision workshop. Members trained image classifiers with Teachable Machine. The take-home challenge added pose and sound models.",
             [("Slides", "deck:vision"), ("Project page", "projects.html#teachable-machine")]),
            ("Dec 2, 2025", "Built a convolutional network for MNIST in Keras, then tried the same idea on Fashion-MNIST and CIFAR-10.",
             [("Project page", "projects.html#image-classifiers"), ("Notebook", "https://github.com/helenc3/demo_notebooks/blob/main/mnistdemo.ipynb")]),
        ],
        "stages": ["vision", "deep-learning"],
        "related": ["neural-networks", "data-science", "nlp"],
    },
    {
        "key": "nlp",
        "slug": "nlp.html",
        "name": "Natural Language Processing",
        "sub": "",
        "first": False,
        "line": "Build programs that read, sort, and write text, from spam filters to chatbots.",
        "desc": "This group works with language: programs that read a review and decide if it's positive, find the topic of an article, or answer questions. We start with simple word-counting methods you can check by hand, then move up to the transformer models behind today's chatbots.",
        "make_short": "Text classifiers, similarity search, small chatbots",
        "level": "Some Python",
        "make": [
            "A spam or sentiment classifier trained on text you collect",
            "A tool that turns sentences into vectors and finds the most similar ones",
            "A small chatbot or question-answering app built on an open model",
            "A fair test for comparing two language models on the same task",
        ],
        "experience": "Basic Python: functions, lists, and dictionaries. The fall Foundations sessions cover all of it.",
        "planned": [
            "A text classifier trained on a dataset the group collects",
            "Reading the original transformer paper together over two meetings",
            "Comparing open language models on one shared task",
        ],
        "past": [
            ("Apr 21, 2026", "Intro to NLP workshop. The follow-up assignment was to write and upload a short NLP program.",
             [("Slides", "deck:nlp")]),
            ("Jan 6, 2026", "Large language models session, which kicked off the Analyzing AI Models project.",
             [("Slides", "deck:llm-2026")]),
            ("Feb 18, 2025", "Presentation on how large language models work.",
             [("Slides", "deck:llm-2025")]),
        ],
        "stages": ["nlp-llm"],
        "related": ["agents", "neural-networks", "society"],
    },
    {
        "key": "neural-networks",
        "slug": "neural-networks.html",
        "name": "Neural Networks",
        "sub": "How they learn, and the math behind them",
        "first": False,
        "line": "Open up a neural network, build one from scratch, and learn the math that makes it work.",
        "desc": "This group looks at how neural networks work on the inside. You'll build a small network from scratch, watch it learn, and pick up the algebra and calculus that explain why it works. The subject is artificial neural networks, not neuroscience.",
        "make_short": "A network from scratch, training experiments",
        "level": "Algebra II",
        "make": [
            "A neural network written from scratch in NumPy",
            "A plot of a network's loss going down as it trains",
            "An experiment comparing optimizers such as SGD and Adam",
            "Short notes that explain backpropagation to next year's members",
        ],
        "experience": "Algebra II. We teach the calculus as it comes up.",
        "planned": [
            "A two-layer network in NumPy, with every gradient checked by hand",
            "An optimizer comparison on a single dataset",
            "A member-written set of math notes",
        ],
        "past": [
            ("Dec 2, 2025", "Introduction to deep learning, neural networks, and convolutional networks.",
             [("Notebook", "https://github.com/helenc3/demo_notebooks/blob/main/mnistdemo.ipynb")]),
            ("2023 and 2024", "Neural network lessons, introduced with Google's Quick, Draw! game.",
             [("Quick, Draw!", "https://quickdraw.withgoogle.com/")]),
        ],
        "stages": ["deep-learning"],
        "related": ["vision", "nlp", "agents"],
    },
    {
        "key": "agents",
        "slug": "agents.html",
        "name": "Agents and Reinforcement Learning",
        "sub": "Trial-and-error learning, and assistants that use tools",
        "first": False,
        "line": "Make programs that learn by trial and error, and AI assistants that can use tools.",
        "desc": "This group covers two related topics. Reinforcement learning is how a program learns by trial and error, the way game-playing AIs do. Agents are language models that can take actions, such as searching the web or running code, to finish a task.",
        "make_short": "Game-playing agents, tool-using assistants",
        "level": "Confident Python",
        "make": [
            "A program that learns to solve a maze through trial and error",
            "A game-playing agent trained in Gymnasium",
            "An AI assistant that uses tools such as search or a calculator",
            "A set of test tasks that checks if an agent really finishes the job",
        ],
        "experience": "You should be comfortable writing and debugging Python on your own.",
        "planned": [
            "A gridworld Q-learning lab",
            "A small assistant that uses tools, with a log of where it gets stuck",
            "A fixed set of tasks for comparing two agent designs",
        ],
        "past": [
            ("Mar 17, 2026", "An officer shared the agentic AI sections of NVIDIA's GTC 2026 keynote on Classroom as optional viewing.",
             [("Keynote video", "https://www.youtube.com/watch?v=jw_o0xr8MWU")]),
        ],
        "stages": ["agents-rl"],
        "related": ["nlp", "neural-networks", "society"],
    },
    {
        "key": "society",
        "slug": "society.html",
        "name": "AI, Ethics and Society",
        "sub": "",
        "first": False,
        "line": "Test models for fairness, study privacy and safety, and debate how AI should be used.",
        "desc": "AI systems make decisions that affect people, and they don't always get them right. This group tests models for fairness, studies privacy and safety, writes the documentation that should come with a model, and discusses how AI is changing school, work, and society.",
        "make_short": "Fairness checks, model cards, discussions",
        "level": "None",
        "make": [
            "A fairness check of a model built by another group",
            "A one-page model card that says what a model can and can't do",
            "A discussion or debate that you plan and lead",
            "An AI safety reading group, using the plan on our Resources page",
        ],
        "experience": "None. Writing and discussion matter as much as code here.",
        "planned": [
            "A model card for every project presented this year",
            "An error breakdown of the vision group's best classifier",
            "A six-session AI safety reading group",
        ],
        "past": [
            ("Nov 12, 2024", "Moral Machine activity and discussion about automated decisions.",
             [("Moral Machine", "https://www.moralmachine.net/")]),
            ("Oct 17, 2023", "Rob Seater and Kimberlee Chang of MIT Lincoln Laboratory answered member questions about AI research and ethics.", []),
        ],
        "stages": ["safety"],
        "related": ["nlp", "data-science", "agents"],
    },
]

GROUP_BY_KEY = {g["key"]: g for g in GROUPS}

# ---------------------------------------------------------------- people

TEAM = [
    ("Aarav Dey", "Co-President"),
    ("Henna Patel", "Co-President"),
    ("Maushmi Miraj", "Co-President"),
    ("Maahi Mehta", "Co-Vice President"),
    ("Shriyan Kumar", "Co-Vice President"),
    ("Ishan Sarda", "Secretary"),
    ("Jia Arora", "Junior Officer"),
]

PAST_OFFICERS = [
    ("2025-26", "<strong>Eric Zou</strong>, President. <strong>Helen Chen</strong> and <strong>Henna Patel</strong>, Co-Vice Presidents. <strong>Maushmi Miraj</strong>, Secretary. <strong>Aarav Dey</strong>, Treasurer. <strong>Syam Paladugu</strong> and <strong>Jia Arora</strong>, Junior Officers."),
    ("2024-25", "<strong>Atin Mathur</strong>, President. <strong>Eric Zou</strong>, Vice President. <strong>Simran Cheema</strong>, Secretary. <strong>Prajwal Bhat</strong> and <strong>Vivek Raghuram</strong>, Co-Treasurers."),
    ("2023-24", "<strong>Mahitha Thippireddy</strong>, President. <strong>Saumya Muthukumar</strong>, Vice President. <strong>Nimai Ponna</strong>, Secretary. <strong>Akshay Sharma</strong>, Treasurer. <strong>Eric Zou</strong>, Junior Officer."),
    ("2022-23", "Founding year, led by <strong>Mahitha Thippireddy</strong>, <strong>Saumya Muthukumar</strong>, and <strong>Ramya Gouraiah</strong>."),
]

SPEAKERS = [
    ("Oct 17, 2023", "Rob Seater and Kimberlee Chang, MIT Lincoln Laboratory",
     "Talked about AI research at Lincoln Laboratory and answered member questions about AI ethics."),
    ("Mar 7, 2023", "Prof. Xhakaj, Carnegie Mellon University",
     "Presented recent research projects and took questions that members sent in ahead of time."),
]

# ---------------------------------------------------------------- projects

FEATURED = [
    {
        "id": "titanic",
        "title": "Titanic survival prediction",
        "when": "November 2025",
        "group": "data-science",
        "credit": "Entered by member teams. Starter notebook from Helen Chen's demo repository.",
        "text": "Teams cleaned the passenger data, chose which details to feed the model, trained classifiers with scikit-learn, and submitted predictions to Kaggle's public leaderboard. The chart shows the strongest pattern in the training data: women survived far more often than men, and passengers in first class more often than those in third.",
        "figure": "titanic",
        "caption": "Survival rates in the 891-passenger training set that teams worked with.",
        "links": [("Kaggle competition", "https://www.kaggle.com/competitions/titanic"),
                  ("Preprocessing notebook", "https://github.com/helenc3/demo_notebooks/blob/main/Data_preprocessing.ipynb")],
        "note": "",
    },
    {
        "id": "image-classifiers",
        "title": "Image classifiers, from digits to clothes to photos",
        "when": "December 2025",
        "group": "vision",
        "credit": "Built by members from a shared starter notebook in Helen Chen's demo repository.",
        "text": "Members built a convolutional neural network in Keras that reads handwritten digits from MNIST. Then they tried the same approach on two harder datasets, Fashion-MNIST and CIFAR-10, and changed the architecture to see what helped. The same network was less accurate on clothing and photos than on digits.",
        "figure": "img:mnist-fashion-samples.png",
        "alt": "Sample images: two rows of handwritten digits zero through nine from MNIST, and two rows of clothing items from Fashion-MNIST.",
        "caption": "Samples from MNIST (top) and Fashion-MNIST (bottom), two of the datasets members trained on.",
        "links": [("Starter notebook", "https://github.com/helenc3/demo_notebooks/blob/main/mnistdemo.ipynb"),
                  ("Keras datasets", "https://keras.io/api/datasets/")],
        "note": "",
    },
    {
        "id": "teachable-machine",
        "title": "Teachable Machine models",
        "when": "March 2026",
        "group": "vision",
        "credit": "Built by members at and after the March 3 workshop, alone or with a partner.",
        "text": "Members trained image classifiers in the browser with Teachable Machine. The take-home challenge was to find the most creative use of it, using images, body poses, or sound, alone or with a partner.",
        "figure": "slot:teachable-machine",
        "caption": "",
        "links": [("Workshop slides", "deck:vision"), ("Teachable Machine", "https://teachablemachine.withgoogle.com/")],
        "note": "Member models were turned in on Google Classroom and aren't public.",
    },
    {
        "id": "ai-hub",
        "title": "AI Hub",
        "when": "April 2025",
        "group": "",
        "credit": "Built by Aarav Dey.",
        "text": "A website that gathers the club's resources in one place. It was used in meetings during the spring 2025 AI Hub project, where members researched a topic and presented what they found.",
        "figure": "slot:ai-hub",
        "caption": "",
        "links": [],
        "note": "",
    },
]

SESSIONS = [
    ("Apr 21, 2026", "Intro to natural language processing", "Workshop, followed by members writing their own short NLP programs.", [("Slides", "deck:nlp")]),
    ("Mar 17, 2026", "Python coding session", "Hands-on Python practice.", [("Slides", "deck:python-3")]),
    ("Mar 3, 2026", "Intro to computer vision", "Teachable Machine workshop.", [("Slides", "deck:vision")]),
    ("Jan 6, 2026", "Large language models", "How LLMs work, and the start of the Analyzing AI Models project.", [("Slides", "deck:llm-2026")]),
    ("Dec 2, 2025", "Deep learning and convolutional networks", "Lecture and MNIST demo.", [("Notebook", "https://github.com/helenc3/demo_notebooks/blob/main/mnistdemo.ipynb")]),
    ("Nov 18, 2025", "Python for data science", "seaborn, data cleaning, scikit-learn, and model evaluation.", [("Slides", "deck:python-2")]),
    ("Nov 4, 2025", "Getting started with machine learning", "Python basics, preprocessing, and traditional models.", [("Slides", "deck:getting-started")]),
    ("Oct 21, 2025", "What is AI?", "First meeting of the year, with games and an intro to the club.", [("Slides", "deck:intro-2025")]),
    ("Feb 18, 2025", "Large language models", "Presentation, then project work time.", [("Slides", "deck:llm-2025")]),
    ("Nov 12, 2024", "Moral Machine", "Activity and discussion on automated decisions.", [("Moral Machine", "https://www.moralmachine.net/")]),
]

# ---------------------------------------------------------------- news

NEWS = [
    {"id": "signups-2026", "date": "September 21, 2026", "iso": "2026-09-21",
     "title": "Sign-ups are open for " + YEAR,
     "body": "New members can join at any meeting. Send the form on the Join page, or join our Google Classroom with code " + SITE["code"] + ". The date of the first meeting will be posted here and on Classroom.",
     "link": ("Join SAIL", "join.html")},
    {"id": "officers-2026", "date": "June 2, 2026", "iso": "2026-06-02",
     "title": "Officers announced for " + YEAR,
     "body": "Aarav Dey, Henna Patel, and Maushmi Miraj are co-presidents. Maahi Mehta and Shriyan Kumar are co-vice presidents, Ishan Sarda is secretary, and Jia Arora is junior officer.",
     "link": ("Meet the team", "people.html")},
    {"id": "vision-workshop", "date": "March 3, 2026", "iso": "2026-03-03",
     "title": "Computer vision workshop",
     "body": "Members trained image classifiers in the browser with Teachable Machine, then took home a challenge to find its most creative use.",
     "link": ("See the Teachable Machine project", "projects.html#teachable-machine")},
    {"id": "titanic", "date": "November 4, 2025", "iso": "2025-11-04",
     "title": "Teams enter the Titanic competition on Kaggle",
     "body": "Members formed teams and submitted survival predictions to the public leaderboard, with prizes for the top scores.",
     "link": ("See the Titanic project", "projects.html#titanic")},
    {"id": "ai-hub", "date": "April 8, 2025", "iso": "2025-04-08",
     "title": "AI Hub launches",
     "body": "A member-built website that collects the club's resources in one place.",
     "link": ("See the AI Hub project", "projects.html#ai-hub")},
    {"id": "mit-ll", "date": "October 17, 2023", "iso": "2023-10-17",
     "title": "Researchers from MIT Lincoln Laboratory visit",
     "body": "Rob Seater and Kimberlee Chang spoke with members about AI research and ethics.",
     "link": None},
    {"id": "cmu", "date": "March 7, 2023", "iso": "2023-03-07",
     "title": "Guest lecture from Carnegie Mellon",
     "body": "Prof. Xhakaj of Carnegie Mellon University presented recent research and answered member questions.",
     "link": None},
    {"id": "first-meeting", "date": "September 27, 2022", "iso": "2022-09-27",
     "title": "First meeting",
     "body": "The club held its first interest meeting in Room 700B and started with Python basics.",
     "link": None},
]

NAV = [("research.html", "Research"), ("projects.html", "Projects"), ("people.html", "People"),
       ("resources.html", "Resources"), ("news.html", "News")]

DECK_BY_KEY = {d["key"]: d for d in DECKS}


# ---------------------------------------------------------------- helpers

def link(label, target):
    """Render a link. 'deck:key' targets resolve to a club slide deck."""
    if target.startswith("deck:"):
        d = DECK_BY_KEY[target[5:]]
        note = "" if d["access"] == "public" else ' <span class="meta">(school account)</span>'
        return f'<a href="{d["url"]}">{label}</a>{note}'
    ext = ' rel="noopener"' if target.startswith("http") else ""
    return f'<a href="{target}"{ext}>{label}</a>'


def linkrow(links):
    if not links:
        return ""
    return '<p class="linkrow">' + "".join(f"<span>{link(a, b)}</span>" for a, b in links) + "</p>"


def titanic_chart():
    data = [("First class", 96.8, 36.9), ("Second class", 92.1, 15.7), ("Third class", 50.0, 13.5)]
    x0, scale, bar, gap, between = 104, 3.7, 17, 3, 22
    top = 10
    plot_h = len(data) * (2 * bar + gap) + (len(data) - 1) * between
    bottom = top + plot_h + 10
    parts = []
    for v in (0, 25, 50, 75, 100):
        x = x0 + v * scale
        parts.append(f'<line class="grid" x1="{x:.1f}" y1="{top - 4}" x2="{x:.1f}" y2="{bottom}"/>')
        parts.append(f'<text x="{x:.1f}" y="{bottom + 18}" text-anchor="middle">{v}%</text>')
    y = top
    for label, women, men in data:
        parts.append(f'<text class="grp" x="{x0 - 12}" y="{y + bar + 6}" text-anchor="end">{label}</text>')
        for val, color, who in ((women, "#1f5fae", "Women"), (men, "#b4532a", "Men")):
            w = val * scale
            path = f"M{x0},{y} h{w - 4:.1f} a4,4 0 0 1 4,4 v{bar - 8} a4,4 0 0 1 -4,4 h-{w - 4:.1f} z"
            parts.append(
                f'<g class="b"><title>{who}, {label.lower()}: {val}% survived</title>'
                f'<path class="bar" d="{path}" fill="{color}"/>'
                f'<text class="val" x="{x0 + w + 7:.1f}" y="{y + bar - 4}">{val:g}%</text></g>'
            )
            y += bar + gap
        y += between - gap
    svg = (f'<svg class="chart" viewBox="0 0 540 {bottom + 26}" role="img" '
           f'aria-label="Bar chart of Titanic survival rates by sex and ticket class. Women: 96.8 percent in first class, '
           f'92.1 in second, 50 in third. Men: 36.9 percent in first class, 15.7 in second, 13.5 in third.">'
           + "".join(parts) + "</svg>")
    legend = ('<div class="chart-legend"><span><i style="background:#1f5fae"></i>Women</span>'
              '<span><i style="background:#b4532a"></i>Men</span></div>')
    return f'<div class="pad">{legend}{svg}</div>'


MISSING_IMAGES = []


def figure_html(item):
    fig = item.get("figure", "")
    cap = f'<figcaption>{item["caption"]}</figcaption>' if item.get("caption") else ""
    if fig == "titanic":
        return f"<figure>{titanic_chart()}{cap}</figure>"
    if fig.startswith("img:"):
        return f'<figure><img src="assets/img/{fig[4:]}" alt="{item.get("alt", "")}" loading="lazy" width="912" height="374">{cap}</figure>'
    if fig.startswith("slot:"):
        for ext in ("jpg", "png", "webp"):
            name = f"{fig[5:]}.{ext}"
            if os.path.exists(os.path.join(HERE, "assets", "img", name)):
                return f'<figure><img src="assets/img/{name}" alt="{item.get("alt", item["title"])}" loading="lazy">{cap}</figure>'
        MISSING_IMAGES.append(fig[5:])
    return ""


# ---------------------------------------------------------------- templates

def head(title, desc):
    full = SITE["name"] if title == "Home" else f'{title} | {SITE["short"]}'
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{full}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{full}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
'''


def masthead(active):
    links = []
    for href, label in NAV:
        key = href.replace(".html", "")
        if label == "Research":
            items = "".join(f'<li><a href="{g["slug"]}">{g["name"]}</a></li>' for g in GROUPS)
            on = " on" if active in ("research", "group") else ""
            links.append(
                f'<div class="navgroup{on}" data-navgroup><button type="button" aria-expanded="false" aria-controls="nav-research">Research '
                f'<svg viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.8"/></svg>'
                f'</button><ul id="nav-research"><li><a href="research.html">Compare all groups</a></li>{items}</ul></div>'
            )
        else:
            cur = ' aria-current="page"' if active == key else ""
            links.append(f'<a{cur} href="{href}">{label}</a>')
    nav_html = "\n      ".join(links)
    drawer_groups = "".join(f'<a href="{g["slug"]}">{g["name"]}</a>' for g in GROUPS)

    return f'''<header class="masthead">
  <div class="wrap masthead-in">
    <a class="brand" href="index.html"><b>{SITE["short"]}</b><span>{SITE["school"]}</span></a>
    <nav class="mainnav" aria-label="Main">
      {nav_html}
    </nav>
    <a class="btn btn--light btn--sm mast-join" href="join.html">Join</a>
    <button class="navtoggle" type="button" data-navtoggle aria-label="Menu" aria-expanded="false">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
  </div>
  <nav class="drawer" data-drawer aria-label="Mobile">
    <div class="wrap">
      <a href="index.html">Home</a>
      <details><summary>Research</summary><a href="research.html">Compare all groups</a>{drawer_groups}</details>
      <a href="projects.html">Projects</a>
      <a href="people.html">People</a>
      <a href="resources.html">Resources</a>
      <a href="news.html">News</a>
      <a href="join.html">Join SAIL</a>
    </div>
  </nav>
</header>
<main id="main">
'''


def pagetop(crumbs, title, lede, sub=""):
    trail = " / ".join([f'<a href="index.html">Home</a>'] + crumbs)
    sub_html = f'<p class="sub">{sub}</p>' if sub else ""
    return f'''<section class="pagetop">
  <div class="wrap">
    <p class="crumb">{trail}</p>
    <h1>{title}</h1>
    {sub_html}<p class="lede">{lede}</p>
  </div>
</section>
'''


def footer():
    return f'''</main>
<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <p class="foot-name">{SITE["name"]}</p>
        <p>The AI and machine learning club at {SITE["school"]}. {SITE["meets_short"]}, {SITE["room"]}.</p>
      </div>
      <div>
        <h2>Explore</h2>
        <ul>
          <li><a href="research.html">Research groups</a></li>
          <li><a href="projects.html">Projects</a></li>
          <li><a href="resources.html">Resources</a></li>
          <li><a href="people.html">People</a></li>
          <li><a href="news.html">News</a></li>
        </ul>
      </div>
      <div>
        <h2>Get in touch</h2>
        <ul>
          <li><a href="join.html">Join SAIL</a></li>
          <li><a href="#" data-email>Email us</a></li>
          <li><a href="https://www.instagram.com/{SITE["instagram"]}/" rel="noopener">Instagram</a></li>
          <li>Google Classroom: {SITE["code"]}</li>
        </ul>
      </div>
    </div>
    <p class="foot-bot">&copy; <span data-year>2026</span> {SITE["name"]}. Run by students.</p>
  </div>
</footer>
<script src="assets/js/site.js"></script>
</body>
</html>
'''


def tracks_block():
    return '''<div class="tracks">
      <div class="track">
        <h3>Foundations Program</h3>
        <p class="who">For anyone new to AI or coding</p>
        <p>Learn Python, work with real data, enter a Kaggle competition with a team, and train your first neural network by December. In the spring you build a project of your own.</p>
        <p>Most ninth and tenth graders start here. So do juniors and seniors who haven't programmed before.</p>
        <a class="more" href="join.html#tracks">How Foundations works</a>
      </div>
      <div class="track">
        <h3>Applied Research Division</h3>
        <p class="who">For members ready to run their own project</p>
        <p>Work in a team of two to four on a project you choose, with one of our six research groups behind you. Teams present what they built at the end of each semester.</p>
        <p>Mostly juniors and seniors, plus anyone who has finished Foundations or built something before.</p>
        <a class="more" href="join.html#tracks">How the division works</a>
      </div>
    </div>'''


# ---------------------------------------------------------------- pages

def page_index():
    groups = "\n      ".join(
        f'<li><h3><a href="{g["slug"]}">{g["name"]}</a>{" <span class=\"badge\">Start here</span>" if g["first"] else ""}</h3><p>{g["line"]}</p></li>'
        for g in GROUPS
    )
    feats = "\n      ".join(
        f'''<article class="feature">
        {figure_html(f)}
        <h3>{f["title"]}</h3>
        <p>{f["text"].split(". ")[0]}.</p>
        <a class="more" href="projects.html#{f["id"]}" aria-label="Read more about {f["title"]}">Read more</a>
      </article>''' for f in FEATURED[:2]
    )
    news = "\n      ".join(
        f'''<li><time datetime="{n["iso"]}">{n["date"]}</time>
        <div><h3><a href="news.html#{n["id"]}">{n["title"]}</a></h3><p>{n["body"]}</p></div></li>'''
        for n in NEWS[:2]
    )
    return f'''<section class="hero" data-hero>
  <canvas data-field aria-hidden="true"></canvas>
  <div class="wrap hero-in">
    <h1>{SITE["name"]}</h1>
    <p class="hero-sub">We're students at {SITE["school"]} who learn how AI works and build our own projects with it.</p>
    <div class="hero-actions">
      <a class="btn btn--light" href="join.html">Join SAIL</a>
      <a class="textlink" href="projects.html">Explore our work</a>
    </div>
    <p class="hero-when">{SITE["meets"]} &middot; {SITE["room"]}</p>
  </div>
  <div class="wrap hero-tools">
    <details class="hero-about">
      <summary>About this animation</summary>
      <p>A few hundred particles drift through a vector field that changes slowly over time, and their trails trace out its streamlines. Move your pointer to bend the field and watch it settle back. Click to send a ripple through it.</p>
    </details>
    <button type="button" data-pause>Pause animation</button>
  </div>
</section>

<section class="section center">
  <div class="narrow about">
    <h2>About SAIL</h2>
    <p>SAIL is {SITE["school"]}'s AI and machine learning club. We started in 2022 with after-school Python lessons. Now members teach each other Python and machine learning, and then build projects of their own.</p>
    <p>You don't need any experience to join. Everything we use is free and runs in a browser, and the slides and notebooks from every meeting are posted for anyone who misses one.</p>
  </div>
  <div class="wrap">
    <dl class="facts">
      <div><dt>When</dt><dd>{SITE["meets_short"]}</dd></div>
      <div><dt>Where</dt><dd>{SITE["room"]}</dd></div>
      <div><dt>Cost</dt><dd>Free</dd></div>
      <div><dt>Google Classroom</dt><dd>{SITE["code"]}</dd></div>
    </dl>
  </div>
</section>

<section class="section section--soft center">
  <div class="wrap">
    <div class="section-head">
      <h2>Two ways to join</h2>
      <p>Pick the one that fits where you are now. You can move from the first to the second whenever you're ready.</p>
    </div>
    {tracks_block()}
  </div>
</section>

<section class="section center">
  <div class="wrap">
    <div class="section-head">
      <h2>Research groups</h2>
      <p>Six groups, each focused on one area of AI. <a href="research.html">Compare them side by side.</a></p>
    </div>
    <ul class="groups">
      {groups}
    </ul>
  </div>
</section>

<section class="section section--soft center">
  <div class="wrap">
    <div class="section-head">
      <h2>What members have built</h2>
    </div>
    <div class="features">
      {feats}
    </div>
    <p style="margin:34px 0 0"><a class="btn btn--ghost" href="projects.html">See all projects</a></p>
  </div>
</section>

<section class="section">
  <div class="narrow">
    <div class="section-head center">
      <h2>Latest</h2>
    </div>
    <ul class="ann">
      {news}
    </ul>
    <p class="center" style="margin:26px 0 0"><a class="more" href="news.html">All news</a></p>
  </div>
</section>
'''


def page_research():
    rows = "\n        ".join(
        f'''<tr>
          <th scope="row"><a href="{g["slug"]}">{g["name"]}</a>{" <span class=\"badge\">Start here</span>" if g["first"] else ""}</th>
          <td data-l="What members make">{g["make_short"]}</td>
          <td data-l="Experience needed">{g["level"]}</td>
        </tr>''' for g in GROUPS
    )
    speakers = "\n      ".join(
        f'<li><span class="when">{w}</span><div><h3>{who}</h3><p>{d}</p></div></li>' for w, who, d in SPEAKERS
    )
    return pagetop(["Research"], "Research groups",
                   "Each group focuses on one area of AI. Use this page to compare them, then open a group to see what its members make."
                   ) + f'''<section class="section">
  <div class="wrap">
    <table class="compare">
      <thead><tr><th scope="col">Group</th><th scope="col">What members make</th><th scope="col">Experience needed</th></tr></thead>
      <tbody>
        {rows}
      </tbody>
    </table>
  </div>
</section>

<section class="section section--soft">
  <div class="wrap split">
    <div class="prose">
      <h2>How groups work</h2>
      <p>The groups are new for {YEAR}. Past sessions listed on a group page were whole-club meetings on that topic.</p>
      <p>You can name a group when you sign up, and you can switch whenever you like. Applied Research teams work with their group from October. Foundations members join their group's activities in the second semester, once the fall sessions have covered the basics.</p>
      <h2>Project requirements</h2>
      <p>Every Applied Research project finishes with the same four things.</p>
      <ul class="checks">
        <li>Share your code with setup instructions.</li>
        <li>Choose how you will evaluate the project before running experiments.</li>
        <li>Summarize your results and limitations in a one-page report.</li>
        <li>Present your work in ten minutes and answer questions.</li>
      </ul>
      <p><a class="more" href="resources.html#build">Project template and tools</a></p>
    </div>
    <aside class="side">
      <h2>Not sure which group?</h2>
      <p class="small" style="color:var(--ink-2)">Start with Applied Data Science. It covers the skills every other group builds on, and you can move later.</p>
      <a class="btn btn--sm" href="data-science.html">See Applied Data Science</a>
    </aside>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>Guest speakers</h2></div>
    <ul class="dated">
      {speakers}
    </ul>
  </div>
</section>
'''


def page_group(g):
    make = "".join(f"<li>{m}</li>" for m in g["make"])
    planned = "".join(f"<li>{p}</li>" for p in g["planned"])
    past = "\n        ".join(
        f'<li><span class="when">{w}</span><div><p>{t}</p>{linkrow(links)}</div></li>' for w, t, links in g["past"]
    )
    res_items = []
    for key in g["stages"]:
        if key == "safety":
            res_items.extend(next(b for b in BUILD_SECTION if b["key"] == "responsible")["items"])
            res_items.extend(s["items"][0] for s in SAFETY[1:3])
            continue
        stage = next(s for s in STAGES if s["key"] == key)
        res_items.extend(stage["items"][:5 if len(g["stages"]) == 1 else 3])
    res = "\n        ".join(
        f'<li><div><a class="t" href="{it["url"]}" rel="noopener">{it["title"]}</a>'
        f'<span class="m">{it["kind"]}{", " + it["time"] if it.get("time") else ""}</span><p>{it["note"]}</p></div></li>'
        for it in res_items
    )
    anchor = "safety" if "safety" in g["stages"] else "planner"
    related = "".join(f'<li><a href="{GROUP_BY_KEY[k]["slug"]}">{GROUP_BY_KEY[k]["name"]}</a></li>' for k in g["related"])
    first = '<p><span class="badge" style="margin-left:0">Good first group</span></p>' if g["first"] else ""

    return pagetop(['<a href="research.html">Research</a>'], g["name"], g["desc"], g["sub"]) + f'''<section class="section">
  <div class="wrap split">
    <div class="prose">
      {first}
      <h2>What you'll learn and build</h2>
      <ul class="checks">{make}</ul>

      <h2>Experience needed</h2>
      <p>{g["experience"]}</p>

      <h2>This year</h2>
      <div class="planned">
        <span class="tag">Planned for {YEAR}</span>
        <ul>{planned}</ul>
      </div>

      <h2>Past sessions and work</h2>
      <ul class="dated">
        {past}
      </ul>

      <h2>Learning resources</h2>
      <ul class="res res--plain">
        {res}
      </ul>
      <p><a class="more" href="resources.html#{anchor}">Full learning plan on Resources</a></p>
    </div>
    <aside class="side">
      <h2>Join this group</h2>
      <p class="small" style="color:var(--ink-2)">Tell us you're interested when you sign up. You can change groups at any time.</p>
      <a class="btn" href="join.html#join-{g["key"]}">Express interest</a>
      <hr>
      <dl>
        <dt>Meetings</dt><dd>{SITE["meets_short"]}, {SITE["room"]}</dd>
        <dt>Group lead</dt><dd>To be named in October</dd>
      </dl>
      <hr>
      <h2>Related groups</h2>
      <ul>{related}</ul>
    </aside>
  </div>
</section>
'''


def page_projects():
    feats = []
    for f in FEATURED:
        fig = figure_html(f)
        cls = "feature" if fig else "feature noimg"
        grp = ""
        if f["group"]:
            gg = GROUP_BY_KEY[f["group"]]
            grp = f' &middot; <a href="{gg["slug"]}">{gg["name"]}</a>'
        note = f'<p class="meta">{f["note"]}</p>' if f["note"] else ""
        feats.append(f'''<article class="{cls}" id="{f["id"]}">
        <div>
          <h3>{f["title"]}</h3>
          <p class="credit">{f["when"]}{grp}<br>{f["credit"]}</p>
          <p>{f["text"]}</p>
          {linkrow(f["links"])}
          {note}
        </div>
        {fig}
      </article>''')
    sessions = "\n      ".join(
        f'<li><span class="when">{w}</span><div><h3>{t}</h3><p>{d}</p>{linkrow(links)}</div></li>'
        for w, t, d, links in SESSIONS
    )
    return pagetop(["Projects"], "Projects",
                   "Projects and activities by SAIL members. Featured projects come first, followed by an archive of workshops."
                   ) + f'''<section class="section">
  <div class="wrap showcase">
    <div class="section-head"><h2>Featured projects</h2></div>
    {"".join(feats)}
  </div>
</section>

<section class="section section--soft">
  <div class="wrap">
    <div class="section-head">
      <h2>Workshops and sessions</h2>
      <p>Slides and notebooks from past meetings. Some slide decks only open with a school account.</p>
    </div>
    <ul class="dated">
      {sessions}
    </ul>
  </div>
</section>

<section class="section">
  <div class="narrow">
    <h2>Learning activities</h2>
    <p style="color:var(--ink-2)">Members also work through Kaggle's free Python and machine learning courses during meetings, with officers on hand for questions. The courses we use are in the <a href="resources.html#planner">learning planner</a>.</p>
  </div>
</section>
'''


def page_people():
    team = "\n      ".join(f'<li><span class="name">{n}</span><span class="role">{r}</span></li>' for n, r in TEAM)
    past = "\n      ".join(f'<li><strong>{y}</strong><span>{w}</span></li>' for y, w in PAST_OFFICERS)
    return pagetop(["People"], "People", f"The officers who run SAIL in {YEAR}.") + f'''<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>{YEAR} officers</h2></div>
    <ul class="team">
      {team}
    </ul>
  </div>
</section>

<section class="section section--soft">
  <div class="narrow">
    <h2>Becoming an officer</h2>
    <p style="color:var(--ink-2)">Officer applications open in April and close in May, and the new team is announced at the last meeting of the year. Any member can apply. Each research group also gets a group lead, named in October.</p>
  </div>
</section>

<section class="section">
  <div class="narrow">
    <h2>Past officers</h2>
    <ul class="past">
      {past}
    </ul>
  </div>
</section>
'''


def res_list(items, prefix, checkable=True):
    out = []
    for i, it in enumerate(items):
        rid = f'{prefix}-{i}'
        meta = it["kind"] + (", " + it["time"] if it.get("time") else "")
        box = f'<input type="checkbox" data-res="{rid}" aria-label="Mark {it["title"]} as done">' if checkable else ""
        out.append(
            f'<li>{box}<div><a class="t" href="{it["url"]}" rel="noopener">{it["title"]}</a>'
            f'<span class="m">{meta}</span><p>{it["note"]}</p></div></li>'
        )
    return "\n          ".join(out)


def page_resources():
    plan_rows = "\n        ".join(
        f'''<tr><td>{p["when"]}</td><td data-l="What we cover"><strong>{p["title"]}</strong><br>{p["text"]}{linkrow(p["links"])}</td></tr>'''
        for p in PLAN
    )
    stages = []
    for n, s in enumerate(STAGES, 1):
        stages.append(f'''<details class="stage" data-stage id="stage-{s["key"]}"{" open" if n == 1 else ""}>
        <summary><span class="num">{n}</span><span class="st-title">{s["title"]}</span><span class="st-count" data-stage-count></span><span class="st-goal">{s["goal"]}</span></summary>
        <div class="body">
          <ul class="res">
          {res_list(s["items"], s["key"])}
          </ul>
          <p class="try"><b>Try it:</b> {s["try"]}</p>
        </div>
      </details>''')
    safety = []
    for n, s in enumerate(SAFETY, 1):
        safety.append(f'''<div class="session">
        <h3>Session {n}: {s["title"]}</h3>
        <p class="q">{s["question"]}</p>
        <ul class="res res--plain">
          {res_list(s["items"], "safety-" + str(n), checkable=False)}
        </ul>
      </div>''')
    build_blocks = []
    for b in BUILD_SECTION:
        build_blocks.append(f'''<h3>{b["title"]}</h3>
      <p style="color:var(--ink-2)">{b["intro"]}</p>
      <ul class="res res--plain">
        {res_list(b["items"], "build-" + b["key"], checkable=False)}
      </ul>''')
    programs = res_list(PROGRAMS, "prog", checkable=False)
    decks = "\n        ".join(
        f'<li><span class="when">{d["date"]}</span><div><p>{link(d["title"], "deck:" + d["key"])}</p></div></li>' for d in DECKS
    )
    return pagetop(["Resources"], "Resources",
                   "This page has what we cover in meetings, a self-paced learning planner, tools for building your project, and our slide decks. Everything in the planner is free."
                   ) + f'''<section class="section">
  <div class="wrap docs">
    <nav class="subnav" data-subnav aria-label="On this page">
      <h2>On this page</h2>
      <ul>
        <li><a href="#start">Start here</a></li>
        <li><a href="#year">This year's plan</a></li>
        <li><a href="#planner">Learning planner</a></li>
        <li><a href="#build">Build your project</a></li>
        <li><a href="#safety">AI safety reading group</a></li>
        <li><a href="#programs">Competitions and programs</a></li>
        <li><a href="#slides">Club slide decks</a></li>
      </ul>
    </nav>

    <div class="docs-main">
      <section id="start">
        <h2>Start here</h2>
        <p class="intro">Three things to do before your first meeting. They take about fifteen minutes in total.</p>
        <ol class="startgrid">
          <li><h3>Join our Classroom</h3><p>Use code <strong>{SITE["code"]}</strong> in Google Classroom. Slides, notebooks, and announcements are posted there.</p></li>
          <li><h3>Make two free accounts</h3><p><a href="https://www.kaggle.com/" rel="noopener">Kaggle</a> for courses, datasets, and competitions, and <a href="https://github.com/" rel="noopener">GitHub</a> for saving your code.</p></li>
          <li><h3>Open a notebook</h3><p>Try <a href="https://colab.research.google.com/" rel="noopener">Google Colab</a>. It runs Python in your browser, so there's nothing to install. Bring a laptop if you have one.</p></li>
        </ol>
      </section>

      <section id="year">
        <h2>This year's plan</h2>
        <p class="intro">What Foundations meetings cover, month by month. The linked slides and notebooks are from last year's sessions on the same topics. The schedule can shift.</p>
        <table class="plan">
          <thead><tr><th scope="col">When</th><th scope="col">What we cover</th></tr></thead>
          <tbody>
        {plan_rows}
          </tbody>
        </table>
      </section>

      <section id="planner">
        <h2>Learning planner</h2>
        <p class="intro">A self-paced path from your first line of Python to your own project. We picked a few of the best free resources for each stage, so you don't have to sort through hundreds. Check things off as you go. Your progress is saved in this browser.</p>
        <div class="planner-bar">
          <progress data-progress value="0" max="1" aria-label="Planner progress"></progress>
          <span data-progress-label></span>
          <button type="button" data-reset>Reset progress</button>
        </div>
        {"".join(stages)}
      </section>

      <section id="build">
        <h2>Build your project</h2>
        <p class="intro">You don't need to finish the whole planner first. Once you're through stage 3, pick an idea and start. You'll learn the rest as you need it.</p>
        <h3>Ideas to start from</h3>
        <ul class="checks">{"".join(f"<li>{i}</li>" for i in IDEAS)}</ul>
        {"".join(build_blocks)}
      </section>

      <section id="safety">
        <h2>AI safety reading group</h2>
        <p class="intro">A six-session plan for the AI, Ethics and Society group, adapted from a university AI safety course and cut down to the most readable pieces. Each session needs about an hour of reading or watching beforehand.</p>
        {"".join(safety)}
      </section>

      <section id="programs">
        <h2>Competitions and programs</h2>
        <p class="intro">Ways to keep going outside the club.</p>
        <ul class="res res--plain">
          {programs}
        </ul>
      </section>

      <section id="slides">
        <h2>Club slide decks</h2>
        <p class="intro">Decks from past meetings. Those marked "school account" only open when you're signed in with your school Google account.</p>
        <ul class="dated">
        {decks}
        </ul>
      </section>
    </div>
  </div>
</section>
'''


def page_news():
    items = []
    for n in NEWS:
        act = f'<p class="act"><a class="more" href="{n["link"][1]}">{n["link"][0]}</a></p>' if n["link"] else ""
        items.append(f'''<li id="{n["id"]}"><time datetime="{n["iso"]}">{n["date"]}</time>
        <div><h2 style="font-size:1.2rem;margin-bottom:4px">{n["title"]}</h2><p>{n["body"]}</p>{act}</div></li>''')
    return pagetop(["News"], "News", "Major club announcements are posted here. Week-to-week reminders go out on Google Classroom.") + f'''<section class="section">
  <div class="narrow">
    <ul class="ann">
      {"".join(items)}
    </ul>
  </div>
</section>
'''


def page_join():
    group_opts = "".join(f'<option data-key="{g["key"]}">{g["name"]}</option>' for g in GROUPS)
    anchors = "".join(f'<span class="anchor" id="join-{g["key"]}"></span>' for g in GROUPS)
    return pagetop(["Join"], "Join SAIL",
                   f"Any {SITE['school']} student can join. There's no tryout, no cost, and you don't need to know how to code."
                   ) + f'''<section class="section">
  <div class="wrap split">
    <div class="prose">
      <h2>When and where</h2>
      <p>We meet {SITE["meets"][0].lower() + SITE["meets"][1:]}, in {SITE["room"]}. You're welcome to come to a meeting before you sign up, and to bring a friend.</p>

      <h2 id="tracks">Two tracks</h2>
      <p>Foundations is open sign-up. The Applied Research Division asks for a short project idea, so officers can help you find a team.</p>
      <table class="twocol">
        <thead><tr><td></td><th scope="col">Foundations Program</th><th scope="col">Applied Research Division</th></tr></thead>
        <tbody>
          <tr><th scope="row">Best for</th>
            <td data-l="Foundations">Anyone new to AI or coding. Most ninth and tenth graders start here. Juniors and seniors who are new to programming start here too.</td>
            <td data-l="Applied Research">Members who have finished Foundations or have built a project before. Mostly juniors and seniors.</td></tr>
          <tr><th scope="row">What you do</th>
            <td data-l="Foundations">Learn Python, work with data, enter a Kaggle competition, and train a neural network by December. Build your own project in the spring.</td>
            <td data-l="Applied Research">Build a project in a team of two to four, with a research group behind you. Present it at the end of the semester.</td></tr>
          <tr><th scope="row">Time</th>
            <td data-l="Foundations">Meetings, plus about an hour of practice between them.</td>
            <td data-l="Applied Research">Meetings, plus about two hours a week while your project is running.</td></tr>
          <tr><th scope="row">Getting in</th>
            <td data-l="Foundations">Sign up below. Everyone who signs up is in.</td>
            <td data-l="Applied Research">Send a short project idea below. An officer will follow up to help shape it and find you a team.</td></tr>
        </tbody>
      </table>

      <h2>How to join</h2>
      <ol class="steps">
        <li><h3>Join our Google Classroom</h3><p>Use code <strong>{SITE["code"]}</strong>. Meeting reminders, slides, and notebooks are posted there.</p></li>
        <li><h3>Come to a meeting</h3><p>{SITE["meets"]}, {SITE["room"]}. Bring a laptop if you have one.</p></li>
        <li><h3>Send us the form</h3><p>It tells us your grade, your track, and which research group interests you.</p></li>
      </ol>
      <p><strong>Joining after the year has started?</strong> Come to any meeting and tell an officer you're new. Everything we've covered so far is on the <a href="resources.html#year">Resources page</a>, and we'll help you catch up.</p>
    </div>
    <aside class="side">
      <h2>At a glance</h2>
      <dl>
        <dt>When</dt><dd>{SITE["meets"]}</dd>
        <dt>Where</dt><dd>{SITE["room"]}</dd>
        <dt>Google Classroom</dt><dd>{SITE["code"]}</dd>
        <dt>Instagram</dt><dd>@{SITE["instagram"]}</dd>
        <dt>Cost</dt><dd>Free</dd>
      </dl>
      <a class="btn" href="#form">Go to the form</a>
    </aside>
  </div>
</section>

<section class="section section--soft" id="form">
  <div class="narrow">
    {anchors}
    <h2>Sign-up form</h2>
    <form class="form" data-apply>
      <p class="form-how"><strong>How this works:</strong> this form doesn't send anything by itself. When you press the button, your email app opens with a message to us already written. Press send there, and you're done.</p>
      <div class="f2">
        <div class="f"><label for="n">Full name</label><input id="n" name="name" type="text" autocomplete="name" required></div>
        <div class="f"><label for="e">School email</label><input id="e" name="email" type="email" autocomplete="email" required></div>
      </div>
      <div class="f2">
        <div class="f"><label for="g">Grade</label>
          <select id="g" name="grade"><option>9</option><option>10</option><option>11</option><option>12</option></select>
        </div>
        <div class="f"><label for="t">Track</label>
          <select id="t" name="track">
            <option data-key="foundations">Foundations Program</option>
            <option data-key="division">Applied Research Division</option>
            <option data-key="unsure">Not sure yet</option>
          </select>
        </div>
      </div>
      <div class="f"><label for="gr">Research group you're interested in <span class="opt">(optional, and you can change it later)</span></label>
        <select id="gr" name="group"><option data-key="">Not sure yet</option>{group_opts}</select>
      </div>
      <div class="f"><label for="x">Any experience so far <span class="opt">(optional)</span></label>
        <input id="x" name="experience" type="text" placeholder="Classes, languages, projects. It's fine to leave this blank.">
      </div>
      <div class="f"><label for="s">What would you like to work on? <span class="opt">(optional for Foundations, needed for Applied Research)</span></label>
        <textarea id="s" name="statement" placeholder="A couple of sentences is plenty."></textarea>
      </div>
      <button class="btn" type="submit">Create application email</button>
      <p class="fstatus" role="status"></p>
    </form>
  </div>
</section>

<section class="section">
  <div class="narrow">
    <h2>What we ask of members</h2>
    <ul class="checks">
      <li>Come to meetings when you can, and tell an officer when you can't.</li>
      <li>Try the practice exercise for each topic.</li>
      <li>Present something once a year, even if it's small.</li>
    </ul>

    <h2 style="margin-top:44px">Questions</h2>
    <div class="faq">
      <details open><summary>Do I need to know how to code?</summary><div class="ans"><p>No. Foundations starts from the first line of Python. The Applied Research Division does expect you to be able to write and fix your own code.</p></div></details>
      <details><summary>I'm a junior or senior, but I'm new to this. Can I still join?</summary><div class="ans"><p>Yes. Start in Foundations. The tracks are about experience, not grade, and you can move to the Applied Research Division as soon as you're ready.</p></div></details>
      <details><summary>How much time does it take?</summary><div class="ans"><p>Meetings are an hour every other week. Foundations members should plan on about an hour of practice between meetings. Applied Research teams spend about two hours a week while a project is running.</p></div></details>
      <details><summary>When do I pick a research group?</summary><div class="ans"><p>You can name one on the form, and you can change it at any time. Applied Research teams work with their group from October. Foundations members join group activities in the second semester.</p></div></details>
      <details><summary>Do I need my own laptop?</summary><div class="ans"><p>It helps, but it isn't required. Everything runs in a browser, and free tools such as Google Colab and Kaggle provide the computing power.</p></div></details>
      <details><summary>What if I miss a meeting?</summary><div class="ans"><p>Slides and notebooks are posted on Google Classroom, and the main decks are also linked on the Resources page, so you can catch up.</p></div></details>
    </div>
  </div>
</section>
'''


# ---------------------------------------------------------------- checks

def luminance(hex_color):
    h = hex_color.lstrip("#")
    rgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def contrast(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


CONTRAST_PAIRS = [
    ("body text on white", "#141d27", "#ffffff"), ("secondary text on white", "#3f4a56", "#ffffff"),
    ("muted text on white", "#5a6571", "#ffffff"), ("muted text on soft", "#5a6571", "#f4f6f9"),
    ("secondary text on soft", "#3f4a56", "#f4f6f9"), ("link on white", "#14498c", "#ffffff"),
    ("link on soft", "#14498c", "#f4f6f9"), ("rust label on white", "#9c4522", "#ffffff"),
    ("hero subtitle on navy", "#cbd8e8", "#081426"), ("hero meta on navy", "#a9bdd6", "#081426"),
    ("footer text on navy", "#c9d6e6", "#0e2340"), ("footer heading on navy", "#a9bdd6", "#0e2340"),
    ("nav link on navy", "#dbe5f1", "#0e2340"), ("badge text", "#1d5a35", "#e3f3e8"),
    ("planned tag", "#7a5506", "#fdf7e8"),
]

BANNED = [
    "—", "–", "delve", "seamless", "cutting-edge", "leverage", "in today's", "game-chang", "unlock",
    "empower", "dive into", "at the intersection of", "journey", "elite", "rather than", "actually run",
    "what they throw away", "count as a failure", "sign-off", "signs off", "2026 to 2027", "1 entries",
]


def strip_tags(html):
    html = re.sub(r"(?s)<(script|style|svg).*?</\1>", " ", html)
    return re.sub(r"(?s)<[^>]+>", " ", html)


def run_checks(written):
    problems = []
    for label, fg, bg in CONTRAST_PAIRS:
        ratio = contrast(fg, bg)
        if ratio < 4.5:
            problems.append(f"contrast {ratio:.2f}:1 below 4.5 for {label}")
    for filename in written:
        with open(os.path.join(HERE, filename), encoding="utf-8") as fh:
            html = fh.read()
        text = strip_tags(html).lower()
        for term in BANNED:
            if term in text:
                problems.append(f"{filename}: banned phrase '{term.strip()}'")
        levels = [int(m) for m in re.findall(r"<h([1-6])[\s>]", html)]
        if levels.count(1) != 1:
            problems.append(f"{filename}: expected exactly one h1, found {levels.count(1)}")
        for a, b in zip(levels, levels[1:]):
            if b > a + 1:
                problems.append(f"{filename}: heading jumps from h{a} to h{b}")
                break
    return problems


def build():
    pages = [
        ("index.html", "Home", "The AI and machine learning club at " + SITE["school"] + ". Learn how AI works and build your own projects. No experience needed.", "home", page_index()),
        ("research.html", "Research groups", "Compare SAIL's six research groups and find the one that fits you.", "research", page_research()),
        ("projects.html", "Projects", "Projects, workshops, and activities by SAIL members.", "projects", page_projects()),
        ("people.html", "People", "The student officers who run SAIL.", "people", page_people()),
        ("resources.html", "Resources", "A free learning planner, this year's meeting plan, project tools, and club slide decks.", "resources", page_resources()),
        ("news.html", "News", "Announcements from SAIL.", "news", page_news()),
        ("join.html", "Join", "How to join SAIL: who can join, when we meet, the two tracks, and the sign-up form.", "join", page_join()),
    ]
    for g in GROUPS:
        pages.append((g["slug"], g["name"], g["line"], "group", page_group(g)))

    keep = {p[0] for p in pages}
    for old in glob.glob(os.path.join(HERE, "*.html")):
        if os.path.basename(old) not in keep:
            os.remove(old)
            print("removed stale page:", os.path.basename(old))

    written = []
    for filename, title, desc, active, body in pages:
        html = head(title, desc) + masthead(active) + body + footer()
        with open(os.path.join(HERE, filename), "w", encoding="utf-8") as fh:
            fh.write(html)
        written.append(filename)

    print("built %d pages" % len(written))
    problems = run_checks(written)
    if problems:
        print("CHECKS FAILED:")
        for p in problems:
            print("  - " + p)
    else:
        print("checks passed: contrast, heading order, phrasing")
    for name in sorted(set(MISSING_IMAGES)):
        print(f"note: no image yet for '{name}' (add assets/img/{name}.jpg to show one)")


if __name__ == "__main__":
    build()

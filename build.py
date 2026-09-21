#!/usr/bin/env python3
"""
Static site generator for the South Artificial Intelligence Laboratory.

    python build.py

Writes plain .html files next to this script. No dependencies.
Page copy lives in the data blocks below; the Resources pages live in resources_data.py.
The build checks text contrast, heading order, and banned phrasing, and lists missing images.
"""

import glob
import os
import re

from resources_data import (BUILD_SECTION, DECKS, IDEAS, NOTEBOOKS, PLAN, PROGRAMS,
                            SAFETY, SAFETY_META, STAGES)

HERE = os.path.dirname(os.path.abspath(__file__))
YEAR = "2026-27"

SITE = {
    "name": "South Artificial Intelligence Laboratory",
    "short": "SAIL",
    "school": "West Windsor-Plainsboro High School South",
    "room": "Room 700F",
    "meets": "Every other Tuesday, 3:00 to 4:00 PM",
    "code": "selpcao",
    "instagram": "hss_aiclub",
}

LOGO = (
    '<svg viewBox="0 0 34 30" fill="none" aria-hidden="true">'
    '<path d="M18.2 0c6.9 5.4 10.8 12.1 11.4 20.2H18.2V0z" fill="currentColor"/>'
    '<path d="M15.4 4.9v15.3H4.7C6.7 14 10.3 8.9 15.4 4.9z" fill="var(--logo-accent,#8fb4ff)"/>'
    '<path d="M2 23.2h30c-1.1 3.5-4.2 5.3-8.4 5.3H10.4c-4.2 0-7.3-1.8-8.4-5.3z" fill="currentColor"/>'
    "</svg>"
)

# ---------------------------------------------------------------- research groups

GROUPS = [
    {
        "key": "data-science", "slug": "data-science.html", "name": "Applied Data Science", "sub": "",
        "first": True,
        "line": "Find patterns in real datasets and compete on Kaggle.",
        "desc": "Members clean messy data, look for patterns in it, and build models that make predictions. New members usually start here.",
        "make_short": "Charts, prediction models, Kaggle entries",
        "level": "None",
        "experience": "None. The fall Foundations sessions start from the first line of Python.",
        "work": [
            "A second Kaggle competition, with teams formed in October",
            "A project using data from our own school or town",
            "An analysis of a dataset each member picks, presented to the club",
        ],
        "past": [
            ("November 18, 2025", "Workshop on seaborn, data cleaning, train and test splits, scikit-learn, and model evaluation.",
             [("Slides", "deck:python-2")]),
            ("November 4, 2025", "Titanic survival prediction on Kaggle, entered in teams.",
             [("Project", "projects.html#titanic"), ("Kaggle competition", "https://www.kaggle.com/competitions/titanic")]),
            ("November 4, 2025", "Python basics, useful libraries, and data preprocessing.",
             [("Slides", "deck:getting-started"), ("Preprocessing notebook", "https://github.com/helenc3/demo_notebooks/blob/main/Data_preprocessing.ipynb")]),
            ("Spring 2025", "pandas lessons, followed by member projects and presentations.", []),
        ],
        "stages": ["data", "classical-ml"], "related": ["neural-networks", "society", "vision"],
    },
    {
        "key": "vision", "slug": "vision.html", "name": "Computer Vision", "sub": "",
        "first": False,
        "line": "Train models that recognize what's in a photo or a video.",
        "desc": "Members train models that tell digits, clothes, or hand gestures apart, then test them on photos the model has never seen to find where it breaks.",
        "make_short": "Image classifiers, webcam demos",
        "level": "Can use variables, loops, and functions",
        "experience": "You can use variables, loops, and functions, and you have opened a notebook before. The fall sessions cover both.",
        "work": [
            "A classifier trained on photos that members take and label",
            "Transfer learning: reusing a large pretrained model on a small dataset",
            "A webcam demo that runs a member's model live",
            "A short report on where the group's best model fails",
        ],
        "past": [
            ("March 3, 2026", "Computer vision workshop. Members trained image classifiers with Teachable Machine. The take-home challenge added pose and sound models.",
             [("Slides", "deck:vision"), ("Project", "projects.html#teachable-machine")]),
            ("December 2, 2025", "Built a convolutional network for MNIST in Keras, then tried the same idea on Fashion-MNIST and CIFAR-10.",
             [("Project", "projects.html#image-classification"), ("Notebook", "https://github.com/helenc3/demo_notebooks/blob/main/mnistdemo.ipynb")]),
        ],
        "stages": ["vision", "deep-learning"], "related": ["neural-networks", "data-science", "nlp"],
    },
    {
        "key": "nlp", "slug": "nlp.html", "name": "Natural Language Processing", "sub": "How does a machine know what you mean?",
        "first": False,
        "line": "Build programs that read, sort, and write text, from spam filters to chatbots.",
        "desc": "Members work with text: deciding if a review is positive, finding the topic of an article, answering questions. The group starts with word-counting methods you can check by hand and moves up to the transformer models behind chatbots.",
        "make_short": "Text classifiers, similarity search, small chatbots",
        "level": "Can use functions, lists, and dictionaries",
        "experience": "You can use functions, lists, and dictionaries, and you can load and modify a notebook.",
        "work": [
            "A spam or sentiment classifier trained on text the group collects",
            "A tool that turns sentences into vectors and finds the most similar ones",
            "Reading the original transformer paper together over two meetings",
            "Comparing open language models on one shared task",
        ],
        "past": [
            ("April 21, 2026", "Intro to NLP workshop. The follow-up assignment was to write and upload a short NLP program.",
             [("Slides", "deck:nlp")]),
            ("January 6, 2026", "Large language models session, which started the Analyzing AI Models project.",
             [("Slides", "deck:llm-2026")]),
            ("February 18, 2025", "Presentation on how large language models work.",
             [("Slides", "deck:llm-2025")]),
        ],
        "stages": ["nlp-llm"], "related": ["agents", "neural-networks", "society"],
    },
    {
        "key": "neural-networks", "slug": "neural-networks.html", "name": "Neural Networks",
        "sub": "How they learn, and the math behind them",
        "first": False,
        "line": "Build a neural network from scratch and learn the math that makes it work.",
        "desc": "Members build a small network from scratch, watch it learn, and pick up the algebra and calculus that explain why it works.",
        "make_short": "A network from scratch, training experiments",
        "level": "Familiar with algebra",
        "experience": "Familiarity with algebra. The rest of the math is taught in sessions.",
        "work": [
            "A two-layer network written in NumPy, with every gradient checked by hand",
            "An experiment comparing how training settings affect learning",
            "Member-written notes that explain backpropagation to next year's members",
        ],
        "past": [
            ("December 2, 2025", "Introduction to deep learning, neural networks, and convolutional networks.",
             [("Notebook", "https://github.com/helenc3/demo_notebooks/blob/main/mnistdemo.ipynb")]),
            ("2023 and 2024", "Neural network lessons, introduced with Google's Quick, Draw! game.",
             [("Quick, Draw!", "https://quickdraw.withgoogle.com/")]),
        ],
        "stages": ["deep-learning"], "related": ["vision", "nlp", "agents"],
    },
    {
        "key": "agents", "slug": "agents.html", "name": "Agents and Reinforcement Learning", "sub": "This one is paying attention to you.",
        "first": False,
        "line": "Programs that learn by trial and error, and LLM-based assistants that use tools.",
        "desc": "Two topics share this group. Reinforcement learning is how a program learns by trial and error, the way game-playing AIs do. LLM-based agents are language models that can take actions, such as searching the web or running code, to finish a task.",
        "make_short": "Game-playing agents, tool-using assistants",
        "level": "Can debug a small Python program independently",
        "experience": "You can write and debug a small Python program without help.",
        "work": [
            "A gridworld Q-learning lab",
            "A game-playing agent trained in Gymnasium",
            "A small LLM-based assistant that uses tools, with a log of where it gets stuck",
            "A fixed set of tasks for comparing two agent designs",
        ],
        "past": [
            ("March 17, 2026", "An officer shared the agentic AI sections of NVIDIA's GTC 2026 keynote on Classroom as optional viewing.",
             [("Keynote video", "https://www.youtube.com/watch?v=jw_o0xr8MWU")]),
        ],
        "stages": ["agents-rl"], "related": ["nlp", "neural-networks", "society"],
    },
    {
        "key": "society", "slug": "society.html", "name": "AI, Ethics and Society", "sub": "I made a profile of you.",
        "first": False,
        "line": "Test models for fairness, study privacy and safety, and discuss how AI should be used.",
        "desc": "Members test models for fairness, study privacy and safety, write the documentation that should come with a model, and discuss how AI is changing school and work.",
        "make_short": "Fairness checks, model cards, discussions",
        "level": "None",
        "experience": "None. Writing and discussion matter as much as code here.",
        "work": [
            "A fairness check of a model built by another group",
            "A one-page model card for each project presented this year",
            "A reading group, using the plan on our Resources pages",
            "A discussion that a member plans and leads",
        ],
        "past": [
            ("November 12, 2024", "Moral Machine activity and discussion about automated decisions.",
             [("Moral Machine", "https://www.moralmachine.net/")]),
            ("October 17, 2023", "Rob Seater and Kimberlee Chang of MIT Lincoln Laboratory answered member questions about AI research and ethics.", []),
        ],
        "stages": ["safety"], "related": ["nlp", "data-science", "agents"],
    },
]
GROUP_BY_KEY = {g["key"]: g for g in GROUPS}

# Each group page has one teaching demo. Controls use data-act hooks read by assets/js/demos.js.
DEMOS = {
    "data-science": {
        "title": "A classifier drawing its boundary",
        "text": "Move your pointer across the screen. It counts as a data point, and the line bends to keep the two kinds apart. Click to leave the point there. This is a real classifier, a support vector machine, refit on every frame.",
        "controls": '<fieldset class="seg"><legend>New points are</legend>'
                    '<label><input type="radio" name="cls" value="1" data-act="class" checked> teal</label>'
                    '<label><input type="radio" name="cls" value="-1" data-act="class"> orange</label></fieldset>'
                    '<button type="button" data-act="reset">Reset</button>',
        "pause": False,
    },
    "vision": {
        "title": "Object detection and tracking",
        "text": "Real footage of a New York intersection. A detector (Faster R-CNN) went through it frame by frame ahead of time and marked every person, car and bus, and a tracker linked its answers so each box follows one thing. Watch for what it misses or mislabels. Finding where a model breaks is a lot of what this group does.",
        "controls": "",
        "pause": True,
    },
    "nlp": {
        "title": "One sentence, four ways a model reads it",
        "text": "Type a sentence or step through the examples, then switch views: tokens, attention, how the meaning of a word like bank moves with its context, and what comes next. The word vectors are a small toy written by hand. A real model learns its own.",
        "controls": '<label class="sent">Sentence <input type="text" data-act="sentence" maxlength="90" value="The robot thought I meant something else." spellcheck="false" autocomplete="off"></label>'
                    '<button type="button" data-act="example">Next example</button>'
                    '<span class="modes" role="group" aria-label="View">'
                    '<button type="button" data-act="mode-tokens" aria-pressed="false">Tokens</button>'
                    '<button type="button" data-act="mode-attention" aria-pressed="false">Attention</button>'
                    '<button type="button" data-act="mode-meaning" aria-pressed="true">Meaning</button>'
                    '<button type="button" data-act="mode-predict" aria-pressed="false">Prediction</button></span>'
                    '<label data-temp hidden>Temperature <input type="range" min="10" max="200" value="70" data-act="temp"></label>',
        "pause": False,
    },
    "neural-networks": {
        "title": "Gradient descent on a loss surface",
        "text": "Click anywhere to start training from that point. Training a network means rolling downhill on a surface like this one, except in millions of dimensions, and different starts can end in different valleys.",
        "controls": '<button type="button" data-act="restart">Random start</button>',
        "pause": True,
    },
    "agents": {
        "title": "A robot that learns from you",
        "text": "It keeps the title in order and it watches what you do. Click letters, move around it, and answer when it asks whether a move was good. Your answers are its only reward, and they change what it does next. Everything it learns stays in this browser.",
        "controls": '<button type="button" data-act="knock">Knock letters down</button>'
                    '<button type="button" data-act="typo">Scramble a word</button>'
                    '<button type="button" data-act="battery">Give it a battery</button>'
                    '<button type="button" data-act="learned">What it learned</button>',
        "pause": True,
    },
    "society": {
        "title": "A profile built from your clicks",
        "text": "The card is what this site's robot worked out about you from pages opened, time spent and clicks. It is kept in this browser and nowhere else. Ask for the evidence, tell it when it is wrong, read everything it stored, or make it forget. The camera is optional: a face model runs in this tab, no frame is stored or sent, and the labels marked guess are invented on purpose.",
        "controls": '<button type="button" data-act="camera">Turn on camera</button>',
        "pause": False,
    },
}

# ---------------------------------------------------------------- people

# (name, role, photo file, one or two sentences). The last field comes from the club's own record.
# Ask each officer for a sentence in their own words and put it here.
TEAM = [
    ("Aarav Dey", "Co-President", "aarav-dey", "Treasurer in 2025-26. Built AI Hub, the club's resource site, in 2025."),
    ("Henna Patel", "Co-President", "henna-patel", "Co-Vice President in 2025-26."),
    ("Maushmi Miraj", "Co-President", "maushmi-miraj", "Secretary in 2025-26."),
    ("Maahi Mehta", "Co-Vice President", "maahi-mehta", ""),
    ("Shriyan Kumar", "Co-Vice President", "shriyan-kumar", ""),
    ("Ishan Sarda", "Secretary", "ishan-sarda", ""),
    ("Jia Arora", "Junior Officer", "jia-arora", "Junior Officer in 2025-26."),
]

# year -> list of (role, [names]); rendered as a block of Python on the People page
PAST_OFFICERS = [
    ("2025-26", "", [("President", ["Eric Zou"]), ("Co-Vice Presidents", ["Helen Chen", "Henna Patel"]), ("Secretary", ["Maushmi Miraj"]),
                     ("Treasurer", ["Aarav Dey"]), ("Junior Officers", ["Syam Paladugu", "Jia Arora"])]),
    ("2024-25", "", [("President", ["Atin Mathur"]), ("Vice President", ["Eric Zou"]), ("Secretary", ["Simran Cheema"]),
                     ("Co-Treasurers", ["Prajwal Bhat", "Vivek Raghuram"])]),
    ("2023-24", "", [("President", ["Mahitha Thippireddy"]), ("Vice President", ["Saumya Muthukumar"]), ("Secretary", ["Nimai Ponna"]),
                     ("Treasurer", ["Akshay Sharma"]), ("Junior Officer", ["Eric Zou"])]),
    ("2022-23", "founding year", [("Founders", ["Mahitha Thippireddy", "Saumya Muthukumar", "Ramya Gouraiah"])]),
]

# ---------------------------------------------------------------- projects

FEATURED = [
    {
        "id": "titanic", "title": "Titanic survival prediction", "when": "November 2025", "status": "Team competition",
        "group": "data-science",
        "credit": "Entered by member teams. Starter notebook from Helen Chen's demo repository.",
        "text": "Teams cleaned the passenger data, chose which details to feed the model, trained classifiers with scikit-learn, and submitted predictions to Kaggle's public leaderboard.",
        "figure": "titanic",
        "caption": "Survival rates in the 891-passenger training set. This is the data teams started from, not a team's result.",
        "links": [("Kaggle competition", "https://www.kaggle.com/competitions/titanic"),
                  ("Preprocessing notebook", "https://github.com/helenc3/demo_notebooks/blob/main/Data_preprocessing.ipynb")],
        "note": "Team scores were collected on a form and aren't published here.",
    },
    {
        "id": "image-classification", "title": "Image classification", "when": "December 2025", "status": "Workshop exercise",
        "group": "vision",
        "credit": "Built by members from a shared starter notebook in Helen Chen's demo repository.",
        "text": "Members built a convolutional neural network in Keras that reads handwritten digits from MNIST. Then they tried the same approach on Fashion-MNIST and CIFAR-10 and changed the architecture to see what helped.",
        "figure": "img:mnist-fashion-samples.png",
        "alt": "Sample images: two rows of handwritten digits zero through nine from MNIST, and two rows of clothing items from Fashion-MNIST.",
        "caption": "Samples from MNIST (top) and Fashion-MNIST (bottom), two of the datasets members trained on.",
        "links": [("Starter notebook", "https://github.com/helenc3/demo_notebooks/blob/main/mnistdemo.ipynb"),
                  ("Keras datasets", "https://keras.io/api/datasets/")],
        "note": "",
    },
    {
        "id": "ai-hub", "title": "AI Hub", "when": "April 2025", "status": "Member project",
        "group": "",
        "credit": "Built by Aarav Dey.",
        "text": "A website that gathers the club's resources in one place. It was used in meetings during the spring 2025 AI Hub project, where members researched a topic and presented what they found.",
        "figure": "slot:ai-hub", "caption": "", "links": [], "note": "",
    },
    {
        "id": "teachable-machine", "title": "Teachable Machine models", "when": "March 2026", "status": "Workshop exercise",
        "group": "vision",
        "credit": "Built by members at and after the March 3 workshop, alone or with a partner.",
        "text": "Members trained image classifiers in the browser with Teachable Machine. The take-home challenge was to find the most creative use of it, using images, body poses, or sound.",
        "figure": "slot:teachable-machine", "caption": "",
        "links": [("Workshop slides", "deck:vision"), ("Teachable Machine", "https://teachablemachine.withgoogle.com/")],
        "note": "Member models were turned in on Google Classroom and aren't public.",
    },
]

# ---------------------------------------------------------------- news

NEWS = [
    {"id": "signups-2026", "date": "September 21, 2026", "iso": "2026-09-21",
     "title": "Sign-ups are open for " + YEAR,
     "short": "The first meeting date will be posted here and on Google Classroom.",
     "body": "Sign up on the Join page, or join our Google Classroom with code " + SITE["code"] + ". The first meeting date for " + YEAR + " hasn't been set yet. It will be posted here and on Classroom. After that, meetings are every other Tuesday.",
     "link": ("Sign up", "join.html")},
    {"id": "officers-2026", "date": "June 2, 2026", "iso": "2026-06-02",
     "title": "Officers announced for " + YEAR,
     "short": "Three co-presidents lead a team of seven.",
     "body": "Aarav Dey, Henna Patel, and Maushmi Miraj are co-presidents. Maahi Mehta and Shriyan Kumar are co-vice presidents, Ishan Sarda is secretary, and Jia Arora is junior officer.",
     "link": ("Meet the officers", "people.html")},
    {"id": "vision-workshop", "date": "March 3, 2026", "iso": "2026-03-03",
     "title": "Computer vision workshop", "short": "",
     "body": "Members trained image classifiers in the browser with Teachable Machine, then took home a challenge to find its most creative use.",
     "link": ("Teachable Machine project", "projects.html#teachable-machine")},
    {"id": "titanic", "date": "November 4, 2025", "iso": "2025-11-04",
     "title": "Teams enter the Titanic competition on Kaggle", "short": "",
     "body": "Members formed teams and submitted survival predictions to the public leaderboard, with prizes for the top scores.",
     "link": ("Titanic project", "projects.html#titanic")},
    {"id": "ai-hub", "date": "April 8, 2025", "iso": "2025-04-08",
     "title": "AI Hub launches", "short": "",
     "body": "A member-built website that collects the club's resources in one place.",
     "link": ("AI Hub project", "projects.html#ai-hub")},
    {"id": "mit-ll", "date": "October 17, 2023", "iso": "2023-10-17",
     "title": "Researchers from MIT Lincoln Laboratory visit", "short": "",
     "body": "Rob Seater and Kimberlee Chang spoke with members about AI research and ethics.", "link": None},
    {"id": "cmu", "date": "March 7, 2023", "iso": "2023-03-07",
     "title": "Guest lecture from Carnegie Mellon", "short": "",
     "body": "Prof. Xhakaj of Carnegie Mellon University presented recent research and answered member questions.", "link": None},
    {"id": "first-meeting", "date": "September 27, 2022", "iso": "2022-09-27",
     "title": "First meeting", "short": "",
     "body": "The club held its first interest meeting in Room 700B and started with Python basics.", "link": None},
]

NAV = [("index.html", "Home"), ("research.html", "Research"), ("projects.html", "Projects"),
       ("people.html", "People"), ("resources.html", "Resources"), ("news.html", "News")]

RES_PAGES = [
    ("materials.html", "Meeting materials", "This year's plan, slides, and notebooks from past meetings."),
    ("learn.html", "Learning path", "Seven stages from a first line of Python to your own project."),
    ("project-guide.html", "Project guide", "Ideas, datasets, a README template, and ways to share a demo."),
    ("reading.html", "Reading group", "A seven-session plan on fairness, safety, and AI policy."),
    ("opportunities.html", "Opportunities", "Competitions and summer programs."),
]

DECK_BY_KEY = {d["key"]: d for d in DECKS}
BADGE = ' <span class="flag">Good first group</span>'


# ---------------------------------------------------------------- helpers

def link(label, target):
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
            parts.append(
                f'<g class="b"><title>{who}, {label.lower()}: {val}% survived</title>'
                f'<rect class="bar" x="{x0}" y="{y}" width="{w:.1f}" height="{bar}" fill="{color}"/>'
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
<link rel="icon" href="assets/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
'''


def brand():
    return (f'<a class="brand" href="index.html" aria-label="{SITE["name"]}, home">'
            f'<img src="assets/img/logo.png" alt="" width="42" height="42">'
            f'<span class="brand-text"><b>{SITE["short"]}</b><span>at WWP High School South</span></span></a>')


def masthead(active):
    links = []
    for href, label in NAV:
        key = "home" if href == "index.html" else href.replace(".html", "")
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
    dark = " on-dark" if active in ("home", "group") else ""
    return f'''<header class="masthead{dark}" data-masthead>
  <div class="wrap masthead-in">
    {brand()}
    <nav class="mainnav" aria-label="Main">
      {nav_html}
    </nav>
    <a class="mast-join" href="join.html">Join</a>
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
      <a href="join.html">Join</a>
    </div>
  </nav>
</header>
<main id="main">
'''


def pagetop(crumbs, title, lede="", sub=""):
    trail = " / ".join(['<a href="index.html">Home</a>'] + crumbs)
    sub_html = f'<p class="sub">{sub}</p>' if sub else ""
    lede_html = f'<p class="lede">{lede}</p>' if lede else ""
    return f'''<section class="pagetop">
  <div class="wrap">
    <p class="crumb">{trail}</p>
    <h1>{title}</h1>
    {sub_html}{lede_html}
  </div>
</section>
'''


def footer(extra_script=""):
    groups = "".join(f'<li><a href="{g["slug"]}">{g["name"]}</a></li>' for g in GROUPS)
    return f'''</main>
<footer class="foot">
  <svg class="foot-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
    <path class="w1" d="M0 52c120-30 240-30 360 0s240 30 360 0 240-30 360 0 240 30 360 0v38H0z"/>
    <path class="w2" d="M0 62c180-26 300-22 480 2s300 24 480 0 300-26 480 0v26H0z"/>
    <path class="w3" d="M0 74c160-16 320-16 480 0s320 16 480 0 320-16 480 0v16H0z"/>
  </svg>
  <div class="foot-bg" aria-hidden="true"><i></i><i></i><i></i><b>SAIL</b></div>
  <div class="wrap">
    <div class="foot-top">
      <p class="foot-call">Build something with us.</p>
      <p class="foot-meet">{SITE["meets"]} · {SITE["room"]} · no experience needed</p>
      <a class="btn btn--glow" href="join.html">Join SAIL</a>
    </div>
    <div class="foot-grid">
      <div>
        {brand()}
        <p>{SITE["name"]}, the AI and machine learning club at {SITE["school"]}.</p>
      </div>
      <div>
        <h2>Research</h2>
        <ul>{groups}</ul>
      </div>
      <div>
        <h2>Explore</h2>
        <ul>
          <li><a href="projects.html">Projects</a></li>
          <li><a href="resources.html">Resources</a></li>
          <li><a href="people.html">People</a></li>
          <li><a href="news.html">News</a></li>
        </ul>
      </div>
      <div>
        <h2>Contact</h2>
        <ul>
          <li><a href="join.html">Join SAIL</a></li>
          <li><a href="#" data-email>Email us</a></li>
          <li><a href="https://www.instagram.com/{SITE["instagram"]}/" rel="noopener">Instagram</a></li>
          <li><span class="foot-code">Classroom code <b>{SITE["code"]}</b></span></li>
        </ul>
      </div>
    </div>
    <p class="foot-bot">&copy; <span data-year>2026</span> {SITE["name"]}. Run by students.</p>
  </div>
</footer>
<script src="assets/js/memory.js"></script>
<script src="assets/js/site.js"></script>
{extra_script}</body>
</html>
'''


def res_list(items, show_role=False):
    labels = {"start": "Start here", "practice": "More practice", "reference": "Reference"}
    out = []
    for it in items:
        meta = [it["kind"]] + ([it["time"]] if it.get("time") else [])
        role = f'<span class="role role--{it["role"]}">{labels[it["role"]]}</span>' if show_role else ""
        ext = ' rel="noopener"' if it["url"].startswith("http") else ""
        out.append(f'<li>{role}<a class="t" href="{it["url"]}"{ext}>{it["title"]}</a>'
                   f'<span class="m">{", ".join(meta)}</span><p>{it["note"]}</p></li>')
    return "\n          ".join(out)


# ---------------------------------------------------------------- pages

def page_index():
    groups = "\n      ".join(
        f'<li><h3><a href="{g["slug"]}">{g["name"]}</a></h3><p>{g["line"]}</p></li>' for g in GROUPS)
    feats = "\n      ".join(
        f'''<article class="feature">
        {figure_html(f)}
        <h3><a href="projects.html#{f["id"]}">{f["title"]}</a></h3>
        <p>{f["text"].split(". ")[0]}.</p>
      </article>''' for f in FEATURED[:2])
    news = "\n      ".join(
        f'''<li><time datetime="{n["iso"]}">{n["date"]}</time>
        <div><h3><a href="news.html#{n["id"]}">{n["title"]}</a></h3><p>{n["short"] or n["body"]}</p></div></li>'''
        for n in NEWS[:2])
    return f'''<section class="hero" data-hero>
  <canvas data-field aria-hidden="true"></canvas>
  <div class="wrap hero-in">
    <h1>{SITE["name"]}</h1>
    <p class="hero-sub">We're students at {SITE["school"]} who learn how AI works and build our own projects with it.</p>
    <div class="hero-actions">
      <a class="btn btn--light" href="join.html">Join SAIL</a>
      <a class="btn btn--line" href="projects.html">Explore our work</a>
    </div>
  </div>
  <div class="wrap hero-tools"><button type="button" data-pause>Pause animation</button></div>
</section>

<section class="section">
  <div class="wrap about">
    <div>
      <h2>About SAIL</h2>
      <p>We started in 2022 with after-school Python lessons. Members now teach each other, from a first program up to neural networks, and the slides and notebooks from each meeting are posted afterward.</p>
      <p>You don't need any experience, and it's free.</p>
    </div>
    <dl class="meet">
      <dt>Meetings</dt><dd>{SITE["meets"]}</dd>
      <dt>Room</dt><dd>700F</dd>
      <dt>Google Classroom</dt><dd>{SITE["code"]}</dd>
    </dl>
  </div>
</section>

<section class="section section--soft">
  <div class="wrap">
    <div class="shead"><h2>Two ways to join</h2><a class="more" href="join.html">How to join</a></div>
    <div class="tracks">
      <div>
        <h3>Foundations Program</h3>
        <p class="who">For anyone new to AI or coding</p>
        <p>Learn Python, work with real data, enter a Kaggle competition with a team, and train a neural network. In the spring you build a project of your own.</p>
      </div>
      <div>
        <h3>Applied Research Division</h3>
        <p class="who">For members ready to run their own project</p>
        <p>Work in a team of two to four on a project you choose, inside one of the research groups. Teams present at the end of each semester.</p>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="shead"><h2>Research groups</h2><a class="more" href="research.html">Compare all six</a></div>
    <ul class="groups">
      {groups}
    </ul>
  </div>
</section>

<section class="section section--soft">
  <div class="wrap">
    <div class="shead"><h2>Projects</h2><a class="more" href="projects.html">All projects</a></div>
    <div class="features">
      {feats}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="shead"><h2>News</h2><a class="more" href="news.html">All news</a></div>
    <ul class="ann">
      {news}
    </ul>
  </div>
</section>
'''


def page_research():
    rows = "\n        ".join(
        f'''<tr>
          <th scope="row"><a href="{g["slug"]}">{g["name"]}</a>{BADGE if g["first"] else ""}</th>
          <td data-l="What members make">{g["make_short"]}</td>
          <td data-l="Experience needed">{g["level"]}</td>
        </tr>''' for g in GROUPS)
    return pagetop(["Research"], "Research groups",
                   f"The six groups are new for {YEAR}. Each one focuses on an area of AI."
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
  <div class="wrap two">
    <div>
      <h2>How groups work</h2>
      <p>Groups work during the regular club meeting, so there is no separate meeting time. You can name a group when you sign up and switch whenever you like.</p>
      <p>Applied Research teams work with their group from October. Foundations members join their group's activities in the second semester, once the fall sessions have covered the basics. Past sessions listed on a group page were whole-club meetings on that topic.</p>
    </div>
    <div>
      <h2>Project requirements</h2>
      <ul>
        <li>Share your code with setup instructions.</li>
        <li>Choose how you will evaluate the project before running experiments.</li>
        <li>Summarize your results and limitations in a one-page report.</li>
        <li>Present your work in ten minutes and answer questions.</li>
      </ul>
      <p><a class="more" href="project-guide.html">Project guide</a></p>
    </div>
  </div>
</section>
'''


def page_group(g):
    d = DEMOS[g["key"]]
    work = "".join(f"<li>{w}</li>" for w in g["work"])
    past = "\n        ".join(
        f'<li><span class="when">{w}</span><div><p>{t}</p>{linkrow(links)}</div></li>' for w, t, links in g["past"])
    res_items = []
    for key in g["stages"]:
        if key == "safety":
            res_items.extend(next(b for b in BUILD_SECTION if b["key"] == "responsible")["items"])
            continue
        stage = next(s for s in STAGES if s["key"] == key)
        res_items.extend([i for i in stage["items"] if i["role"] != "reference"][:3 if len(g["stages"]) > 1 else 4])
    more = ("reading.html", "Reading group plan") if "safety" in g["stages"] else ("learn.html", "Full learning path")
    related = "".join(f'<li><a href="{GROUP_BY_KEY[k]["slug"]}">{GROUP_BY_KEY[k]["name"]}</a></li>' for k in g["related"])
    flag = '<p class="flag" style="margin-left:0">Good first group</p>' if g["first"] else ""

    sub = f'<p class="sub">{g["sub"]}</p>' if g["sub"] else ""
    video = ('<video src="assets/video/street.mp4" autoplay muted loop playsinline preload="auto" aria-hidden="true"></video>'
             if g["key"] == "vision" else "")
    pause = '<button type="button" data-act="pause">Pause</button>' if d["pause"] else ""
    return f'''<section class="ghero" data-demo="{g["key"]}">
  {video}<canvas aria-hidden="true"></canvas>
  <div class="ghero-ui" data-ui></div>
  <div class="wrap ghero-in">
    <p class="crumb"><a href="index.html">Home</a> / <a href="research.html">Research</a></p>
    <h1>{g["name"]}</h1>
    {sub}<p class="desc">{g["desc"]}</p>
    <p><a class="btn btn--light" href="join.html#join-{g["key"]}">Sign up and pick this group</a></p>
  </div>
  <div class="ghero-bar">
    <div class="wrap ghero-bar-in">
      <p class="how"><strong>{d["title"]}.</strong> {d["text"]} <span data-status></span></p>
      <div class="demo-controls">
        {d["controls"]}
        {pause}
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div class="prose">
      {flag}
      <h2>Plans for {YEAR}</h2>
      <p>The group is new this year, so these are plans and none of them is finished work yet.</p>
      <ul>{work}</ul>

      <h2>Experience needed</h2>
      <p>{g["experience"]}</p>

      <h2>Past club sessions on this topic</h2>
      <ul class="dated">
        {past}
      </ul>

      <h2>Where to start learning</h2>
      <ul class="res">
        {res_list(res_items)}
      </ul>
      <p><a class="more" href="{more[0]}">{more[1]}</a></p>
    </div>
    <aside class="side">
      <p><a class="btn" href="join.html#join-{g["key"]}">Sign up and pick this group</a></p>
      <p class="meta">Group leads will be named in October.</p>
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
            grp = f', <a href="{gg["slug"]}">{gg["name"]}</a>'
        note = f'<p class="meta">{f["note"]}</p>' if f["note"] else ""
        feats.append(f'''<article class="{cls}" id="{f["id"]}">
        <div>
          <h2>{f["title"]}</h2>
          <p class="credit">{f["status"]}, {f["when"]}{grp}<br>{f["credit"]}</p>
          <p>{f["text"]}</p>
          {linkrow(f["links"])}
          {note}
        </div>
        {fig}
      </article>''')
    return pagetop(["Projects"], "Projects") + f'''<section class="section">
  <div class="wrap showcase">
    {"".join(feats)}
  </div>
</section>

<section class="section section--soft">
  <div class="narrow">
    <h2>Have something to add?</h2>
    <p>If your team has a chart, a confusion matrix, a screenshot, or a repository from one of these, send it to an officer and it goes on this page with your names on it.</p>
    <p>Slides and notebooks from workshops are under <a href="materials.html">Meeting materials</a>.</p>
  </div>
</section>
'''


def person(p):
    name, role, slug, bio = p
    bio_html = f"<p>{bio}</p>" if bio else ""
    return (f'<li><img src="assets/img/people/{slug}.jpg" alt="{name}" width="240" height="240">'
            f'<h3>{name}</h3><p class="role">{role}</p>{bio_html}</li>')


def officers_code():
    """Past officers, written out as a Python dict with syntax colors."""
    def s(text, cls="s"):
        return f'<span class="{cls}">"{text}"</span>'
    lines = ['<span class="c"># past officers, newest first</span>', '<span class="n">officers</span> <span class="o">=</span> {']
    for year, note, roles in PAST_OFFICERS:
        comment = f'  <span class="c"># {note}</span>' if note else ""
        lines.append(f'    {s(year, "k")}: {{{comment}')
        for role, names in roles:
            flat = ", ".join(f'<b>{s(n, "nm")}</b>' for n in names)
            if len(names) == 1:
                lines.append(f'        {s(role)}: {flat},')
            elif len(role) + sum(len(n) + 4 for n in names) < 76:
                lines.append(f'        {s(role)}: [{flat}],')
            else:
                lines.append(f'        {s(role)}: [')
                lines.extend(f'            <b>{s(n, "nm")}</b>,' for n in names)
                lines.append("        ],")
        lines.append("    },")
    lines.append("}")
    return '<pre class="code" tabindex="0" aria-label="Past officers by year"><code>' + "\n".join(lines) + "</code></pre>"


def page_people():
    presidents = "".join(person(p) for p in TEAM[:3])
    others = "".join(person(p) for p in TEAM[3:])
    return pagetop(["People"], "People") + f'''<section class="section">
  <div class="wrap">
    <h2>Co-Presidents</h2>
    <ul class="people people--3">{presidents}</ul>
    <h2 class="gap">Officers</h2>
    <ul class="people people--4">{others}</ul>
  </div>
</section>

<section class="section section--soft">
  <div class="wrap split split--code">
    <div>
      <h2>Past officers</h2>
      {officers_code()}
    </div>
    <aside class="side">
      <h2>Becoming an officer</h2>
      <p class="sidep">The officer interest form opens in April and closes in May, and the new team is announced at the last meeting of the year. Any member can apply. Each research group also gets a group lead, named in October.</p>
    </aside>
  </div>
</section>
'''


def page_resources():
    cards = "\n      ".join(
        f'<li><h2><a href="{href}">{title}</a></h2><p>{text}</p></li>' for href, title, text in RES_PAGES)
    return pagetop(["Resources"], "Resources", "Meeting materials and recommended courses. The courses and tools listed here are free unless the entry says otherwise.") + f'''<section class="section">
  <div class="wrap">
    <ul class="hub">
      {cards}
    </ul>
  </div>
</section>

<section class="section section--soft">
  <div class="narrow">
    <h2>Before your first meeting</h2>
    <p>Join our Google Classroom with code <strong>{SITE["code"]}</strong>, and bring a laptop if you have one. We set up Kaggle and Google Colab accounts together at the first meeting, and everything runs in a browser.</p>
  </div>
</section>
'''


def res_sub(title, lede):
    return pagetop(['<a href="resources.html">Resources</a>'], title, lede)


def page_materials():
    plan_rows = "\n        ".join(
        f'''<tr><td>{p["when"]}</td><td data-l="Topic"><strong>{p["title"]}</strong><br>{p["text"]}{linkrow(p["links"])}</td></tr>'''
        for p in PLAN)
    decks = "\n        ".join(
        f'<li><span class="when">{d["date"]}</span><div><p>{link(d["title"], "deck:" + d["key"])}</p></div></li>' for d in DECKS)
    nbs = "\n        ".join(
        f'<li><span class="when">{w}</span><div><p><a href="{u}" rel="noopener">{t}</a></p></div></li>' for w, t, u in NOTEBOOKS)
    return res_sub("Meeting materials", "") + f'''<section class="section">
  <div class="wrap">
    <h2>This year's plan</h2>
    <p class="intro">What Foundations meetings cover, month by month. Linked slides and notebooks are from last year's sessions on the same topics, and the schedule can shift.</p>
    <table class="plan">
      <thead><tr><th scope="col">When</th><th scope="col">Topic</th></tr></thead>
      <tbody>
        {plan_rows}
      </tbody>
    </table>
  </div>
</section>

<section class="section section--soft">
  <div class="wrap two">
    <div>
      <h2>Slide decks</h2>
      <ul class="dated">
        {decks}
      </ul>
    </div>
    <div>
      <h2>Notebooks</h2>
      <ul class="dated">
        {nbs}
      </ul>
    </div>
  </div>
</section>
'''


def page_learn():
    stages = []
    for n, s in enumerate(STAGES, 1):
        stages.append(f'''<details class="stage" id="stage-{s["key"]}"{" open" if n == 1 else ""}>
        <summary><span class="num">{n}</span><span class="st-title">{s["title"]}</span><span class="st-goal">{s["goal"]}</span></summary>
        <div class="body">
          <ul class="res">
          {res_list(s["items"], show_role=True)}
          </ul>
          <label class="task"><input type="checkbox" data-task="{s["key"]}"><span><b>Show you're ready:</b> {s["task"]}</span></label>
        </div>
      </details>''')
    return res_sub("Learning path", "Seven stages from a first line of Python to your own project.") + f'''<section class="section">
  <div class="narrow">
    <p>Each stage has one or two resources marked <em>Start here</em>. The rest are alternatives or references, so you don't need to finish them all. A stage is done when you've finished its task, and you can start a project of your own after stage 3.</p>
    <p class="meta">Resources were chosen because they are free, widely used, and assume no more than the stage before them. Times are estimates.</p>
    <div class="planner-bar">
      <span data-progress-label></span>
      <button type="button" data-reset>Reset progress</button>
    </div>
    <p class="meta">Progress is saved in this browser on this device only.</p>
    {"".join(stages)}
  </div>
</section>
'''


def page_project_guide():
    blocks = []
    for b in BUILD_SECTION:
        intro = f'<p>{b["intro"]}</p>' if b["intro"] else ""
        blocks.append(f'''<h2>{b["title"]}</h2>
      {intro}<ul class="res">
        {res_list(b["items"])}
      </ul>''')
    return res_sub("Project guide", "") + f'''<section class="section">
  <div class="narrow">
    <h2>Ideas to start from</h2>
    <ul>{"".join(f"<li>{i}</li>" for i in IDEAS)}</ul>
    {"".join(blocks)}
  </div>
</section>
'''


def page_reading():
    sessions = []
    for n, s in enumerate(SAFETY, 1):
        req = [i for i in s["items"] if i["role"] == "start"]
        opt = [i for i in s["items"] if i["role"] != "start"]
        opt_html = f'<h3>Optional</h3><ul class="res">{res_list(opt)}</ul>' if opt else ""
        sessions.append(f'''<section class="session">
        <h2>Session {n}: {s["title"]}</h2>
        <p><strong>By the end you can:</strong> {s["objective"][0].lower() + s["objective"][1:]}</p>
        <h3>Required</h3>
        <ul class="res">{res_list(req)}</ul>
        {opt_html}
        <p><strong>Discuss:</strong> {s["discuss"]}</p>
      </section>''')
    return res_sub("Reading group", "A seven-session plan for the AI, Ethics and Society group.") + f'''<section class="section">
  <div class="narrow">
    <p>{SAFETY_META["source"]} {SAFETY_META["maintainer"]} {SAFETY_META["reviewed"]}</p>
    <p>Required material takes about half an hour per session. In discussion, try to separate three things: what was measured, how someone interpreted it, and what they predict will happen next.</p>
    {"".join(sessions)}
  </div>
</section>
'''


def page_opportunities():
    return res_sub("Opportunities", "") + f'''<section class="section">
  <div class="narrow">
    <ul class="res">
      {res_list(PROGRAMS)}
    </ul>
  </div>
</section>
'''


def page_news():
    items = []
    for n in NEWS:
        act = f'<p class="act"><a class="more" href="{n["link"][1]}">{n["link"][0]}</a></p>' if n["link"] else ""
        items.append(f'''<li id="{n["id"]}"><time datetime="{n["iso"]}">{n["date"]}</time>
        <div><h2>{n["title"]}</h2><p>{n["body"]}</p>{act}</div></li>''')
    return pagetop(["News"], "News", "Week-to-week reminders go out on Google Classroom.") + f'''<section class="section">
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
                   f"Any {SITE['school']} student can join. There's no tryout and no cost, and you don't need to know how to code."
                   ) + f'''<section class="section">
  <div class="wrap split">
    <div id="form">
      {anchors}
      <h2>Sign up</h2>
      <form class="form" data-apply>
        <div class="f2">
          <div class="f"><label for="n">Full name</label><input id="n" name="name" type="text" autocomplete="name" required></div>
          <div class="f"><label for="e">School email</label><input id="e" name="email" type="email" autocomplete="email" required></div>
        </div>
        <div class="f2">
          <div class="f"><label for="g">Grade</label>
            <select id="g" name="grade" required><option value="">Select your grade</option><option>9</option><option>10</option><option>11</option><option>12</option></select>
          </div>
          <div class="f"><label for="t">Track</label>
            <select id="t" name="track">
              <option data-key="unsure">Not sure yet</option>
              <option data-key="foundations">Foundations Program</option>
              <option data-key="division">Applied Research Division</option>
            </select>
          </div>
        </div>
        <div class="f"><label for="gr">Research group</label>
          <select id="gr" name="group"><option data-key="">Not sure yet</option>{group_opts}</select>
          <p class="help">Optional. You can change it later.</p>
        </div>
        <div class="f"><label for="x">Experience so far</label>
          <input id="x" name="experience" type="text">
          <p class="help">Optional. Classes, languages, or projects.</p>
        </div>
        <div class="f" data-idea hidden><label for="s">Project idea</label>
          <textarea id="s" name="statement"></textarea>
          <p class="help">A couple of sentences about what you'd like to build.</p>
        </div>
        <p class="form-how">This form can't send anything by itself. The button opens your email app with a message to <strong data-email>our address</strong> already written, and you press send there. An officer replies by email. If you don't hear back, mention it at the next meeting.</p>
        <div class="form-actions">
          <button class="btn" type="submit">Create sign-up email</button>
          <button class="btn btn--ghost" type="button" data-copy>Copy the message</button>
        </div>
        <p class="fstatus" role="status"></p>
      </form>
    </div>
    <aside class="side">
      <h2>At a glance</h2>
      <dl>
        <dt>Meetings</dt><dd>{SITE["meets"]}</dd>
        <dt>Room</dt><dd>700F</dd>
        <dt>First meeting of {YEAR}</dt><dd>Not set yet. It will be posted on <a href="news.html">News</a> and Google Classroom.</dd>
        <dt>Google Classroom</dt><dd>{SITE["code"]}</dd>
        <dt>Instagram</dt><dd>@{SITE["instagram"]}</dd>
      </dl>
    </aside>
  </div>
</section>

<section class="section section--soft" id="tracks">
  <div class="wrap">
    <h2>Two tracks</h2>
    <p class="intro">You <em>sign up</em> for Foundations, and everyone who signs up is in. You <em>apply</em> to the Applied Research Division with a short project idea, so an officer can help shape it and find you a team.</p>
    <table class="twocol">
      <thead><tr><td></td><th scope="col">Foundations Program</th><th scope="col">Applied Research Division</th></tr></thead>
      <tbody>
        <tr><th scope="row">Who it suits</th>
          <td data-l="Foundations">Anyone new to AI or coding, in any grade. Most ninth and tenth graders start here, and so do juniors and seniors who haven't programmed before.</td>
          <td data-l="Applied Research">Members who have finished Foundations or have built a project before. Mostly juniors and seniors.</td></tr>
        <tr><th scope="row">What you do</th>
          <td data-l="Foundations">Learn Python, work with data, enter a Kaggle competition, and train a neural network in December. Build your own project in the spring.</td>
          <td data-l="Applied Research">Build a project in a team of two to four inside a research group, and present it at the end of the semester.</td></tr>
        <tr><th scope="row">Time outside meetings</th>
          <td data-l="Foundations">About an hour between meetings.</td>
          <td data-l="Applied Research">About two hours a week while your project is running.</td></tr>
      </tbody>
    </table>
    <p><strong>Joining after the year has started?</strong> Come to any meeting and tell an officer you're new. What we've covered so far is under <a href="materials.html">Meeting materials</a>.</p>
  </div>
</section>

<section class="section">
  <div class="narrow">
    <h2>Questions</h2>
    <div class="faq">
      <details open><summary>Do I need to know how to code?</summary><div class="ans"><p>No. Foundations starts from the first line of Python. The Applied Research Division expects you to be able to write and fix your own code.</p></div></details>
      <details><summary>When do I pick a research group?</summary><div class="ans"><p>You can name one when you sign up and change it at any time. Applied Research teams work with their group from October. Foundations members join group activities in the second semester.</p></div></details>
      <details><summary>Do I need my own laptop?</summary><div class="ans"><p>It helps, but it isn't required. Everything runs in a browser, and Google Colab and Kaggle provide the computing power.</p></div></details>
      <details><summary>What if I miss a meeting?</summary><div class="ans"><p>Slides and notebooks are posted on Google Classroom, and the main ones are linked under Meeting materials.</p></div></details>
      <details><summary>Can I bring a friend?</summary><div class="ans"><p>Yes. Anyone can come to a meeting before signing up.</p></div></details>
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
    ("body text on white", "#10192a", "#ffffff"), ("secondary text on white", "#3a4759", "#ffffff"),
    ("muted text on white", "#566274", "#ffffff"), ("muted text on soft", "#566274", "#f3f5f8"),
    ("secondary text on soft", "#3a4759", "#f3f5f8"), ("link on white", "#1a4fc4", "#ffffff"),
    ("link on soft", "#1a4fc4", "#f3f5f8"), ("white on button blue", "#ffffff", "#1a4fc4"),
    ("crumb on soft", "#566274", "#f3f5f8"), ("hero subtitle on navy", "#d3deee", "#060f1e"),
    ("nav link on masthead", "#c9d6e8", "#0b1b33"), ("brand subtitle on masthead", "#a3b6d1", "#0b1b33"),
    ("footer text", "#c3d1e4", "#0b1b33"), ("footer heading", "#a3b6d1", "#0b1b33"),
    ("demo text on navy", "#c9d6e8", "#0b1b33"), ("demo readout on navy", "#ffffff", "#0b1b33"),
    ("code comment", "#8fa1b8", "#0b1524"), ("code string", "#9ad4a0", "#0b1524"), ("code key", "#f0b26b", "#0b1524"), ("code punctuation", "#9fb0c6", "#0b1524"),
    ("start label", "#14502f", "#ffffff"),
]

BANNED = [
    "—", "–", "delve", "seamless", "cutting-edge", "leverage", "in today's", "game-chang", "unlock",
    "empower", "dive into", "at the intersection of", "journey", "elite", "rather than", "actually run",
    "count as a failure", "2026 to 2027", "this page has", "use this page", "come first, followed by",
    "funny, and", "the other side.", "look at who signed", "written for adults", "every tuesday",
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
        ("index.html", "Home", "The AI and machine learning club at " + SITE["school"] + ". Learn how AI works and build your own projects.", "home", page_index()),
        ("research.html", "Research groups", "Compare SAIL's six research groups.", "research", page_research()),
        ("projects.html", "Projects", "Projects by SAIL members.", "projects", page_projects()),
        ("people.html", "People", "The student officers who run SAIL.", "people", page_people()),
        ("resources.html", "Resources", "Meeting materials and recommended courses.", "resources", page_resources()),
        ("materials.html", "Meeting materials", "This year's plan, slide decks, and notebooks.", "resources", page_materials()),
        ("learn.html", "Learning path", "Seven stages from Python basics to your own AI project.", "resources", page_learn()),
        ("project-guide.html", "Project guide", "Ideas, datasets, templates, and tools for a SAIL project.", "resources", page_project_guide()),
        ("reading.html", "Reading group", "A seven-session reading plan on fairness, safety, and AI policy.", "resources", page_reading()),
        ("opportunities.html", "Opportunities", "Competitions and summer programs.", "resources", page_opportunities()),
        ("news.html", "News", "Announcements from SAIL.", "news", page_news()),
        ("join.html", "Join", "How to join SAIL, and the sign-up form.", "join", page_join()),
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
        scenes = {"nlp.html": ["bot", "scene-nlp"], "agents.html": ["bot", "scene-agents"], "society.html": ["bot", "scene-agents", "scene-ethics"]}
        extra = "".join(f'<script src="assets/js/{s}.js"></script>\n' for s in ["demos"] + scenes.get(filename, [])) if active == "group" else ""
        html = head(title, desc) + masthead(active) + body + footer(extra)
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

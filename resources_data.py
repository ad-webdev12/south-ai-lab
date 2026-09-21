"""
Content for the Resources page.

Every link here was checked by script on 2026-09-21. The picks are deliberately
few: the goal is to get a member from zero to their own project, not to cover
the whole field. Add a resource only if you would tell a friend to use it.

Item fields: title, url, kind (Course / Video / Interactive / Article / Book /
Tool / Club slides / Club notebook), time (optional), note.
"""


def item(title, url, kind, time, note):
    return {"title": title, "url": url, "kind": kind, "time": time, "note": note}


# ------------------------------------------------------------------ club decks

DECKS = [
    {"key": "nlp", "date": "Apr 21, 2026", "title": "Intro to NLP", "access": "public",
     "url": "https://docs.google.com/presentation/d/1VUgiyXBDiHxhG9FNz5aco_8p5V36rizWplrHiq9wcpY/edit"},
    {"key": "python-3", "date": "Mar 17, 2026", "title": "Python lessons", "access": "public",
     "url": "https://docs.google.com/presentation/d/1s_toAhZVlc2zK7X6OPvAvsPYc55O6KN-sAB9eXf7XUQ/edit"},
    {"key": "vision", "date": "Mar 3, 2026", "title": "Intro to computer vision using Teachable Machine", "access": "public",
     "url": "https://docs.google.com/presentation/d/17pi6w3cpUJ148eE2kXSlHaxQWI9_JwpTajGQzl5cl04/edit"},
    {"key": "llm-2026", "date": "Jan 6, 2026", "title": "LLMs and intro to the project", "access": "public",
     "url": "https://docs.google.com/presentation/d/1Ppeo3R7W836nlh6s8xNREOOieh3VH0NeGBWoyY9HdWI/edit"},
    {"key": "python-2", "date": "Nov 18, 2025", "title": "Introduction to Python, lesson 2: seaborn, cleaning, scikit-learn", "access": "public",
     "url": "https://docs.google.com/presentation/d/1o2PBl7aymTzIgVt08f6sctDILwoIu4qsS6ILX9zQG2Q/edit"},
    {"key": "getting-started", "date": "Nov 4, 2025", "title": "Getting started with machine learning", "access": "public",
     "url": "https://docs.google.com/presentation/d/1c8im1d5_Q7FTEMrJRZTxFBvBq8hFtXyr_K-NRg4gFa4/edit"},
    {"key": "intro-2025", "date": "Oct 21, 2025", "title": "AI and machine learning intro slides", "access": "public",
     "url": "https://docs.google.com/presentation/d/1q5pZES0FQtn7BzwxwqVAe_s1cmQGfHqCc6aOjmAKKuY/edit"},
    {"key": "llm-2025", "date": "Feb 18, 2025", "title": "Large language models", "access": "school",
     "url": "https://docs.google.com/presentation/d/1_ws9sbxlk37RvVBoQyLy4C7CJ7bG2RseZZJAv4aleTI/edit"},
    {"key": "intro-2024", "date": "Oct 15, 2024", "title": "Interest meeting slides", "access": "public",
     "url": "https://docs.google.com/presentation/d/1aEFNgorBKuMtyNjVKL6ajOIUoSK8zbhX-gpvuA-sTNU/edit"},
    {"key": "intro-2022", "date": "Sep 27, 2022", "title": "First interest meeting", "access": "public",
     "url": "https://docs.google.com/presentation/d/1aapQT73VTPIHOL4lemiHQpwEhnhkWlzw0h6R74nbUlw/edit"},
]

_DECK = {d["key"]: d["url"] for d in DECKS}
MNIST_NB = "https://github.com/helenc3/demo_notebooks/blob/main/mnistdemo.ipynb"
PREP_NB = "https://github.com/helenc3/demo_notebooks/blob/main/Data_preprocessing.ipynb"

# ------------------------------------------------------------------ this year's plan

PLAN = [
    {"when": "October", "title": "What AI is, and Python basics",
     "text": "How machine learning differs from ordinary programming, then variables, loops, functions, and notebooks.",
     "links": [("Intro slides", "deck:intro-2025"), ("Python slides", "deck:python-3")]},
    {"when": "November", "title": "Working with data, and your first models",
     "text": "pandas, cleaning data, charts with seaborn, training and testing models with scikit-learn. Teams enter a Kaggle competition.",
     "links": [("Getting started slides", "deck:getting-started"), ("Data science slides", "deck:python-2"),
               ("Preprocessing notebook", PREP_NB), ("Titanic competition", "https://www.kaggle.com/competitions/titanic")]},
    {"when": "December", "title": "Neural networks",
     "text": "How a network learns, then a convolutional network in Keras that reads handwritten digits.",
     "links": [("MNIST notebook", MNIST_NB)]},
    {"when": "January", "title": "Large language models",
     "text": "How chatbots work, what they get wrong, and a project comparing two models.",
     "links": [("LLM slides", "deck:llm-2026")]},
    {"when": "February and March", "title": "Computer vision",
     "text": "Train image, pose, and sound classifiers, then test them on inputs they haven't seen.",
     "links": [("Computer vision slides", "deck:vision")]},
    {"when": "April", "title": "Natural language processing",
     "text": "How text becomes numbers, and writing a small NLP program of your own.",
     "links": [("NLP slides", "deck:nlp")]},
    {"when": "May and June", "title": "Your own project",
     "text": "Build something you chose, write it up, and present it at the last meetings of the year.",
     "links": [("Project tools", "resources.html#build")]},
]

# ------------------------------------------------------------------ learning planner

STAGES = [
    {"key": "python", "title": "Python basics",
     "goal": "You can write a function, loop over a list, and make sense of an error message.",
     "items": [
         item("Kaggle Learn: Python", "https://www.kaggle.com/learn/python", "Course", "5 hours",
              "Short lessons with exercises that run in your browser. This is the course we use in meetings."),
         item("CS50's Introduction to Programming with Python", "https://cs50.harvard.edu/python/2022/", "Course", "weeks 0 to 4",
              "Harvard's free beginner course. Do the first few weeks if you want more practice than Kaggle gives you."),
         item("Python lessons", _DECK["python-3"], "Club slides", "",
              "Our own deck from the March 2026 Python session."),
     ],
     "try": "Write a number guessing game, or a program that finds the ten most common words in a text file."},

    {"key": "data", "title": "Working with data",
     "goal": "You can load a CSV, clean it up, and make a chart that answers a question.",
     "items": [
         item("Kaggle Learn: Pandas", "https://www.kaggle.com/learn/pandas", "Course", "4 hours",
              "Loading, filtering, grouping, and combining tables of data."),
         item("Kaggle Learn: Data Visualization", "https://www.kaggle.com/learn/data-visualization", "Course", "4 hours",
              "Making line charts, bar charts, heatmaps, and scatter plots with seaborn."),
         item("NumPy: the absolute basics for beginners", "https://numpy.org/doc/stable/user/absolute_beginners.html", "Article", "2 hours",
              "The official beginner's guide to arrays, which every ML library is built on."),
         item("Data preprocessing notebook", PREP_NB, "Club notebook", "",
              "The notebook from our November 2025 session: missing values, encoding, scaling, and splitting."),
         item("Python Data Science Handbook", "https://jakevdp.github.io/PythonDataScienceHandbook/", "Book", "reference",
              "Free online. Look things up here when a pandas or Matplotlib question comes up."),
     ],
     "try": "Pick any dataset on Kaggle and make three charts that each answer one question about it."},

    {"key": "classical-ml", "title": "Your first models",
     "goal": "You can train a model, test it on data it hasn't seen, and explain what the score means.",
     "items": [
         item("Kaggle Learn: Intro to Machine Learning", "https://www.kaggle.com/learn/intro-to-machine-learning", "Course", "3 hours",
              "Decision trees, validation, overfitting, and random forests, ending with a competition entry."),
         item("Machine Learning for Everybody", "https://www.youtube.com/watch?v=i_LwzRVP7bg", "Video", "4 hours",
              "Kylie Ying explains and codes the classic algorithms in Google Colab, one at a time."),
         item("MLU-Explain", "https://mlu-explain.github.io", "Interactive", "2 hours",
              "Visual explanations of ideas such as train and test splits, bias and variance, and decision trees."),
         item("Kaggle Learn: Intermediate Machine Learning", "https://www.kaggle.com/learn/intermediate-machine-learning", "Course", "4 hours",
              "Missing values, categorical columns, pipelines, cross-validation, and XGBoost. Useful for raising your Titanic score."),
         item("scikit-learn: Getting Started", "https://scikit-learn.org/stable/getting_started.html", "Article", "1 hour",
              "How the library we use fits models, builds pipelines, and scores results."),
         item("Getting started with machine learning", _DECK["getting-started"], "Club slides", "",
              "Our deck from the November 2025 session."),
     ],
     "try": "Enter the <a href=\"https://www.kaggle.com/competitions/titanic\" rel=\"noopener\">Titanic competition</a> on Kaggle and try to beat 78% accuracy."},

    {"key": "deep-learning", "title": "Neural networks",
     "goal": "You can explain how a network learns, and train one in Keras.",
     "items": [
         item("3Blue1Brown: Neural Networks", "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi", "Video", "1 hour",
              "Watch the first four videos: what a neural network is, how it learns, and backpropagation. Start here."),
         item("TensorFlow Playground", "https://playground.tensorflow.org/", "Interactive", "30 minutes",
              "Train a tiny network in your browser and watch what each neuron learns."),
         item("Kaggle Learn: Intro to Deep Learning", "https://www.kaggle.com/learn/intro-to-deep-learning", "Course", "4 hours",
              "Build and train networks in Keras, including dropout and batch normalization."),
         item("MNIST demo notebook", MNIST_NB, "Club notebook", "",
              "The convolutional network from our December 2025 session. Run it, then change it."),
         item("3Blue1Brown: Essence of Linear Algebra", "https://www.3blue1brown.com/topics/linear-algebra", "Video", "3 hours",
              "Vectors and matrices explained with animation. Watch when the math starts to feel like a wall."),
         item("The spelled-out intro to neural networks and backpropagation", "https://youtu.be/VMj-3S1tku0", "Video", "2.5 hours",
              "Andrej Karpathy builds a neural network library from nothing. Harder, and worth it."),
     ],
     "try": "Run the MNIST notebook, then change one thing at a time (layers, epochs, dropout) and record what happens to accuracy."},

    {"key": "vision", "title": "Computer vision",
     "goal": "You can train an image classifier on your own photos and find where it fails.",
     "items": [
         item("Teachable Machine", "https://teachablemachine.withgoogle.com/", "Interactive", "30 minutes",
              "Train an image, pose, or sound classifier from your webcam. No code."),
         item("CNN Explainer", "https://poloclub.github.io/cnn-explainer/", "Interactive", "30 minutes",
              "See what each layer of a convolutional network does to an image."),
         item("Kaggle Learn: Computer Vision", "https://www.kaggle.com/learn/computer-vision", "Course", "4 hours",
              "Convolutions, pooling, data augmentation, and transfer learning in Keras."),
         item("Keras datasets", "https://keras.io/api/datasets/", "Tool", "",
              "MNIST, Fashion-MNIST, and CIFAR-10, each loadable in one line."),
         item("Intro to computer vision", _DECK["vision"], "Club slides", "",
              "Our deck from the March 2026 workshop."),
     ],
     "try": "Take 50 photos of two or three objects at home, train a classifier on them, and find three photos that fool it."},

    {"key": "nlp-llm", "title": "Language models",
     "goal": "You can explain how a chatbot produces text, and use a pretrained model in your own code.",
     "items": [
         item("Intro to Large Language Models", "https://www.youtube.com/watch?v=zjkBMFhNj_g", "Video", "1 hour",
              "Andrej Karpathy's general-audience talk on what LLMs are and how they're trained."),
         item("Transformer Explainer", "https://poloclub.github.io/transformer-explainer/", "Interactive", "30 minutes",
              "Type a sentence and watch a real GPT-2 model predict the next word, step by step."),
         item("The Illustrated Transformer", "https://jalammar.github.io/illustrated-transformer/", "Article", "1 hour",
              "The standard visual walkthrough of attention and the transformer architecture."),
         item("Hugging Face LLM Course", "https://huggingface.co/learn/nlp-course/chapter1/1", "Course", "chapters 1 to 3",
              "Use pretrained models for classification, summarizing, and generation in a few lines of Python."),
         item("Prompt Engineering Guide", "https://www.promptingguide.ai/", "Article", "3 hours",
              "Techniques for getting better results out of language models, with examples."),
         item("Intro to NLP", _DECK["nlp"], "Club slides", "",
              "Our deck from the April 2026 workshop."),
         item("Let's build GPT", "https://www.youtube.com/watch?v=kCc8FmEb1nY", "Video", "2 hours",
              "Karpathy codes a small GPT from an empty file. Save this for after the neural networks stage."),
     ],
     "try": "Run a pretrained sentiment model from Hugging Face on 20 reviews you write yourself. Where does it get confused?"},

    {"key": "agents-rl", "title": "Agents and reinforcement learning",
     "goal": "You can train an agent to play a simple game, or build an assistant that uses a tool.",
     "items": [
         item("Hugging Face Deep RL Course", "https://huggingface.co/learn/deep-rl-course/unit0/introduction", "Course", "units 1 and 2",
              "You train a lunar lander in the first unit. Units 1 and 2 are enough to start a project."),
         item("Gymnasium", "https://gymnasium.farama.org/", "Tool", "",
              "The standard library of game environments for reinforcement learning, with tutorials."),
         item("Hugging Face Agents Course", "https://huggingface.co/learn/agents-course", "Course", "unit 1",
              "What an AI agent is, how tool use works, and how to build a simple one."),
         item("Reinforcement Learning: An Introduction", "http://incompleteideas.net/book/the-book-2nd.html", "Book", "reference",
              "Sutton and Barto's textbook, free online. Chapter 1 is a readable overview. Look up the rest if you want the theory."),
     ],
     "try": "Train an agent to land the Lunar Lander in Gymnasium, then change the reward and see how its behavior shifts."},
]

# ------------------------------------------------------------------ build your project

IDEAS = [
    "Predict something about your own life from data you collect: sleep, screen time, grades, or running times.",
    "A classifier that sorts photos from your phone into categories you choose.",
    "A model that guesses the genre of a song from its lyrics.",
    "A study assistant that answers questions about your own class notes.",
    "A game-playing agent for a simple game you know well.",
    "A fairness check of a model someone else in the club built.",
]

BUILD_SECTION = [
    {"key": "data", "title": "Find data",
     "intro": "Most projects start with a dataset. These four sources are good places to look.",
     "items": [
         item("Kaggle Datasets", "https://www.kaggle.com/datasets", "Tool", "", "The largest collection, with notebooks showing how other people used each dataset."),
         item("Hugging Face Datasets", "https://huggingface.co/datasets", "Tool", "", "Text, image, and audio datasets that load in one line of Python."),
         item("UCI Machine Learning Repository", "https://archive.ics.uci.edu/", "Tool", "", "Small, clean, classic datasets. Good for a first project."),
         item("Keras datasets", "https://keras.io/api/datasets/", "Tool", "", "MNIST, Fashion-MNIST, CIFAR-10, and a few more, built into Keras."),
     ]},
    {"key": "share", "title": "Share what you made",
     "intro": "Put your code and a demo online so other people can try your project.",
     "items": [
         item("Project README template", "assets/docs/project-template.md", "Template", "", "Our one-page template: the question, the data, how to run it, results, and limitations."),
         item("GitHub: Hello World", "https://docs.github.com/en/get-started/start-your-journey/hello-world", "Article", "30 minutes", "Make your first repository and learn the basics of saving code online."),
         item("Gradio", "https://www.gradio.app/", "Tool", "", "Turn a Python function into a web demo with a few lines of code."),
         item("Streamlit", "https://streamlit.io/", "Tool", "", "Build a small data app in pure Python."),
         item("Hugging Face Spaces", "https://huggingface.co/spaces", "Tool", "", "Free hosting for Gradio and Streamlit demos."),
     ]},
    {"key": "responsible", "title": "Check your model",
     "intro": "Before you present, find out who your model works badly for, and write it down.",
     "items": [
         item("Kaggle Learn: Model Cards", "https://www.kaggle.com/code/var0101/model-cards", "Article", "20 minutes", "What a model card is and what goes in one, with examples."),
         item("AI Explorables", "https://pair.withgoogle.com/explorables/", "Interactive", "1 hour", "Short interactive essays from Google on fairness, bias in datasets, and how models fail."),
         item("Kaggle Learn: Intro to AI Ethics", "https://www.kaggle.com/learn/intro-to-ai-ethics", "Course", "4 hours", "Short lessons with exercises on spotting bias and measuring fairness. The Model Cards lesson above is part of it."),
     ]},
]

# ------------------------------------------------------------------ AI safety reading group

SAFETY = [
    {"title": "Where AI is headed",
     "question": "How fast is AI improving, and what is driving it?",
     "items": [
         item("Task-Completion Time Horizons", "https://metr.org/time-horizons/", "Article", "10 minutes",
              "METR measures how long a task AI systems can finish on their own, and how quickly that number is growing."),
         item("Trends in Artificial Intelligence", "https://epoch.ai/trends", "Interactive", "15 minutes",
              "Epoch AI's charts of the computing power, data, and money going into AI."),
         item("Can AI scaling continue through 2030?", "https://epoch.ai/blog/can-ai-scaling-continue-through-2030", "Article", "10 minutes",
              "Read the summary: what could limit AI progress, from power to chips to data."),
     ]},
    {"title": "When AI does what you said, not what you meant",
     "question": "Why is it hard to tell a machine what you really want?",
     "items": [
         item("Specification gaming: the flip side of AI ingenuity", "https://deepmind.google/blog/specification-gaming-the-flip-side-of-ai-ingenuity/", "Article", "15 minutes",
              "Google DeepMind's collection of AI systems that found loopholes in their instructions. Funny, and a little worrying."),
         item("Aligning language models to follow instructions", "https://openai.com/blog/instruction-following/", "Article", "15 minutes",
              "How OpenAI used human feedback to make GPT-3 follow instructions, the method behind today's chatbots."),
         item("Playing the training game", "https://www.planned-obsolescence.org/the-training-game/", "Article", "20 minutes",
              "Why a model trained on human approval might learn to look good instead of being good."),
     ]},
    {"title": "When a model learns the wrong goal",
     "question": "Can a model pass every test and still want the wrong thing?",
     "items": [
         item("The other AI alignment problem: mesa-optimizers", "https://www.youtube.com/watch?v=bJLcIBixGj8", "Video", "23 minutes",
              "Robert Miles explains how a trained model can end up with a goal that differs from the one it was trained on."),
         item("Alignment faking in large language models", "https://www.anthropic.com/research/alignment-faking", "Article", "15 minutes",
              "An Anthropic experiment where a model behaved differently when it believed it was being trained."),
         item("Sycophancy to subterfuge", "https://www.anthropic.com/research/reward-tampering", "Article", "15 minutes",
              "How small habits such as flattery can generalize into a model tampering with its own reward."),
     ]},
    {"title": "What could go wrong at scale",
     "question": "Why do serious researchers worry about this, and are they right?",
     "items": [
         item("Why would AI want to do bad things? Instrumental convergence", "https://www.youtube.com/watch?v=ZeecOKBus3Q", "Video", "10 minutes",
              "Robert Miles on why almost any goal leads a capable system to seek resources and avoid being shut off."),
         item("A guide to understanding AI as normal technology", "https://www.normaltech.ai/p/a-guide-to-understanding-ai-as-normal", "Article", "10 minutes",
              "The other side. Two Princeton researchers argue that AI will spread slowly, the way earlier technologies did. Read the section called A restatement of our thesis, and the one after it about AI 2027."),
         item("Statement on AI Risk", "https://safe.ai/work/statement-on-ai-risk", "Article", "2 minutes",
              "One sentence, signed by hundreds of AI scientists and company leaders. Look at who signed."),
         item("We're not ready for superintelligence", "https://www.youtube.com/watch?v=5KVDDfAkRgc", "Video", "35 minutes",
              "A video walkthrough of the AI 2027 scenario. Come ready to argue about which parts are plausible."),
     ]},
    {"title": "Looking inside models, and keeping them in check",
     "question": "How can we tell what a model is doing, and limit the damage if it misbehaves?",
     "items": [
         item("Tracing the thoughts of a large language model", "https://www.anthropic.com/research/tracing-thoughts-language-model", "Article", "15 minutes",
              "Anthropic researchers look inside a model as it plans a rhyme, does arithmetic, and makes something up."),
         item("Using dangerous AI, but safely?", "https://www.youtube.com/watch?v=0pgEMWy70Qk", "Video", "30 minutes",
              "Robert Miles explains AI control: getting useful work out of a model you don't fully trust."),
         item("Agentic misalignment", "https://www.anthropic.com/research/agentic-misalignment", "Article", "20 minutes",
              "Stress tests where AI agents, given a goal and a threat, chose harmful actions. It's long: read the introduction and the blackmail example, then skim the rest."),
     ]},
    {"title": "Rules, laws, and what you can do",
     "question": "Who should be responsible for AI, and where could you fit in?",
     "items": [
         item("The AI regulator's toolbox", "https://adamjones.me/blog/ai-regulator-toolbox/", "Article", "20 minutes",
              "A long list of the things governments can do about AI. Don't read it all. Pick three tools and read the pros and cons of each."),
         item("Computing power and the governance of AI", "https://www.governance.ai/analysis/computing-power-and-the-governance-of-ai", "Article", "15 minutes",
              "Why the chips used to train AI are one of the few things regulators can track."),
         item("AI safety technical research", "https://80000hours.org/career-reviews/ai-safety-researcher/", "Article", "20 minutes",
              "What a career in AI safety research looks like. It's long and written for adults, so read the opening summary and the section called How to enter."),
     ]},
]

# ------------------------------------------------------------------ competitions and programs

PROGRAMS = [
    item("Kaggle: Titanic", "https://www.kaggle.com/competitions/titanic", "Competition", "",
         "The standard first competition. Our teams entered it in November 2025. It never closes."),
    item("Kaggle: Housing Prices", "https://www.kaggle.com/competitions/home-data-for-ml-course", "Competition", "",
         "The competition that Kaggle's Intro to Machine Learning course ends with. You predict a number this time, not a category."),
    item("Deep-ML practice problems", "https://www.deep-ml.com/problems", "Practice", "",
         "Short coding problems where you implement pieces of machine learning yourself, checked in the browser."),
    item("MIT Beaver Works Summer Institute", "https://bwsi.mit.edu/", "Summer program", "",
         "A summer program from MIT Lincoln Laboratory with AI, robotics, and cybersecurity courses. Applications are usually due in March, and the online prerequisites count toward admission. Past members have attended."),
    item("Inspirit AI", "https://www.inspiritai.com/", "Summer program", "",
         "An online, project-based AI program for high school students. It charges tuition."),
]

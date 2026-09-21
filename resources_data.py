"""
Content for the Resources pages.

Links were checked by script in September 2026. Keep the lists short: the goal is to
get a member from zero to their own project, not to cover the field.

item(title, url, kind, time, note, role)
  role: "start" (do this one), "practice" (optional, more of the same), "reference" (look things up)
  time is always an estimate.
"""


def item(title, url, kind, time, note, role="practice"):
    return {"title": title, "url": url, "kind": kind, "time": time, "note": note, "role": role}


# ------------------------------------------------------------------ club decks

DECKS = [
    {"key": "nlp", "date": "April 21, 2026", "title": "Intro to NLP", "access": "public",
     "url": "https://docs.google.com/presentation/d/1VUgiyXBDiHxhG9FNz5aco_8p5V36rizWplrHiq9wcpY/edit"},
    {"key": "python-3", "date": "March 17, 2026", "title": "Python lessons", "access": "public",
     "url": "https://docs.google.com/presentation/d/1s_toAhZVlc2zK7X6OPvAvsPYc55O6KN-sAB9eXf7XUQ/edit"},
    {"key": "vision", "date": "March 3, 2026", "title": "Intro to computer vision using Teachable Machine", "access": "public",
     "url": "https://docs.google.com/presentation/d/17pi6w3cpUJ148eE2kXSlHaxQWI9_JwpTajGQzl5cl04/edit"},
    {"key": "llm-2026", "date": "January 6, 2026", "title": "LLMs and intro to the project", "access": "public",
     "url": "https://docs.google.com/presentation/d/1Ppeo3R7W836nlh6s8xNREOOieh3VH0NeGBWoyY9HdWI/edit"},
    {"key": "python-2", "date": "November 18, 2025", "title": "Introduction to Python, lesson 2: seaborn, cleaning, scikit-learn", "access": "public",
     "url": "https://docs.google.com/presentation/d/1o2PBl7aymTzIgVt08f6sctDILwoIu4qsS6ILX9zQG2Q/edit"},
    {"key": "getting-started", "date": "November 4, 2025", "title": "Getting started with machine learning", "access": "public",
     "url": "https://docs.google.com/presentation/d/1c8im1d5_Q7FTEMrJRZTxFBvBq8hFtXyr_K-NRg4gFa4/edit"},
    {"key": "intro-2025", "date": "October 21, 2025", "title": "AI and machine learning intro slides", "access": "public",
     "url": "https://docs.google.com/presentation/d/1q5pZES0FQtn7BzwxwqVAe_s1cmQGfHqCc6aOjmAKKuY/edit"},
    {"key": "llm-2025", "date": "February 18, 2025", "title": "Large language models", "access": "school",
     "url": "https://docs.google.com/presentation/d/1_ws9sbxlk37RvVBoQyLy4C7CJ7bG2RseZZJAv4aleTI/edit"},
    {"key": "intro-2024", "date": "October 15, 2024", "title": "Interest meeting slides", "access": "public",
     "url": "https://docs.google.com/presentation/d/1aEFNgorBKuMtyNjVKL6ajOIUoSK8zbhX-gpvuA-sTNU/edit"},
    {"key": "intro-2022", "date": "September 27, 2022", "title": "First interest meeting", "access": "public",
     "url": "https://docs.google.com/presentation/d/1aapQT73VTPIHOL4lemiHQpwEhnhkWlzw0h6R74nbUlw/edit"},
]

_DECK = {d["key"]: d["url"] for d in DECKS}
MNIST_NB = "https://github.com/helenc3/demo_notebooks/blob/main/mnistdemo.ipynb"
PREP_NB = "https://github.com/helenc3/demo_notebooks/blob/main/Data_preprocessing.ipynb"

NOTEBOOKS = [
    ("December 2, 2025", "MNIST convolutional network", MNIST_NB),
    ("November 4, 2025", "Data preprocessing", PREP_NB),
]

# ------------------------------------------------------------------ this year's plan

PLAN = [
    {"when": "October", "title": "What AI is, and Python basics",
     "text": "How machine learning differs from ordinary programming, then variables, loops, functions, and notebooks.",
     "links": [("Intro slides", "deck:intro-2025"), ("Python slides", "deck:python-3")]},
    {"when": "November", "title": "Working with data, and first models",
     "text": "pandas, cleaning data, charts with seaborn, and training and testing models with scikit-learn. Teams enter a Kaggle competition.",
     "links": [("Getting started slides", "deck:getting-started"), ("Data science slides", "deck:python-2"),
               ("Preprocessing notebook", PREP_NB)]},
    {"when": "December", "title": "Neural networks",
     "text": "How a network learns, then a convolutional network in Keras that reads handwritten digits.",
     "links": [("MNIST notebook", MNIST_NB)]},
    {"when": "January", "title": "Large language models",
     "text": "How chatbots work, what they get wrong, and a project comparing two models.",
     "links": [("LLM slides", "deck:llm-2026")]},
    {"when": "February and March", "title": "Computer vision",
     "text": "Image, pose, and sound classifiers, tested on inputs they haven't seen.",
     "links": [("Computer vision slides", "deck:vision")]},
    {"when": "April", "title": "Natural language processing",
     "text": "How text becomes numbers, and a small NLP program of your own.",
     "links": [("NLP slides", "deck:nlp")]},
    {"when": "May and June", "title": "Projects",
     "text": "Build something you chose and present it at the last meetings of the year.",
     "links": [("Project guide", "project-guide.html")]},
]

# ------------------------------------------------------------------ learning path

STAGES = [
    {"key": "python", "title": "Python basics",
     "goal": "You can write a function, loop over a list, and make sense of an error message.",
     "task": "Write a number guessing game, or a program that finds the ten most common words in a text file.",
     "items": [
         item("Kaggle Learn: Python", "https://www.kaggle.com/learn/python", "Course", "about 5 hours",
              "Short lessons with exercises that run in your browser. We use this one in meetings.", "start"),
         item("CS50's Introduction to Programming with Python", "https://cs50.harvard.edu/python/2022/", "Course", "weeks 0 to 4",
              "Harvard's beginner course. Pick this if you want longer problem sets than Kaggle offers."),
         item("Python lessons", _DECK["python-3"], "Club slides", "",
              "Our deck from the March 2026 Python session.", "reference"),
     ]},
    {"key": "data", "title": "Working with data",
     "goal": "You can load a CSV, clean it up, and make a chart that answers a question.",
     "task": "Pick any dataset on Kaggle and make three charts that each answer one question about it.",
     "items": [
         item("Kaggle Learn: Pandas", "https://www.kaggle.com/learn/pandas", "Course", "about 4 hours",
              "Loading, filtering, grouping, and combining tables of data.", "start"),
         item("Kaggle Learn: Data Visualization", "https://www.kaggle.com/learn/data-visualization", "Course", "about 4 hours",
              "Line charts, bar charts, heatmaps, and scatter plots with seaborn."),
         item("NumPy: the absolute basics for beginners", "https://numpy.org/doc/stable/user/absolute_beginners.html", "Article", "about 2 hours",
              "The official beginner's guide to arrays, which the ML libraries are built on."),
         item("Data preprocessing notebook", PREP_NB, "Club notebook", "",
              "From our November 2025 session: missing values, encoding, scaling, and splitting.", "reference"),
         item("Python Data Science Handbook", "https://jakevdp.github.io/PythonDataScienceHandbook/", "Book", "",
              "Free online. Useful when a pandas or Matplotlib question comes up.", "reference"),
     ]},
    {"key": "classical-ml", "title": "First models",
     "goal": "You can train a model, test it on data it hasn't seen, and explain what the score means.",
     "task": "Enter the <a href=\"https://www.kaggle.com/competitions/titanic\" rel=\"noopener\">Titanic competition</a> on Kaggle and get a score on the leaderboard.",
     "items": [
         item("Kaggle Learn: Intro to Machine Learning", "https://www.kaggle.com/learn/intro-to-machine-learning", "Course", "about 3 hours",
              "Decision trees, validation, overfitting, and random forests, ending with a competition entry.", "start"),
         item("Machine Learning for Everybody", "https://www.youtube.com/watch?v=i_LwzRVP7bg", "Video", "about 4 hours",
              "Kylie Ying explains and codes the classic algorithms in Google Colab. Pick this if you prefer video to reading."),
         item("MLU-Explain", "https://mlu-explain.github.io", "Interactive", "about 2 hours",
              "Visual explanations of train and test splits, bias and variance, and decision trees."),
         item("Kaggle Learn: Intermediate Machine Learning", "https://www.kaggle.com/learn/intermediate-machine-learning", "Course", "about 4 hours",
              "Missing values, categorical columns, pipelines, cross-validation, and XGBoost."),
         item("scikit-learn: Getting Started", "https://scikit-learn.org/stable/getting_started.html", "Article", "about 1 hour",
              "How the library fits models, builds pipelines, and scores results.", "reference"),
         item("Getting started with machine learning", _DECK["getting-started"], "Club slides", "",
              "Our deck from the November 2025 session.", "reference"),
     ]},
    {"key": "deep-learning", "title": "Neural networks",
     "goal": "You can explain how a network learns, and train one in Keras.",
     "task": "Run the MNIST notebook, then change one thing at a time (layers, epochs, dropout) and record what happens to accuracy.",
     "items": [
         item("3Blue1Brown: Neural Networks", "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi", "Video", "about 1 hour",
              "Watch the first four videos: what a neural network is, how it learns, and backpropagation.", "start"),
         item("MNIST demo notebook", MNIST_NB, "Club notebook", "",
              "The convolutional network from our December 2025 session.", "start"),
         item("TensorFlow Playground", "https://playground.tensorflow.org/", "Interactive", "about 30 minutes",
              "Train a tiny network in your browser and watch what each neuron learns."),
         item("Kaggle Learn: Intro to Deep Learning", "https://www.kaggle.com/learn/intro-to-deep-learning", "Course", "about 4 hours",
              "Build and train networks in Keras, including dropout and batch normalization."),
         item("3Blue1Brown: Essence of Linear Algebra", "https://www.3blue1brown.com/topics/linear-algebra", "Video", "about 3 hours",
              "Vectors and matrices explained with animation.", "reference"),
         item("The spelled-out intro to neural networks and backpropagation", "https://youtu.be/VMj-3S1tku0", "Video", "about 2.5 hours",
              "Andrej Karpathy builds a neural network library from an empty file. Harder than the rest of this stage."),
     ]},
    {"key": "vision", "title": "Computer vision",
     "goal": "You can train an image classifier on your own photos and find where it fails.",
     "task": "Take 50 photos of two or three objects at home, train a classifier on them, and find three photos that fool it.",
     "items": [
         item("Teachable Machine", "https://teachablemachine.withgoogle.com/", "Interactive", "about 30 minutes",
              "Train an image, pose, or sound classifier from your webcam, with no code.", "start"),
         item("CNN Explainer", "https://poloclub.github.io/cnn-explainer/", "Interactive", "about 30 minutes",
              "Shows what each layer of a convolutional network does to an image."),
         item("Kaggle Learn: Computer Vision", "https://www.kaggle.com/learn/computer-vision", "Course", "about 4 hours",
              "Convolutions, pooling, data augmentation, and transfer learning in Keras."),
         item("Keras datasets", "https://keras.io/api/datasets/", "Tool", "",
              "MNIST, Fashion-MNIST, and CIFAR-10, each loadable in one line.", "reference"),
         item("Intro to computer vision", _DECK["vision"], "Club slides", "",
              "Our deck from the March 2026 workshop.", "reference"),
     ]},
    {"key": "nlp-llm", "title": "Language models",
     "goal": "You can explain how a chatbot produces text, and use a pretrained model in your own code.",
     "task": "Run a pretrained sentiment model from Hugging Face on 20 reviews you write yourself, and note where it gets confused.",
     "items": [
         item("Intro to Large Language Models", "https://www.youtube.com/watch?v=zjkBMFhNj_g", "Video", "about 1 hour",
              "Andrej Karpathy's general-audience talk on what LLMs are and how they're trained.", "start"),
         item("Hugging Face LLM Course", "https://huggingface.co/learn/nlp-course/chapter1/1", "Course", "chapters 1 to 3",
              "Use pretrained models for classification, summarizing, and generation in a few lines of Python.", "start"),
         item("Transformer Explainer", "https://poloclub.github.io/transformer-explainer/", "Interactive", "about 30 minutes",
              "Type a sentence and watch a GPT-2 model predict the next word, step by step."),
         item("The Illustrated Transformer", "https://jalammar.github.io/illustrated-transformer/", "Article", "about 1 hour",
              "A visual walkthrough of attention and the transformer architecture."),
         item("Prompt Engineering Guide", "https://www.promptingguide.ai/", "Article", "",
              "Techniques for getting better results out of language models, with examples.", "reference"),
         item("Intro to NLP", _DECK["nlp"], "Club slides", "",
              "Our deck from the April 2026 workshop.", "reference"),
         item("Let's build GPT", "https://www.youtube.com/watch?v=kCc8FmEb1nY", "Video", "about 2 hours",
              "Karpathy codes a small GPT from an empty file. Do the neural networks stage first."),
     ]},
    {"key": "agents-rl", "title": "Agents and reinforcement learning",
     "goal": "You can train an agent to play a simple game, or build an assistant that uses a tool.",
     "task": "Train an agent to land the Lunar Lander in Gymnasium, then change the reward and see how its behavior shifts.",
     "items": [
         item("Hugging Face Deep RL Course", "https://huggingface.co/learn/deep-rl-course/unit0/introduction", "Course", "units 1 and 2",
              "You train a lunar lander in the first unit.", "start"),
         item("Hugging Face Agents Course", "https://huggingface.co/learn/agents-course", "Course", "unit 1",
              "What an LLM-based agent is, how tool use works, and how to build a simple one."),
         item("Gymnasium", "https://gymnasium.farama.org/", "Tool", "",
              "The standard library of game environments for reinforcement learning, with tutorials.", "reference"),
         item("Reinforcement Learning: An Introduction", "http://incompleteideas.net/book/the-book-2nd.html", "Book", "",
              "Sutton and Barto's textbook, free online. Chapter 1 is a readable overview.", "reference"),
     ]},
]

# ------------------------------------------------------------------ project guide

IDEAS = [
    "Predict something about your own life from data you collect: sleep, screen time, or running times.",
    "A classifier that sorts photos from your phone into categories you choose.",
    "A model that guesses the genre of a song from its lyrics.",
    "A study assistant that answers questions about your own class notes.",
    "A game-playing agent for a simple game you know well.",
    "A fairness check of a model someone else in the club built.",
]

BUILD_SECTION = [
    {"key": "data", "title": "Find data",
     "intro": "",
     "items": [
         item("Kaggle Datasets", "https://www.kaggle.com/datasets", "Tool", "", "The largest collection, with notebooks showing how other people used each dataset."),
         item("Hugging Face Datasets", "https://huggingface.co/datasets", "Tool", "", "Text, image, and audio datasets that load in one line of Python."),
         item("UCI Machine Learning Repository", "https://archive.ics.uci.edu/", "Tool", "", "Small, clean, classic datasets. Good for a first project."),
         item("Keras datasets", "https://keras.io/api/datasets/", "Tool", "", "MNIST, Fashion-MNIST, CIFAR-10, and a few more, built into Keras."),
     ]},
    {"key": "share", "title": "Share what you made",
     "intro": "",
     "items": [
         item("Project README template", "assets/docs/project-template.md", "Template", "", "Our one-page template: the question, the data, how to run it, results, and limits."),
         item("GitHub: Hello World", "https://docs.github.com/en/get-started/start-your-journey/hello-world", "Article", "about 30 minutes", "Make your first repository."),
         item("Gradio", "https://www.gradio.app/", "Tool", "", "Turn a Python function into a web demo with a few lines of code."),
         item("Streamlit", "https://streamlit.io/", "Tool", "", "Build a small data app in Python."),
         item("Hugging Face Spaces", "https://huggingface.co/spaces", "Tool", "", "Free hosting for Gradio and Streamlit demos."),
     ]},
    {"key": "responsible", "title": "Check your model",
     "intro": "Before you present, find out who your model works badly for, and write it down.",
     "items": [
         item("Model Cards", "https://www.kaggle.com/code/var0101/model-cards", "Tutorial", "about 20 minutes", "A Kaggle tutorial on what a model card is and what goes in one."),
         item("Kaggle Learn: Intro to AI Ethics", "https://www.kaggle.com/learn/intro-to-ai-ethics", "Course", "about 4 hours", "Lessons with exercises on spotting bias and measuring fairness."),
         item("AI Explorables", "https://pair.withgoogle.com/explorables/", "Interactive", "about 1 hour", "Interactive essays from Google on fairness, bias in datasets, and how models fail."),
     ]},
]

# ------------------------------------------------------------------ reading group

SAFETY_META = {
    "source": "Adapted from a university AI Safety Fundamentals (AISF) reading-group syllabus, shortened for a high school group.",
    "maintainer": "Maintained by the SAIL officers.",
    "reviewed": "Last reviewed September 2026. This field moves quickly, so check dates on anything you cite.",
}

SAFETY = [
    {"title": "Fairness and bias in systems that exist now",
     "objective": "Explain two ways a model can treat groups differently, and why fixing one can break another.",
     "discuss": "Pick one example from the reading. What was measured, and what was inferred from it?",
     "items": [
         item("AI Explorables: Measuring Fairness", "https://pair.withgoogle.com/explorables/measuring-fairness/", "Interactive", "about 20 minutes",
              "An interactive walk through why different fairness measures disagree.", "start"),
         item("Kaggle Learn: Identifying Bias in AI", "https://www.kaggle.com/learn/intro-to-ai-ethics", "Course", "lesson 3",
              "Six kinds of bias, with an exercise on a comment-moderation model.", "start"),
     ]},
    {"title": "Where AI is headed",
     "objective": "Describe what is driving current progress, and separate measured trends from forecasts.",
     "discuss": "Which claims in these readings are measurements, and which are predictions?",
     "items": [
         item("Task-Completion Time Horizons", "https://metr.org/time-horizons/", "Article", "about 10 minutes",
              "METR measures how long a task AI systems can finish on their own, and how that number has changed.", "start"),
         item("Can AI scaling continue through 2030?", "https://epoch.ai/blog/can-ai-scaling-continue-through-2030", "Article", "about 10 minutes",
              "Read the summary: what could limit progress, from power to chips to data.", "start"),
         item("Trends in Artificial Intelligence", "https://epoch.ai/trends", "Interactive", "about 15 minutes",
              "Epoch AI's charts of the computing power, data, and money going into AI."),
     ]},
    {"title": "When a system does what you said, not what you meant",
     "objective": "Explain the gap between a goal and the measurable stand-in used to train for it.",
     "discuss": "Find an example from school or sports where people optimized the measurement. How is the AI case similar?",
     "items": [
         item("Specification gaming", "https://deepmind.google/blog/specification-gaming-the-flip-side-of-ai-ingenuity/", "Article", "about 15 minutes",
              "Google DeepMind's collection of AI systems that found loopholes in their instructions.", "start"),
         item("Aligning language models to follow instructions", "https://openai.com/blog/instruction-following/", "Article", "about 15 minutes",
              "How OpenAI used human feedback to make GPT-3 follow instructions.", "start"),
         item("Playing the training game", "https://www.planned-obsolescence.org/the-training-game/", "Article", "about 20 minutes",
              "An argument that training on human approval can reward looking good over being good."),
     ]},
    {"title": "When a model learns the wrong goal",
     "objective": "Describe how a model can pass its tests and still behave differently later.",
     "discuss": "What did the alignment faking experiment show, and what does it not show about models in ordinary use?",
     "items": [
         item("The other AI alignment problem: mesa-optimizers", "https://www.youtube.com/watch?v=bJLcIBixGj8", "Video", "about 23 minutes",
              "Robert Miles explains how a trained model can end up with a goal that differs from the one it was trained on.", "start"),
         item("Alignment faking in large language models", "https://www.anthropic.com/research/alignment-faking", "Article", "about 15 minutes",
              "An Anthropic experiment where a model behaved differently when it believed it was being trained.", "start"),
     ]},
    {"title": "How worried should we be?",
     "objective": "State the strongest version of the concern and of the skeptical reply.",
     "discuss": "Where do the two readings disagree about evidence, and where do they disagree about predictions?",
     "items": [
         item("Why would AI want to do bad things? Instrumental convergence", "https://www.youtube.com/watch?v=ZeecOKBus3Q", "Video", "about 10 minutes",
              "Robert Miles on why many different goals lead a capable system to seek resources and avoid being shut off.", "start"),
         item("A guide to understanding AI as normal technology", "https://www.normaltech.ai/p/a-guide-to-understanding-ai-as-normal", "Article", "about 10 minutes",
              "Two Princeton researchers argue that AI will spread slowly, the way earlier technologies did. Read the section called A restatement of our thesis.", "start"),
         item("Statement on AI Risk", "https://safe.ai/work/statement-on-ai-risk", "Article", "about 2 minutes",
              "A one-sentence statement from the Center for AI Safety. Read the claim and ask what evidence would support it."),
     ]},
    {"title": "Looking inside models",
     "objective": "Describe one finding from interpretability research and what it lets researchers check.",
     "discuss": "What would you want to be able to see inside a model before trusting it with a decision about you?",
     "items": [
         item("Tracing the thoughts of a large language model", "https://www.anthropic.com/research/tracing-thoughts-language-model", "Article", "about 15 minutes",
              "Anthropic researchers look inside a model as it plans a rhyme, does arithmetic, and makes something up.", "start"),
         item("Using dangerous AI, but safely?", "https://www.youtube.com/watch?v=0pgEMWy70Qk", "Video", "about 30 minutes",
              "Robert Miles explains AI control: getting useful work out of a model you don't fully trust."),
     ]},
    {"title": "Rules and laws",
     "objective": "Name three things a government can do about AI and one drawback of each.",
     "discuss": "Which of these tools would have mattered for a project built in this club?",
     "items": [
         item("The AI regulator's toolbox", "https://adamjones.me/blog/ai-regulator-toolbox/", "Article", "about 20 minutes",
              "A list of the things governments can do about AI. Pick three tools and read the pros and cons of each.", "start"),
         item("Computing power and the governance of AI", "https://www.governance.ai/analysis/computing-power-and-the-governance-of-ai", "Article", "about 15 minutes",
              "Why the chips used to train AI are one of the few things regulators can track."),
     ]},
]

# ------------------------------------------------------------------ opportunities

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

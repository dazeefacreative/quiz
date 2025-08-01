import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import he from "he";
import session from "express-session";

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(session({
  secret: "quizsecret", // Change this to a strong secret in production
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const URL = "https://opentdb.com/api.php?amount=20&category=26&difficulty=medium&type=multiple";

let data;

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

app.get("/", (req, res) => {
    try{
        if (req.session.counter){
        req.session.destroy(); // Clear session
        }
    res.render("index.ejs", {
        question: null,
        options: null,
        correct_answer: null,
        highlight: null,
        feedback: null,
        showAnswer: false,
        redirect: false
    });
    } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).send("Something went wrong.");
  }
});


app.get("/submit", async (req, res) => {
    
  try {
    if (!req.session.score) {
      req.session.score = 0;
      req.session.counter = 0;
    }

    if (req.session.counter >= 10) {
      const finalScore = req.session.score;
      req.session.destroy(); // Clear session
      return res.render("result.ejs", { score: finalScore });
    }

    const response = await axios.get(URL);
    const random = Math.floor(Math.random() * response.data.results.length);
    data = response.data.results[random];

    // Decode the question and answers
    data.question = he.decode(data.question);
    data.correct_answer = he.decode(data.correct_answer);
    data.incorrect_answers = data.incorrect_answers.map(ans => he.decode(ans));

    // Combine and shuffle options
    const options = [...data.incorrect_answers, data.correct_answer];
    shuffleArray(options);

    req.session.correctAnswer = data.correct_answer;

    res.render("index.ejs", {
      question: data.question,
      options: options,
      correct_answer: data.correct_answer,
      feedback: null,
      redirect: false,
      showAnswer: false
    });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).send("Something went wrong.");
  }
});

app.post("/check-answer", (req, res) => {
  const remarks = [
    "You're amazing, keep it up.",
    "You're very brilliant!",
    "Wow! You got that.",
    "It's so easy for you",
    "You're incredible"
  ];

  const negativeRemarks = [
    "Try again.",
    "You missed this one",
    "Keep on trying",
    "It's not easy for you",
    "Let's try one more time",
    "You're so close",
    "You need to think deeper",
    "Don't miss the next one"
  ];

    const remark = remarks[Math.floor(Math.random() * remarks.length)];
    const nRemarks = negativeRemarks[Math.floor(Math.random() * negativeRemarks.length)];
    const correct = req.session.correctAnswer;
    const userAnswer = req.body.answer;

  if (userAnswer === correct) {
    req.session.score += 1;
    var feedback = remark;
    var highlight = "green";
  } else {
    feedback = nRemarks;
    highlight = "red";
  }

  req.session.counter += 1;

  res.render("index.ejs", {
    question: data.question,
    options: [],
    correct_answer: correct,
    highlight: highlight,
    feedback: feedback,
    showAnswer: true,
    redirect: true
  });

});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

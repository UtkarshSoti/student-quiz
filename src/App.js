import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { updateDoc } from "firebase/firestore";

import { collection, addDoc, getDocs } from "firebase/firestore";

const initialQuizData = [
  {
    question: "What is motion in one dimension?",
    options: ["Motion along a straight line", "Motion along a curve", "Circular motion", "Random motion"],
    answer: "Motion along a straight line",
    timeLimit: 10,
  },
  {
    question: "Which physical quantity is defined as the total path length travelled by a body?",
    options: ["Displacement", "Distance", "Speed", "Velocity"],
    answer: "Distance",
    timeLimit: 10,
  },
  {
    question: "Average velocity can be calculated by: (i) (u+v)/2 (ii) uv/2 (iii) -(v-u)/2 (iv) -(u-v)/2",
    options: ["(i)", "(ii)", "(iii)", "(iv)"],
    answer: "(i)",
    timeLimit: 10,
  },
  {
    question: "If a car moves 100 meters north and then 100 meters south, what is the displacement?",
    options: ["200 meters", "0 meters", "100 meters", "50 meters"],
    answer: "0 meters",
    timeLimit: 10,
  },
  {
    question: "An object moving in a circular path with uniform speed experiences a continuous change in its",
    options: ["direction", "velocity", "speed", "both a & b"],
    answer: "both a & b",
    timeLimit: 10,
  },
  {
    question: "Speed of an object is equal to the magnitude of velocity if-",
    options: ["the object is travelling in uniform circular motion", "the object is travelling along a straight path", "the initial and final positions are same", "None of these"],
    answer: "the object is travelling along a straight path",
    timeLimit: 10,
  },
  {
    question: "A cyclist riding a bicycle at a constant speed of 10 m/s on a circular track. The cyclist completes the three rounds of a track in 6 minutes. What is the radius of the circular track?",
    options: ["191 m", "573 m", "282 m", "151 m"],
    answer: "191 m",
    timeLimit: 30,
  },
  {
    question: "Which of these is correct for acceleration?",
    options: ["Change of speed only", "Change of direction only", "Change of both speed and direction", "None of these"],
    answer: "Change of both speed and direction",
    timeLimit: 10,
  },
  {
    question: "If a body covers equal distances in equal intervals of time, it is said to be in:",
    options: ["Uniform motion", "Non-uniform motion", "Accelerated motion", "Decelerated motion"],
    answer: "Uniform motion",
    timeLimit: 10,
  },
  {
    question: "What is the acceleration of a body moving with constant velocity?",
    options: ["Positive", "Negative", "Zero", "Changing"],
    answer: "Zero",
    timeLimit: 10,
  },
];

export default function StudentQuiz() {
  const [quizData, setQuizData] = useState(initialQuizData);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [studentName, setStudentName] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    if (quizStarted && timeLeft === 0) {
      handleAnswer(null);
      return;
    }
    if (!quizStarted) return;

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, quizStarted]);

  useEffect(() => {
    setTimeLeft(quizData[currentQuestion].timeLimit);
  }, [currentQuestion, quizData]);
  

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleAnswer = (option) => {
    if (selected !== null) return;

    setSelected(option);
    if (option === quizData[currentQuestion].answer) {
      setScore(score + 1);
    }
    setTimeout(() => {
      setSelected(null);
      const next = currentQuestion + 1;
      if (next < quizData.length) {
        setCurrentQuestion(next);
      } else {
        setShowScore(true);
        submitScore();
      }
    }, 800);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setTimeLeft(10);
    setQuizStarted(false);
  };

  const submitScore = async () => {
    if (!studentName) return;
  
    try {
      const scoresCollection = collection(db, "scores");
      const querySnapshot = await getDocs(scoresCollection);
  
      let existingDoc = null;
      querySnapshot.forEach((doc) => {
        if (doc.data().name === studentName) {
          existingDoc = doc;
        }
      });
  
      if (existingDoc) {
        // Update only if the new score is better
        if (score > existingDoc.data().score) {
          await updateDoc(existingDoc.ref, { score });
        }
      } else {
        await addDoc(scoresCollection, {
          name: studentName,
          score: score,
        });
      }
  
      fetchLeaderboard();
    } catch (e) {
      console.error("Error saving to Firebase", e);
    }
  };
  

  const fetchLeaderboard = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "scores"));
      const scoresData = querySnapshot.docs.map(doc => doc.data());
      const sorted = scoresData.sort((a, b) => b.score - a.score);
      setLeaderboard(sorted);
    } catch (error) {
      console.error("Error fetching leaderboard from Firebase:", error);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
    <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem", color: "#4f46e5" }}>Cube Root Classes</h1>
      {!quizStarted ? (
        <div style={{ background: "white", padding: "2rem", borderRadius: "1rem", maxWidth: "400px", width: "100%", marginBottom: "1.5rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>Enter Your Name to Start</h1>
          <input
            placeholder="Your name"
            style={{ padding: "0.5rem", marginBottom: "1rem", width: "100%" }}
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
          <button onClick={() => studentName && setQuizStarted(true)} style={{ padding: "0.5rem 1rem", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "0.5rem" }}>Start Quiz</button>
        </div>
      ) : (
        <div style={{ background: "white", padding: "2rem", borderRadius: "1rem", maxWidth: "600px", width: "100%", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>Motion Quiz</h1>
          {showScore ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{studentName}, you scored {score} out of {quizData.length}</p>
              <button style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "0.5rem" }} onClick={resetQuiz}>Try Again</button>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: "1rem", fontWeight: "500" }}>{quizData[currentQuestion].question}</p>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {quizData[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={selected !== null}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #ccc",
                      backgroundColor:
                        selected === option
                          ? option === quizData[currentQuestion].answer
                            ? "#16a34a"
                            : "#dc2626"
                          : "white",
                      color: selected === option ? "white" : "black"
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "gray" }}>Question {currentQuestion + 1} of {quizData.length}</p>
              <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", fontWeight: "bold", color: "#dc2626" }}>Time left: {timeLeft}s</p>
            </div>
          )}
        </div>
      )}

      {leaderboard.length > 0 && (
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "1rem", maxWidth: "600px", width: "100%", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Leaderboard</h2>
          <ul>
            {leaderboard.map((entry, index) => (
              <li key={index} style={{ marginBottom: "0.25rem" }}>{index + 1}. {entry.name}: {entry.score}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

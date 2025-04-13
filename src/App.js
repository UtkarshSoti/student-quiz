import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { updateDoc, collection, addDoc, getDocs } from "firebase/firestore";
import "./QuizApp.css";

const initialQuizData = [
  // (your same quiz data here)
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
    let updatedScore = score;
    if (option === quizData[currentQuestion].answer) {
      updatedScore = score + 1;
      setScore(updatedScore);
    }

    setTimeout(() => {
      setSelected(null);
      const next = currentQuestion + 1;
      if (next < quizData.length) {
        setCurrentQuestion(next);
      } else {
        setShowScore(true);
        submitScore(updatedScore);
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

  const submitScore = async (finalScore) => {
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
        if (finalScore > existingDoc.data().score) {
          await updateDoc(existingDoc.ref, { score: finalScore });
        }
      } else {
        await addDoc(scoresCollection, { name: studentName, score: finalScore });
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
    <div className="quiz-container">
      <div className="header">
        <img src="https://img.icons8.com/fluency/48/education.png" alt="Cube Root Classes" className="logo" />
        <h1>Cube Root Classes</h1>
      </div>

      {!quizStarted ? (
        <div className="card small-card">
          <h1>Enter Your Name to Start</h1>
          <input
            placeholder="Your name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
          <button onClick={() => studentName && setQuizStarted(true)}>Start Quiz</button>
        </div>
      ) : (
        <div className="card">
          <h1>Motion Quiz</h1>
          <div className="progress-bar">
            <div
              className="progress-bar-inner"
              style={{ width: `${(currentQuestion / quizData.length) * 100}%` }}
            ></div>
          </div>
          {showScore ? (
            <div className="score-block">
              <p>{studentName}, you scored {score} out of {quizData.length}</p>
              <button onClick={resetQuiz}>Try Again</button>
            </div>
          ) : (
            <div>
              <p className="question-info">{quizData[currentQuestion].question}</p>
              <div className="options">
                {quizData[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={selected !== null}
                    className="option-button"
                    style={{
                      backgroundColor:
                        selected === option
                          ? option === quizData[currentQuestion].answer
                            ? "#16a34a"
                            : "#dc2626"
                          : "white",
                      color: selected === option ? "white" : "black",
                      transform: selected === option ? 'scale(0.98)' : 'scale(1)'
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="question-info">Question {currentQuestion + 1} of {quizData.length}</p>
              <p className="question-info" style={{ color: timeLeft <= 5 ? '#dc2626' : '#4f46e5' }}>Time left: {timeLeft}s</p>
            </div>
          )}
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className="card">
          <h2>Leaderboard</h2>
          <ul>
            {leaderboard.map((entry, index) => (
              <li key={index}>{index + 1}. {entry.name}: {entry.score}</li>
            ))}
          </ul>
        </div>
      )}

      <footer className="footer">
        © 2024 Cube Root Classes. Created by Utkarsh Soti. All rights reserved.
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { updateDoc, doc, collection, addDoc, getDocs } from "firebase/firestore";
import "./QuizApp.css"; // Make sure CSS is imported

const subjects = ["Physics", "Mathematics", "Chemistry", "Biology"];

const quizzes = {
  Physics: [
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
      question: "Average velocity can be calculated by:",
      options: ["(u+v)/2", "uv/2", "-(v-u)/2", "-(u-v)/2"],
      answer: "(u+v)/2",
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
    // Add more physics questions if needed
  ],
  Mathematics: [ /* Add Math questions */],
  Chemistry: [ /* Add Chemistry questions */],
  Biology: [ /* Add Biology questions */]
};


export default function StudentQuiz() {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [quizData, setQuizData] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10); // Default time?
  const [studentName, setStudentName] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);

  // Timer useEffect
  useEffect(() => {
    if (!quizStarted || showScore) return; // Stop timer if quiz not started or score shown

    if (timeLeft === 0) {
      handleAnswer(null); // Auto-submit if time runs out
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, quizStarted, showScore]); // Add showScore dependency

  // Reset timer on question change
  useEffect(() => {
    if (quizStarted && quizData.length > 0 && !showScore) {
      // Ensure currentQuestion index is valid before accessing timeLimit
      const currentQuestionIndex = Math.min(currentQuestion, quizData.length - 1);
      setTimeLeft(quizData[currentQuestionIndex]?.timeLimit || 10);
    }
  }, [currentQuestion, quizData, quizStarted, showScore]); // Add showScore dependency

  // Fetch leaderboard on mount
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleAnswer = (option) => {
    if (selected !== null) return; // Prevent multiple selections

    setSelected(option); // Mark option as selected for immediate feedback

    let updatedScore = score;
    // Check answer only if an option was actually selected (not null from timeout)
    if (option !== null && option === quizData[currentQuestion].answer) {
      updatedScore = score + 1;
      // Don't setScore immediately, do it after moving to next question or showing score
    }

    // Use a slightly longer timeout to allow feedback visibility
    setTimeout(() => {
      const nextQuestionIndex = currentQuestion + 1;
      setSelected(null); // Reset selection for the next question

      if (nextQuestionIndex < quizData.length) {
        setScore(updatedScore); // Update score state now
        setCurrentQuestion(nextQuestionIndex);
        // Timer reset is handled by the useEffect watching currentQuestion
      } else {
        // Last question answered
        setScore(updatedScore); // Update score state finally
        setShowScore(true);
        if (studentName) { // Only submit if name exists
           submitScore(updatedScore);
        }
      }
    }, 1000); // Increased timeout for feedback visibility
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setTimeLeft(10); // Reset to default or first question time
    setQuizStarted(false);
    setSelectedSubject("");
    setStudentName(""); // Optionally reset name too
    setSelected(null);
    setQuizData([]);
  };

  const submitScore = async (finalScore) => {
      // No need to check studentName here again if called carefully
    try {
      const scoresCollection = collection(db, "scores");
      const querySnapshot = await getDocs(scoresCollection);
      let existingDoc = null;
      querySnapshot.forEach((docSnap) => {
        // Consider adding subject to score to make leaderboards subject-specific?
        if (docSnap.data().name === studentName /* && docSnap.data().subject === selectedSubject */) {
          existingDoc = docSnap;
        }
      });

      if (existingDoc) {
        // Update only if the new score is higher
        if (finalScore > existingDoc.data().score) {
          await updateDoc(doc(db, "scores", existingDoc.id), { score: finalScore });
        }
      } else {
        // Add new score entry
        await addDoc(scoresCollection, { name: studentName, score: finalScore /*, subject: selectedSubject */ });
      }
      fetchLeaderboard(); // Refresh leaderboard after score submission
    } catch (e) {
      console.error("Error saving score to Firebase:", e);
    }
  };


  const fetchLeaderboard = async () => {
    try {
      // Consider fetching scores only for the selected subject?
      // const q = query(collection(db, "scores"), where("subject", "==", selectedSubject), orderBy("score", "desc"));
      const scoresCollectionRef = collection(db, "scores"); // Fetch all for now
      const querySnapshot = await getDocs(scoresCollectionRef);
      const scoresData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by score descending
      const sorted = scoresData.sort((a, b) => b.score - a.score);
      setLeaderboard(sorted.slice(0, 10)); // Limit leaderboard display (e.g., top 10)
    } catch (error) {
      console.error("Error fetching leaderboard from Firebase:", error);
    }
  };

  const startQuiz = () => {
    // Basic validation
    if (!studentName.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!selectedSubject || !quizzes[selectedSubject] || quizzes[selectedSubject].length === 0) {
        alert("Please select a valid subject with questions.");
        // Optionally reset subject selection
        // setSelectedSubject("");
        return;
    }

    setQuizData(quizzes[selectedSubject]);
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelected(null);
    // Set initial time limit from the first question
    setTimeLeft(quizzes[selectedSubject][0]?.timeLimit || 10);
    setQuizStarted(true); // Start the quiz and timer
  };

  // --- Main Render ---
  return (
    <div className="quiz-container">
      <div className="header">
        {/* Optional: Add logo here */}
        <h1 style={{ color: '#4f46e5'}}>Cube Root Classes</h1>
        <h5 style={{ color: '#4f46e5' }}>Test your knowledge</h5>
      </div>

      {/* Subject Selection Screen */}
      {!selectedSubject ? (
        <div className="card small-card">
           <h2>Select a Subject</h2>
           <div className="subject-buttons">
            {subjects.map((subject, index) => (
              <button
                key={index}
                className="subject-button"
                onClick={() => setSelectedSubject(subject)}
                // Disable button if quiz for that subject is empty
                disabled={!quizzes[subject] || quizzes[subject].length === 0}
                title={(!quizzes[subject] || quizzes[subject].length === 0) ? "No questions available" : `Start ${subject} Quiz`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>
      ) : !quizStarted ? (
         // Name Input Screen
        <div className="card small-card">
           <h1>{selectedSubject} Quiz</h1>
           <h2 style={{ fontSize: '1.1rem', color: 'black', fontWeight: '500' }}>Enter Your Name to Start</h2>
           <input
            type="text" // Explicitly set type
            placeholder="Your name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
          <button onClick={startQuiz} disabled={!studentName.trim()}>
            Start Quiz
          </button>
          <button onClick={() => setSelectedSubject("")} style={{backgroundColor: '#6b7280', marginTop: '10px'}}>
             Change Subject
          </button>
        </div>
      ) : (
        // Quiz Active / Score Screen
        <div className="card">
          <h1>{selectedSubject} Quiz</h1>

          {/* --- MODIFIED PROGRESS BAR --- */}
          <div className="progress-bar">
            <div
              className="progress-bar-inner"
              style={{
                /* Conditionally set width: 100% if score is shown, otherwise calculate */
                width: `${showScore ? 100 : (quizData.length ? (currentQuestion / quizData.length) * 100 : 0)}%`
              }}
            ></div>
          </div>
          {/* --- END OF MODIFICATION --- */}


          {showScore ? (
            // Score Display Block
            <div className="score-block">
              <p>{studentName}, you scored {score} out of {quizData.length}</p>
              <button onClick={resetQuiz}>Try Another Quiz</button>
            </div>
          ) : quizData.length > 0 && currentQuestion < quizData.length ? (
             // Question Display Block (Check added to prevent errors)
            <div className="quiz-question-block">
                {/* Moved question count here */}
               <p className="question-info" style={{ fontWeight: 'bold' }}>
                   Question {currentQuestion + 1} of {quizData.length}
               </p>
               <p className="question-info" style={{fontSize: '1.2rem', minHeight: '3em'}}>
                   {quizData[currentQuestion].question}
               </p>
               <div className="options">
                {quizData[currentQuestion].options.map((option, index) => {
                   // Determine button style based on selection and correctness
                   let buttonStyle = {};
                   let className = "option-button";
                   if (selected !== null) { // If an answer was selected/timed out
                      const correctAnswer = quizData[currentQuestion].answer;
                      if (option === selected) { // Style the selected option
                          className += ' selected'; // General selected style
                          buttonStyle.backgroundColor = (option === correctAnswer) ? "#16a34a" : "#dc2626"; // Green if correct, Red if wrong
                          buttonStyle.borderColor = (option === correctAnswer) ? "#16a34a" : "#dc2626";
                          buttonStyle.color = "white";
                      } else if (option === correctAnswer) { // Highlight the correct answer if wrong one was selected
                         buttonStyle.backgroundColor = "#dcfce7"; // Light green background
                         buttonStyle.borderColor = "#16a34a"; // Green border
                         buttonStyle.color = "#15803d"; // Dark green text
                      }
                   }

                  return (
                     <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      disabled={selected !== null} // Disable after selection
                      className={className}
                      style={buttonStyle}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
               <p className="question-info" style={{ textAlign: 'center', fontSize: '1rem', color: timeLeft <= 5 ? '#dc2626' : '#4f46e5', fontWeight: 'bold' }}>
                  Time left: {timeLeft}s
               </p>
            </div>
          ) : (
              // Fallback if something goes wrong with quiz data/state
              <div>Loading question or quiz finished unexpectedly...</div>
          )}
        </div>
      )}

      {/* Leaderboard Display (Always visible after first fetch) */}
       {leaderboard.length > 0 && (
        <div className="card">
          <h2>Leaderboard</h2>
           <ul className="leaderboard-list">
            {leaderboard.map((entry, index) => (
              <li key={entry.id || index} className="leaderboard-item">
                <span className={`badge rank-${index + 1}`}>{index + 1}</span>
                <span className="leaderboard-name">{entry.name}</span>
                <span style={{marginLeft: 'auto', fontWeight: 'bold'}}>{entry.score} pts</span> {/* Score on the right */}
              </li>
            ))}
          </ul>
        </div>
      )}


      {/* Footer */}
      <footer className="footer">
        © {new Date().getFullYear()} Cube Root Classes. Created by Utkarsh Soti. All rights reserved.
      </footer>
    </div>
  );
}
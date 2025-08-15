import Navbar from '../Components/Navbar'
import React, { useEffect, useRef, useCallback, useState, useContext } from 'react'
import { VscDebugRestart } from "react-icons/vsc";
import { RxResume } from "react-icons/rx";
import { CiCamera } from "react-icons/ci";
import * as faceapi from 'face-api.js';
import confetti from '../../src/assets/confetti.gif'
import { DarkModeContext } from '../context/DarkModeContext.jsx';

const Home = () => {
  const {darkMode, setDarkMode} = useContext(DarkModeContext);
  const [isCamera, setIsCamera] = useState(false);
  const [text, setText] = useState("");
  const [count, setCount] = useState(1);
  const [prediction, setPrediction] = useState(0);
  const [matchLabel, setMatchLabel] = useState("");
  const [barColor, setBarColor] = useState("");
  const [score, setScore] = useState(0);
  const [emoji, setEmoji] = useState("");
  const [label, setLabel] = useState("");
  const [startGame, setStartGame] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [endGame, setEndGame] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scoredCurrentEmoji, setScoredCurrentEmoji] = useState(false);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);


  const emojiExpressions = [
    { emoji: "😊", label: "Happy" },
    { emoji: "😐", label: "Neutral" },
    { emoji: "😲", label: "Surprise" },
    { emoji: "😢", label: "Sad" },
    { emoji: "😠", label: "Angry" },
    // { emoji: "🤢", label: "Disgust" },
    // { emoji: "😨", label: "Fear" },
  ];

  const nextEmoji = useCallback(()=>{
    const nextIndex = currentIndex + 1;

    if (nextIndex >= emojiExpressions.length) {
      setEndGame(true);
      return;
    }

    setCurrentIndex(nextIndex);
    setEmoji(emojiExpressions[nextIndex].emoji);
    setLabel(emojiExpressions[nextIndex].label);
    setMatchLabel("");
    setText("");
    setScoredCurrentEmoji(false);
    setPrediction(0);
  }, [currentIndex, emojiExpressions]);

  useEffect(() => {
    if (isCamera) {
      if (!videoRef.current) {
        console.warn("videoRef is null");
        return;
      }

      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          if (videoRef.current) {
            videoRef.current.play(); 
        }
        })
        .catch((err) => console.error("Error accessing camera:", err));
    }
  }, [isCamera]);


  useEffect(()=>{
    removeCanvas();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [endGame])

  function removeCanvas(){
    const existingCanvas = document.getElementById("canvas");
    if(existingCanvas)
        existingCanvas.remove();
  }


  const loadModels = async () => {
    console.log("loading models");
    if(isCamera) return;
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/Models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/Models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/Models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/Models'),
      ]);
      setIsCamera(true);
    } catch (err) {
      console.error("Error loading models: ", err);
    }
  };

   function letStartGame() {
    if(!isCamera){
      loadModels();
    }
    setMatchLabel("");
    setText("");
    setScore(0);
    setPrediction(0);
    setCurrentIndex(0);
    setEmoji(emojiExpressions[0].emoji);
    setLabel(emojiExpressions[0].label);
    setCount(1);
    setEndGame(false);
    setStartGame(true);
    // setDetecting(true);
  }

  function checkExpressionMatch(topPrediction, confidence) {

    if(scoredCurrentEmoji) return;

    if (topPrediction.toLowerCase() === label.toLowerCase()) {
      if (confidence >= 0.8) {
        setMatchLabel("Perfect Match");
        setBarColor("bg-green-500");
        setScoredCurrentEmoji(true);
        setScore(prev => prev + 2);
      }
      else if (confidence >= 0.6) {
        setMatchLabel("Good Match");
        setBarColor("bg-yellow-500");
        setScoredCurrentEmoji(true);
        setScore(prev => prev + 1);
      }
      else {
        setMatchLabel("Not a Match");
        setBarColor("bg-red-500");
        return;
      }
    }

    else {
      setMatchLabel("Not a Match");
      setBarColor("bg-red-500");
    }
  }


  function detectFace() {
    console.log("detectFace called");
    if (document.getElementById("canvas")) return; 
    const canvas = faceapi.createCanvasFromMedia(videoRef.current);
    canvas.id = "canvas";
    // document.body.append(canvas);
    const container = videoRef.current.parentNode;
    container.appendChild(canvas);
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const displaySize = {
      width: videoRef.current.offsetWidth,
      height: videoRef.current.offsetHeight
    };
    faceapi.matchDimensions(canvas, displaySize);
    console.log("✅ Canvas created");


    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
      const resizedDetections = faceapi.resizeResults(
        detections,
        displaySize
      );

      canvas
        .getContext("2d")
        .clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      predictionResult(resizedDetections[0]);
    }, 300);
    setIsCanvasReady(true);
  }


  function predictionResult(obj) {

    if (!obj || !obj.expressions) {
      setText("No Expressions Detected");
      setPrediction(0);
      return;
    }

    const expressions = obj.expressions;
    let topPrediction = "";
    let maxValue = 0;

    for (const [expression, value] of Object.entries(expressions)) {
      if (value > maxValue) {
        maxValue = value;
        topPrediction = expression;
      }
    }

    setPrediction(Number(maxValue.toFixed(2)));

    if (topPrediction.toLowerCase() === label.toLowerCase()) {
      setText(`✅ ${topPrediction} (${(maxValue * 100).toFixed(0)}%)`);
    } else {
      setText(`❌ ${topPrediction} (${(maxValue * 100).toFixed(0)}%)`);
    }

    checkExpressionMatch(topPrediction, maxValue);
  }


  function restartGame() {
    setMatchLabel("");
    setText("");
    setScore(0);
    setPrediction(0);
    setEmoji("");
    setLabel("");
    setCount(1);
    setEndGame(false);
    // setSecondsLeft(10);
    setStartGame(true);
    removeCanvas();
    setIsCanvasReady(false);
    clearInterval(intervalRef.current);
  }

  function playAgain() {
    setMatchLabel("");
    setText("");
    setScore(0);
    setPrediction(0);
    setEmoji("");
    setLabel("");
    setCount(1);
    setEndGame(false);
    setStartGame(false);
    removeCanvas();
    setIsCanvasReady(false);
    clearInterval(intervalRef.current);
  }


  return (
    <div className={`min-h-screen w-full overflow-x-hidden overflow-y-hidden m-0 p-0 ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
      }`}
>
      <Navbar />

      {endGame ? (
      <div className={`mx-auto flex flex-col items-center gap-6 mt-[25%] md:mt-[15%] lg:mt-[5%] rounded-xl p-8 shadow-lg w-[80%] md:h-auto max-w-md transition-colors duration-300 
      ${darkMode ? 'bg-purple-500 text-gray-100' : 'bg-gray-200 text-gray-800'}`}>
        <h2 className="text-2xl font-bold text-center">🎉 Game Over 🎉</h2>

        <div className="text-center">
          <p className="md:text-lg font-medium">You scored:</p>
          <p className={`text-3xl font-extrabold ${darkMode? 'text-yellow-300' : 'text-purple-500'} `}>
          {score} / {emojiExpressions.length * 2} </p>
        </div>

        <div className="text-center">
          <p className="md:text-lg font-medium">Accuracy:</p>
          <p className={`text-3xl font-extrabold ${darkMode? 'text-yellow-300' : 'text-purple-500'}`}>
            {((score / (emojiExpressions.length * 2)) * 100).toFixed(0)}% </p>
        </div>

        <img src={confetti} width={200} height={200} alt="Confetti" className="mx-auto" />

        <button onClick={playAgain} className={`py-3 px-6 cursor-pointer  rounded-lg flex items-center justify-center gap-2 shadow-md transition-all duration-200 ${darkMode? 'bg-white text-purple-500 hover:bg-gray-100 transition-colors duration-300' : 'text-white bg-purple-500 hover:bg-purple-600'}`}>
          <VscDebugRestart className="text-xl" />
          <span className="font-semibold">Play Again</span>
        </button>
      </div> )
 :


        (
         <div className={`flex flex-col md:gap-4 rounded-xl p-5 mt-[35%] md:mt-[12%] lg:mt-[8%] mx-auto w-[90%] lg:w-[80%] ${darkMode ? 'bg-gray-100 text-gray-100' : 'bg-gray-200 text-gray-800'} `}>

          <div className='flex lg:flex-row flex-col items-center lg:items-stretch gap-5 lg:gap-[2%] lg:justify-center w-full min-h-[60vh]' >

            {!isCamera ? (
              <div className={`lg:w-[43%] w-[90%] lg:min-h-full min-h-[250px] md:min-h-[300px] rounded-2xl flex flex-col items-center justify-center gap-5 ${darkMode ? 'bg-purple-300 text-gray-800' : 'text-white bg-gray-800'}`} >
                <CiCamera size={32} />
                <p>Loading Camera...</p>
                <button onClick={loadModels} className='md:py-2 md:px-5 py-1 px-2 text-xs lg:text-lg text-white bg-purple-500 rounded-lg flex cursor-pointer'> Allow Camera Access </button>
              </div>
            ) :
              (
                <div className='lg:w-[43%] w-[90%] lg:min-h-full min-h-[250px] md:min-h-[300px] rounded-2xl relative videoContainer' >
                  <video ref={videoRef} onLoadedData={detectFace} muted autoPlay playsInline className='w-full h-full object-cover rounded-2xl' />
                </div>
              )}


            <div className={`lg:w-[43%] w-[90%] lg:min-h-full min-h-[250px] md:min-h-[300px] rounded-2xl ${darkMode? 'bg-purple-500 text-white' : 'bg-white text-black'} `}>
              {!startGame && <h2 className='relative lg:top-1/2 top-24 text-2xl font-bold flex justify-center items-center'>Letss Gooo !! </h2>}
              {startGame && (<div className='flex flex-col justify-center items-center mt-4'>

                {startGame && (
                  <strong>Mimic this emoji!</strong>
                )}
                <p className='text-[7rem] lg:text-[13rem]'> {emoji} </p>
                <button onClick={nextEmoji} className={`md:py-2 md:px-5 py-1 px-2 text-xs lg:text-lg rounded-lg mx-auto flex items-center justify-center gap-2 cursor-pointer ${darkMode? 'bg-white text-purple-500 font-bold' : 'text-white bg-purple-500'} `}>  <span>Next</span>  </button>


              </div>)}
            </div>

          </div>


          <div className='flex justify-center gap-[6%] lg:gap-[2%] mt-[5%] lg:mt-0'>
            <button onClick={letStartGame} disabled={startGame} className={`md:py-2 md:px-5 py-1 px-1 text-xs lg:text-lg text-white bg-purple-500 rounded-lg flex items-center justify-center gap-2 ${startGame ? 'opacity-50 cursor-not-allowed' : "cursor-pointer"}`}> <RxResume />  <span>Start Game</span>  </button>
            <button onClick={restartGame} disabled={!startGame} className={`md:py-2 md:px-5 py-1 px-1 text-xs lg:text-lg rounded-lg flex items-center justify-center gap-2 bg-white ${darkMode ? 'bg-white opacity-100 text-purple-500' : 'bg-white'} ${!startGame ? 'opacity-50 cursor-not-allowed' : "cursor-pointer"}  `}> <VscDebugRestart /> <span>Restart</span>  </button>
          </div>
        </div> 






      )}

    </div>
  )
}

export default Home


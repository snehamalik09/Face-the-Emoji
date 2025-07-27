import Navbar from '../Components/Navbar'
import React, { useEffect, useRef, useCallback, useState } from 'react'
import { VscDebugRestart } from "react-icons/vsc";
import { RxResume } from "react-icons/rx";
import { CiCamera } from "react-icons/ci";
import * as faceapi from 'face-api.js';
import confetti from '../../src/assets/confetti.gif'

const Home = () => {
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
  const [endGame, setEndGame] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);


  const emojiExpressions = [
    { emoji: "😊", label: "Happy" },
    { emoji: "😐", label: "Neutral" },
    { emoji: "😲", label: "Surprise" },
    { emoji: "😢", label: "Sad" },
    { emoji: "😠", label: "Angry" },
    { emoji: "🤢", label: "Disgust" },
    { emoji: "😨", label: "Fear" },
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

  useEffect(() => {
  if (!isCanvasReady || endGame) return;

  setSecondsLeft(10);
  setCountdown(true);

  const interval = setInterval(() => {
    setSecondsLeft(prev => {
      if (prev === 1) {
        nextEmoji();
        return 10;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [isCanvasReady, nextEmoji, endGame]);


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

    if (topPrediction.toLowerCase() === label.toLowerCase()) {
      if (confidence >= 0.8) {
        setMatchLabel("Perfect Match");
        setBarColor("bg-green-500");
        setScore(prev => prev + 2);
      }
      else if (confidence >= 0.6) {
        setMatchLabel("Good Match");
        setBarColor("bg-yellow-500");
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
    document.body.append(canvas);
    const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
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
    setSecondsLeft(10);
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
    <div className='min-h-screen'>
      <Navbar />

      {endGame ? (
        <div className='mx-auto flex flex-col gap-4 bg-gray-100 text-black mt-[4%] rounded-xl p-5'>
          ScoreBoard : {score}
          <img src={confetti} width={300} height={300} alt="Confetti" className='mx-auto' />
          <div className='flex justify-center gap-[2%]'>
            <button onClick={playAgain} className={`py-2 px-5 cursor-pointer text-white bg-purple-500 rounded-lg flex items-center justify-center gap-2`}> <VscDebugRestart />  <span>Play Again</span>  </button>
          </div>
        </div>) :


        (<div className='mx-auto flex flex-col gap-4 bg-gray-100 text-black mt-[4%] rounded-xl p-5'>

          <div className='flex gap-[2%] justify-center w-full min-h-[60vh]' >

            {!isCamera ? (
              <div className='w-[43%] min-h-full rounded-2xl bg-gray-800 flex flex-col items-center justify-center gap-5 text-white' >
                <CiCamera size={32} />
                <p>Loading Camera...</p>
                <button onClick={loadModels} className='py-2 px-5 text-white bg-purple-500 rounded-lg flex cursor-pointer'> Allow Camera Access </button>
              </div>
            ) :
              (
                <div className='w-[43%] min-h-full rounded-2xl relative videoContainer' >
                  <video ref={videoRef} onLoadedData={detectFace} muted autoPlay playsInline className='w-full h-full object-cover rounded-2xl' />
                </div>
              )}


            <div className='w-[43%] bg-white min-h-full text-black rounded-2xl'>
              {!startGame && <h2 className='relative top-1/2 text-2xl font-bold flex justify-center item-center'>Letss Gooo !! </h2>}
              {startGame && (<>
                <p className='pt-5 font-bold'>
                  {countdown && (
                    <div className="text-lg text-center text-blue-600 font-semibold my-4">
                      Next emoji in {secondsLeft}...
                    </div>
                  )}
                </p>
                {startGame && (
                  <strong>Mimic this emoji!</strong>
                )}
                <p className='text-[13rem]'> {emoji} </p>


              </>)}
            </div>

          </div>


          <div className='flex justify-center gap-[2%]'>
            <button onClick={letStartGame} disabled={startGame} className={`py-2 px-5 text-white bg-purple-500 rounded-lg flex items-center justify-center gap-2 ${startGame ? 'opacity-50 cursor-not-allowed' : "cursor-pointer"}`}> <RxResume />  <span>Start Game</span>  </button>
            <button onClick={restartGame} disabled={!startGame} className={`py-2 px-5 bg-white rounded-lg flex items-center justify-center gap-2 ${!startGame ? 'opacity-50 cursor-not-allowed' : "cursor-pointer"}  `}> <VscDebugRestart /> <span>Restart</span>  </button>
          </div>
        </div>)}

    </div>
  )
}

export default Home








          {/* {startGame && (<>

            <div className='bg-white py-2 w-[88%] mx-auto rounded-2xl px-6 flex flex-col gap-3'>

              <div className='flex justify-between'>
                <p> <strong>Detected :</strong> {text} {prediction == 0 ? "" : (<span> {(prediction * 100).toFixed(0)}%</span>)} </p>
                <p>{matchLabel}</p>
              </div>
              <div className={`w-full h-2  rounded-xl ${prediction > 0 ? barColor : 'bg-white'} `} >  </div>
            </div>

            <div className='bg-white py-2 w-[88%] mx-auto rounded-2xl px-6 flex flex-col gap-3'>
              <div className='flex justify-between'>
                <p> <strong>Score :</strong> {score > 0 && `${(prediction * 10).toFixed(0)}/100`} </p>
              </div>
              <div className={`h-2  rounded-xl ${score > 0 ? 'bg-blue-600' : 'bg-white'} w-full `}  >  </div>

              <div className={`h-2  rounded-xl ${score > 0 ? 'bg-blue-600' : 'bg-white'} `} style={{ width: `${(prediction * 10).toFixed(0)}%` }} >  </div>
            </div>

          </>)} */}


  // function randomSelection() {
  //     const unused = emojiExpressions.filter(e => !usedEmoji.includes(e.label.toLowerCase()));
  //     if(unused.length==0){
  //       setEndGame(true);
  //       return;
  //     }
  //     const obj = unused[Math.floor(Math.random() * unused.length)];
  //     setEmoji(obj.emoji);
  //     setLabel(obj.label);
  //     setUsedEmoji(prev => [...prev, obj.label.toLowerCase()]);aa
  //   }



  {/* {startGame && (
                  <button onClick={nextEmoji} className='py-2 px-5 mx-auto mt-4 text-white bg-green-600 rounded-lg'>
                    Next
                  </button>
                )} */}
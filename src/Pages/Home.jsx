import React, { useState } from 'react'
import Navbar from '../Components/Navbar'
import { useEffect, useRef } from 'react'
import { VscDebugRestart } from "react-icons/vsc";
import { RxResume } from "react-icons/rx";
import { CiCamera } from "react-icons/ci";
import * as faceapi from 'face-api.js';




const Home = () => {
  const [isCamera, setIsCamera] = useState(false);
  const [text, setText] = useState("");
  const [count, setCount] = useState(1);
  const[endGame, setEndGame]= useState(true);
  const [prediction, setPrediction] = useState(0);
  const [matchLabel, setMatchLabel] = useState("");
  const [barColor, setBarColor] = useState("");
  const [score, setScore] = useState("");
  const [emoji, setEmoji] = useState("");
  const [usedEmoji, setUsedEmoji] = useState([]);
  const [label, setLabel] = useState("");
  const [startGame, setStartGame] = useState(false);

  function checkExpressionMatch(topPrediction, confidence) {
  if (topPrediction.toLowerCase() === label.toLowerCase()) {
    if (confidence >= 0.8) {
      setMatchLabel("Perfect Match");
      setBarColor("bg-green-500");
      setScore(prev => prev + 2);
    } else if (confidence >= 0.6) {
      setMatchLabel("Good Match");
      setBarColor("bg-yellow-500");
      setScore(prev => prev + 1);
    } else {
      setMatchLabel("Not a Match");
      setBarColor("bg-red-500");
      return; 
    }

    setTimeout(() => {
      if (count < 5) {
        setCount(prev => prev + 1);
        randomSelection();
      } else {
        setEndGame(true);
      }
      setPrediction(0);
      setText("");  
    }, 1000);
  } else {
    setMatchLabel("Not a Match");
    setBarColor("bg-red-500");
  }
}


  useEffect(() => {
    if (isCamera) {
      if (!videoRef.current) {
        console.warn("videoRef is null");
        return;
      }

      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          addEvent();
        })
        .catch((err) => console.error("Error accessing camera:", err));
    }
  }, [isCamera]);

  function detectFace() {
          console.log("detectFace called");
          const canvas = faceapi.createCanvasFromMedia(videoRef.current);
          canvas.id = "canvas";
          document.querySelector("#videoContainer").append(canvas);
          document.body.append(canvas);
          const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
          faceapi.matchDimensions(canvas, displaySize);
          canvas.width = displaySize.width;
          canvas.height = displaySize.height;
          setInterval(async () => {
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
            const predictions = await faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
            predictionResult(resizedDetections[0]);
          }, 100);
    }



  const emojiExpressions = [
    { emoji: "😊", label: "Happy" },
    { emoji: "😢", label: "Sad" },
    { emoji: "😠", label: "Angry" },
    { emoji: "😲", label: "Surprise" },
    { emoji: "😐", label: "Neutral" },
    { emoji: "🤢", label: "Disgust" },
    { emoji: "😨", label: "Fear" },
  ];

  const videoRef = useRef(null);

  const loadModels = async () => {
    console.log("loading models");
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

  function randomSelection() {
    const unused = emojiExpressions.filter(e => !usedEmoji.includes(e.label));
    if(unused===0){
      setEndGame(true);
      return;
    }
    const obj = unused[Math.floor(Math.random() * unused.length)];
    setEmoji(obj.emoji);
    setLabel(obj.label);
    setUsedEmoji(prev => [...prev, obj.label]);
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
    setText(`✅ Matched: ${topPrediction} (${(maxValue * 100).toFixed(0)}%)`);
  } else {
    setText(`Detected: ${topPrediction} (${(maxValue * 100).toFixed(0)}%)`);
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
  randomSelection();
}


  function letStartGame() {
    if(!isCamera){
      loadModels();
    }
    setMatchLabel("");
    setText("");
    setScore(0);
    setPrediction(0);
    setEmoji("");
    setLabel("");
    setCount(1);
    setEndGame(false);
    setStartGame(true);
    randomSelection();
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
  }


  return (
    <div className='min-h-screen'>
      <Navbar />

      {endGame ? ( 
          <div className='mx-auto flex flex-col gap-4 bg-gray-100 text-black mt-[4%] rounded-xl p-5'> 
              ScoreBoard : {score}
              <div className='flex justify-center gap-[2%]'>
                <button onClick={playAgain} className={`py-2 px-5 cursor-pointer text-white bg-purple-500 rounded-lg flex items-center justify-center gap-2`}> <VscDebugRestart />  <span>Play Again</span>  </button>
              </div>
          </div>)  : 


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
              <div id="videoContainer" className='w-[43%] min-h-full rounded-2xl relative' >
                <video ref={videoRef} muted autoPlay playsInline className='w-full h-full object-cover rounded-2xl' />
              </div>
            )}

            
          <div className='w-[43%] bg-white min-h-full text-black rounded-2xl'>
            {!startGame && <h2 className='relative top-1/2 text-2xl font-bold flex justify-center item-center'>Letss Gooo !! </h2> }  
            {startGame && (<>
            <p className='pt-5 font-bold'>{label}</p>
            <p className='text-[13rem]'> {emoji} </p>
            <strong>Mimic this emoji!</strong>
            </>)}
          </div>

        </div>
        {startGame &&
          (<>
            {/* <button onClick={randomSelection} className='py-2 px-7 mx-auto text-white bg-purple-500 rounded-lg flex items-center justify-center gap-2 cursor-pointer'> Next  </button> */}
            <button onClick={detectFace} className='py-2 px-7 mx-auto text-white bg-purple-500 rounded-lg flex items-center justify-center gap-2 cursor-pointer'> Detect  </button>
          </>)}



        {startGame && (<>

          <div className='bg-white py-2 w-[88%] mx-auto rounded-2xl px-6 flex flex-col gap-3'>

            <div className='flex justify-between'>
              <p> <strong>Detected :</strong> {text} {prediction == 0 ? "" : (<span> {(prediction * 100).toFixed(0)}%</span>)} </p>
              <p>{matchLabel}</p>
            </div>
            <div className={`h-2  rounded-xl ${prediction > 0 ? barColor : 'bg-white'} `} style={{ width: `${(prediction * 100).toFixed(0)}%` }} >  </div>
          </div>

          <div className='bg-white py-2 w-[88%] mx-auto rounded-2xl px-6 flex flex-col gap-3'>
            <div className='flex justify-between'>
              <p> <strong>Score :</strong> {score > 0 && `${(prediction * 10).toFixed(0)}/100`} </p>
            </div>
            {/* <div className={`h-2  rounded-xl ${score > 0 ? 'bg-blue-600' : 'bg-white'} w-full `}  >  </div> */}

            <div className={`h-2  rounded-xl ${score > 0 ? 'bg-blue-600' : 'bg-white'} `} style={{ width: `${(prediction * 10).toFixed(0)}%` }} >  </div>
          </div>

        </>)}

        <div className='flex justify-center gap-[2%]'>
          <button onClick={letStartGame} disabled={startGame} className={`py-2 px-5 text-white bg-purple-500 rounded-lg flex items-center justify-center gap-2 ${startGame? 'opacity-50 cursor-not-allowed' : "cursor-pointer"}`}> <RxResume />  <span>Start Game</span>  </button>
          <button onClick={restartGame} disabled={!startGame} className={`py-2 px-5 bg-white rounded-lg flex items-center justify-center gap-2 ${!startGame? 'opacity-50 cursor-not-allowed' : "cursor-pointer"}  `}> <VscDebugRestart /> <span>Restart</span>  </button>
        </div> 
      </div> )}

    </div>
  )
}

export default Home




//  async function detectFace() {
//     console.log("Detected clicked");
//     const predictions = await faceapi
//       .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
//       .withFaceLandmarks()
//       .withFaceExpressions();
//     predictionResult(predictions[0]);
//   }

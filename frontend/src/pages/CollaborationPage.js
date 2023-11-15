import React, { useState } from 'react';
import "../style/CollaborationPage.css";
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import MessagingBox from '../components/MessagingBox';
import { io } from 'socket.io-client';
import MatchingBtn from '../components/MatchingBtn';
import EditorComp from '../components/EditorComp';
import '../style/QuestionCard.css'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEffect } from 'react';
import { auth } from '../firebase-config';
import { userApi } from '../apis.js';

const userURL = userApi;

function CollaborationPage({setIsMatched}) {
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  // The socket
  useEffect(() => {
    // Establish the socket connection only on the first render
    const sock = io("http://35.198.205.80/match");
    sock.on("compile_result", output => {
      console.log(output)
      setOutput(output)
    });

    sock.on("partner_left", () => {
      console.log("partner left")
      navigate('/Page/UserProfile');
      alert("Your partner has left the room, you will be redirected to the profile page")
    });

    sock.on("leave_room", () => {
      navigate('/Page/UserProfile');
    });
    setSocket(sock); // Store the socket object in state
  }, []);


  // Variable to keep track whether match is found or no
  const [isMatchFound, setMatchFound] = useState(false);

  // Room ID
  const [roomJoined, setRoomoJoined] = useState("");

  // Output from compiler
  const [output, setOutput] = useState("");

  const [inputValue, setInputValue] = useState('');

  const [isMatch, setIsMatch] = useState(false);

  const [question, setQuestion] = useState(null);

  const [language, setLanguage] = useState("");

  const getRoomJoined = () => {
    return roomJoined;
  }

  const [userData, setUserData] = useState(null);
  const [user, setUser] = useState(null);

  const fetchUserData = async (user) => {
    try {
      if (!user) {
        console.error("No user logged in.");
        return;
      }

      const response = await axios.get(`${userURL}/user`, { params: { 'email': user.email }, headers: {'Cache-Control': 'no-cache'} });
      //console.log(response.data);
      
      setUserData(response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    // Use the onAuthStateChanged listener to monitor authentication state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      fetchUserData(user);
    });

    // Return a cleanup function to unsubscribe from the listener when the component is unmounted
    return () => unsubscribe();
  }, []);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleButtonClick = () => {
    // Add your code execution logic here
    console.log('Executing code:', inputValue);
  };

  const editorStyles = {
    flexDirection: 'column',
    alignItems: 'stretch',
    borderRadius: '4px',
    height: '60vh',
    width: '100%',
    fontFamily: 'Monospace', // Use a monospaced font for code
    backgroundColor: '#282c34', // Set the background color to dark blue
  };

  const inputProps = {
    style: { background: '#282c34', color: 'white' }, // Set the background color to dark blue
  };

  const buttonStyles = {
    borderRadius: '0',
    background: 'red', // Change the button's background color to green
    color: 'white', // Change the text color to white
  };

  const containerStyles = {
    backgroundColor: 'lightgray', // Change the background color of the container
    height: '100.8vh', // Adjust the height as needed
  };

  const createMarkup = (htmlString) => {
    return { __html: htmlString };
  };

  const getDifficultyClass = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'difficulty-easy-collab';
      case 'medium':
        return 'difficulty-medium-collab';
      case 'hard':
        return 'difficulty-hard-collab';
      default:
        return '';
    }
  };

  const handleSubmission = () => {
    socket.emit("submit_question", userData, roomJoined);
  };



  return (
    <div className='collaboration-header'>
      {userData && socket && (
      <div style={{ display: isMatchFound ? "none" : 'flex', height: '100vh' }}>
        <MatchingBtn
          callback={setMatchFound}
          socket={socket}
          setRoomJoined={setRoomoJoined}
          setQuestion={setQuestion}
          userData={userData}
          languageData={setLanguage}
          setIsmatched={setIsMatched}
        />
      </div>
      )}
      {socket && userData && (
      <div style={{ display: isMatchFound ? "flex" : 'none', height: '93.5vh' }}>
        <Grid container spacing={1} style={containerStyles}>
          <Grid item xs={5}>
            <Box boxShadow={3} style={{ height: '60vh', width: '100%',}}>
              <div className='scrollable-div'>
                    <Typography variant="h5" component="h2">
                      {question && (
                        <div>
                          {question.title}
                        </div>
                      )}
                    </Typography>
                    { question && (
                      <div className="card-content">
                        <div className='tag-div'>
                          {question.categories.map((category, index) => (
                            <div key={index}>{category}</div>
                          ))}
                        </div>
                        <p className={getDifficultyClass(question.difficulty)}>
                          {question.difficulty}
                        </p>
                      <div className='content-div' dangerouslySetInnerHTML={createMarkup(question.content)} />
                  </div>
                    )}
              </div>
            </Box>
          </Grid>
          <Grid item xs={7} container justify="flex-end">
            <Box style={editorStyles}>
              { roomJoined && (
                <div style={{display:"flex"}}>
                  <EditorComp
                    roomJoined={getRoomJoined}
                    setOutput={setOutput}
                    socket = {socket}
                    language={language}
                  />
                </div>
              )}
            </Box>
          </Grid>
          <Grid item xs={4}>
            { roomJoined && (
            <MessagingBox 
              socket={socket}
              roomJoined={roomJoined}
              userData={userData}
            />)}
          </Grid>
          <Grid item xs={8}>
            <Box boxShadow={3} style={{ height: '26vh' }}>
            <div>
              <h3>Compiled Result</h3>
              <div>{output}</div>
            </div>
            </Box>
            <button onClick={handleSubmission} style={{ width: '100%', height :'4vh', backgroundColor:'red', color: 'white' }}>END SESSION</button>
          </Grid>
        </Grid>
      </div>)}
    </div>
  );
}

export default CollaborationPage;

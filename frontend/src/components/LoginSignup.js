import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import axios from 'axios';
import { auth } from '../firebase-config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../apis.js';


const levelOptions = ['Beginner', 'Intermediate', 'Expert'];
const languageOptions = ['Python', 'Java', 'C'];

const userURL = userApi;

axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;


const LoginSignup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState('Python');
  const [level, setLevel] = useState('Beginner');
  const [isLoginView, setIsLoginView] = useState(true);

  const handleToggleView = () => {
    setIsLoginView((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || (!isLoginView && (!username || !language || !level))) {
      alert('Please fill in all required fields.');
      return;
    }
  
    if (isLoginView) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        await auth.currentUser.getIdToken(true).then((idToken) => {
          localStorage.setItem('accessToken', idToken);
        }).catch((error) => {
          console.log(error);
        });
        
        console.log('User signed in successfully:', userCredential.user);
        navigate('/Page/Home');
      } catch (error) {
        alert('Error logging in: Email or password is incorrect.');
        console.error('Error logging in:', error);
      }
    } else {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await auth.currentUser.getIdToken(true).then(async (idToken) => {
          localStorage.setItem('accessToken', idToken);
          const responseForUsername = await axios.get(`${userURL}/user/check/username`, { params: { "username": username }, headers: {
            'Authorization': `Bearer ${idToken}`, 'Cache-Control': 'no-cache'
          } });
          
          if (responseForUsername.data.usernameExists) {
            alert('Username already exists. Please choose another username.');
          } else {
              console.log("creating a new user")
              await axios.post(`${userURL}/user`, {
                "email": email,
                "username": username,
                "language": language,
                "level": level,
                "role": "registered user"
              }, { headers: {
                'Authorization': `Bearer ${idToken}`, 'Cache-Control': 'no-cache'
              }}).then(response => {
                console.log(response)
                console.log('User signed up successfully.', userCredential.user);
              }).finally(() => {
                navigate('/Page/Home')
              })
          }
        }).catch((error) => {
          console.log(error);
        });
      } catch (error) {
        if (error.code === "auth/email-already-in-use") alert("Email already in use. Please log in.");
        console.error('Error signing up:', error);
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <div style={{ marginTop: '2em', textAlign: 'center' }}>
        <Typography variant="h4" component="h2"  sx={{ fontFamily: 'Russo', color: '#67352A'}}>
          {isLoginView ? 'Login' : 'Create an Account'}
        </Typography>
        <form style={{ display: 'flex', flexDirection: 'column', marginTop: '1em' }} onSubmit={handleSubmit}>
          <TextField
            sx={{ border: '2px solid white', bgcolor: "#ffff", input: { color: "black" } }}
            label="Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginBottom: '1em' }}
          />
          <TextField
            sx={{ border: '2px solid white', bgcolor: "#ffff", input: { color: "black" } }}
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: '1em' }}
          />
          {!isLoginView && (
            <>
              <TextField
                sx={{ border: '2px solid white', bgcolor: "#ffff", input: { color: "black" } }}
                label="Username"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ marginBottom: '1em' }}
              />
              <Select
                label="Level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                style={{ marginBottom: '1em', backgroundColor: '#ffff' }}
              >
                {levelOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              <Select
                label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ marginBottom: '1em', backgroundColor: '#ffff' }}
              >
                {languageOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </>
          )}
          <Button variant="contained" sx={{ backgroundColor: '#7F74FF', color: 'white' }} type="submit">
            {isLoginView ? 'Login' : 'Sign Up'}
          </Button>
        </form>
        <Typography variant="body1" style={{ marginTop: '1em' }}>
          {isLoginView ? "Don't have an account? " : 'Already have an account? '}
          <span style={{ cursor: 'pointer', color: 'blue' }} onClick={handleToggleView}>
            {isLoginView ? 'Sign up here' : 'Login here'}
          </span>
        </Typography>
      </div>
    </Container>
  );
};

export default LoginSignup;

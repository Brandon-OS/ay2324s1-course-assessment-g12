import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebase-config';

const userURL = "http://user-service-service:3001";

function RedirectIfNotAuthenticated() {
  const navigate = useNavigate();

  useEffect(() => {
    // Use onAuthStateChanged to listen for authentication state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in.
        try {
          const idToken = await user.getIdToken(true); // Wait for the promise to resolve
          const decodedToken = await axios.get(`${userURL}/user/verify`, { params: { token: idToken } });
        } catch (error) {
          console.error('Error verifying ID token:', error);
          navigate('/Page/LoginPage');
        }
      } else {
        // User is signed out. Redirect to the login page.
        navigate('/Page/LoginPage');
      }
    });

    // Return a cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, [navigate]);

  return null; // Since this component is for redirection only, return null
}

export default RedirectIfNotAuthenticated;

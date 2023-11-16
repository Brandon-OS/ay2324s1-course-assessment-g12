import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebase-config';
import { userApi } from '../apis.js';

const userURL = userApi;

const waitForAccessToken = () => {
  return new Promise((resolve, reject) => {
    const checkToken = () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        console.log("Access token found.")
        resolve(accessToken);
      } else {
        setTimeout(checkToken, 100); // Check again after 100ms
      }
    };
    checkToken();
  });
};

function RedirectIfAdmin({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Use onAuthStateChanged to listen for authentication state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in.
        try {
          const email = user.email; 
          const accessToken = await waitForAccessToken();
          const isAdmin = await axios.get(`${userURL}/user/authenticate`, { params: { email: email }, headers: {'Authorization':  `Bearer ${accessToken}`, 'Cache-Control': 'no-cache'}});

          // Check if the user is an admin
          if (!isAdmin.data) {
            // User is not an admin, redirect to the home page
            navigate('/Home');
          }
        } catch (error) {
          console.error('Error verifying ID token:', error);
          navigate('/LoginPage');
        }
      } else {
        // User is signed out. Redirect to the login page.
        navigate('/LoginPage');
      }
    });

    // Return a cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, [navigate]);

  return children;
}

export default RedirectIfAdmin;

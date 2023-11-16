import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import NavbarAdmin from '../components/NavbarAdmin';
import RedirectIfNotAdmin from './RedirectIfNotAdmin';
import RedirectIfNotAuthenticated from './RedirectIfNotAuthenticated';
import axios from 'axios';
import { auth } from '../firebase-config';
import { userApi } from '../apis.js';

const userUrl = userApi;

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

const Layout = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Add an authentication listener to get the user's email
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            console.log('User email:', user.email);
            const accessToken = await waitForAccessToken();
            const response = await axios.get(`${userUrl}/user/authenticate`, { params: { "email": user.email }, headers: {'Authorization':  `Bearer ${accessToken}`, 'Cache-Control': 'no-cache'} });
            const isAdmin = response.data;
            console.log('isAdmin:', isAdmin);
            setIsAdmin(isAdmin);
          }
        });

        return () => {
          // Cleanup the listener when the component unmounts
          unsubscribe();
        };
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <RedirectIfNotAuthenticated />
      {isAdmin ? <NavbarAdmin /> : <Navbar />}
      <div className="content">{children}</div>
    </div>
  );
};

export default Layout;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuestionCard from './QuestionCard';
import { auth } from '../firebase-config';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import "../style/UserProfilePage.css";
import { questionApi } from '../apis.js';

const questionURL = questionApi;

axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;

const LikedQuestionList = () => {
  const [likedQuestions, setLikedQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in, you can access user data here
        fetchLikedQuestions(user.email);
      } else {
        // User is signed out, you can handle this case here
        console.error('User is not authenticated.');
      }
    });

    return () => {
      // Unsubscribe from the listener when the component unmounts
      unsubscribe();
    };
  }, []);

  const fetchLikedQuestions = async (email) => {
    try {
      console.log("getting liked questions")
      const response = await axios.get(`${questionURL}/questions/like`, {
        params: {
          email: email,
        }, headers: {'Cache-Control': 'no-cache'}
      });
      setLikedQuestions(response.data);
    } catch (error) {
      console.error('Error fetching liked questions:', error);
    }
  };

  const handleLike = async (question) => {
    try {
      // Check if the question is already liked
      console.log(question);

      // const isLiked = likedQuestions.includes(question);
      const isLiked =
        likedQuestions.length > 0 &&
        likedQuestions.some((likedQuestion) => likedQuestion.title === question.title);
      if (isLiked) {
        // If already liked, remove it from the liked questions
        const updatedLikedQuestions = likedQuestions.filter((q) => q.title !== question.title);
        setLikedQuestions(updatedLikedQuestions);
      } else {
        // If not liked, add it to the liked questions
        setLikedQuestions([...likedQuestions, question]);
      }

      // Send a request to your server to update the likes
      const response = await axios.post(`${questionURL}/question/like`, {
        email: auth.currentUser.email,
        title: question.title,
        liked: !isLiked,
      });
    } catch (error) {
      // Handle any errors that occur during the request
      console.error('Error updating likes:', error);
    }
  };

  const handleRowClick = async (question) => {
    setSelectedQuestion(question);
    const response = await axios.post(`${questionURL}/question/visit`, {
      title: question.title,
    });
    document.body.style.overflow = 'hidden';
  };

  const handleCloseCard = () => {
    setSelectedQuestion(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <div className="liked-questions-container">
      <table className="user-table-container">
        <thead>
          <tr>
            <th style={{ textAlign: 'left', fontFamily: 'Russo' }}>Likes</th>
          </tr>
        </thead>
      </table>
      {likedQuestions.length > 0 ? ( 
        <div className="liked-questions-table">
          <table className="user-table-container">
            <tbody>
              {likedQuestions.map((question, index) => (
                <tr className="question-row" key={index}>
                  <td style={{ textAlign: 'left' }} onClick={() => handleRowClick(question)}>
                    {question.title}
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <span>{question.visits}</span>
                    <IconButton onClick={() => handleLike(question)}>
                      {likedQuestions.length > 0 &&
                      likedQuestions.some((likedQuestion) => likedQuestion.title === question.title) ? (
                        <FavoriteIcon color="secondary" />
                      ) : (
                        <FavoriteBorderIcon color="secondary" />
                      )}
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No liked questions available.</p>
      )}
      {selectedQuestion && (
        <div className="modal-background">
          <QuestionCard question={selectedQuestion} onClose={handleCloseCard} />
        </div>
      )}
    </div>
  );
};

export default LikedQuestionList;

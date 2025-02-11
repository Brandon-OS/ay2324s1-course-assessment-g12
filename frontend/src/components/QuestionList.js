import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuestionCard from './QuestionCard';
import {auth} from '../firebase-config';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const questionURL = process.env.REACT_APP_ENV === 'local'
? 'http://localhost:3002'
: "http://35.198.205.80";

const QuestionList = ({ selectedCategory, selectedLevel, selectedList }) => {
  const [questions, setQuestions] = useState([]);
  const [likedQuestions, setLikedQuestions] = useState([]); 
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Track the current page
  const questionsPerPage = 30; // Define the number of questions to display per page
  
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
    }
  }, []);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get(`${questionURL}/questions/filter`, {
          params: {
            categories: selectedCategory,
            difficulty: selectedLevel,
            limit: selectedList,
          },
        });
        setQuestions(response.data);
        console.log("Questions:")
        console.log(response.data); 
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };

    fetchQuestions();
  }, [selectedCategory, selectedLevel, selectedList]);

  const fetchLikedQuestions = async (email) => {
    try {
      console.log(email)
      const response = await axios.get(`${questionURL}/questions/like`, {
        params: {
          'email': email
        },
      });
      setLikedQuestions(response.data);
      console.log("Liked questions: ")
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching liked questions:', error);
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

  const handleLike = async (question) => {
    try {
      // Check if the question is already liked
      //[].some((likedQuestion) => likedQuestion.id === question.id);
      console.log(question)

      //console.log(likedQuestions)

      //const isLiked = likedQuestions.includes(question);
      const isLiked = likedQuestions.length > 0 && likedQuestions.some(likedQuestion => likedQuestion.title === question.title)
      console.log(isLiked); 
      if (isLiked) {
        console.log("its already liked")
        // If already liked, remove it from the liked questions
        const updatedLikedQuestions = likedQuestions.filter((q) => q.title !== question.title);
        setLikedQuestions(updatedLikedQuestions);
      } else {
        console.log("its not yet liked")
        // If not liked, add it to the liked questions
        setLikedQuestions([...likedQuestions, question]);
      }

      // Send a request to your server to update the likes
      const response = await axios.post(`${questionURL}/question/like`, {
        email: auth.currentUser.email,
        title: question.title,
        liked: !isLiked,
      });
  
      // Check if the request was successful (you may want to add more error handling)
      if (response.status === 200) {
        // Update the likes locally in the component
        const updatedQuestions = questions.map((q) =>
          q.title === question.title ? { ...q, visits: q.visits + (isLiked ? -1 : 1) } : q
        );
        setQuestions(updatedQuestions);
      } else {
        // Handle the case where the server request was not successful
        console.error('Failed to update likes');
      }
    } catch (error) {
      // Handle any errors that occur during the request
      console.error('Error updating likes:', error);
    }
  };
  

  // Calculate the range of questions to display based on current page and questionsPerPage
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);

  return (
    <div>
      <table className="table-container">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Title</th>
            <th style={{ textAlign: 'left' }}>Difficulty</th>
            <th style={{ textAlign: 'left' }}>Likes</th>
          </tr>
        </thead>
        <tbody>
          {currentQuestions.length > 0 ? (
            currentQuestions.map((question, index) => (
              <tr className="question-row" key={index}>
                <td style={{ textAlign: 'left' }} onClick={() => handleRowClick(question)}>
                  {question.title}
                </td>
                <td style={{ textAlign: 'left' }}>{question.difficulty}</td>
                <td style={{ textAlign: 'left' }}>
                  <span>{question.visits}</span>
                  <IconButton onClick={() => handleLike(question)}>
                  {likedQuestions.length > 0 && likedQuestions.some(likedQuestion => likedQuestion.title === question.title) ? (
                    <FavoriteIcon color="secondary" />
                    ) : (
                    <FavoriteBorderIcon color="secondary" />
                    )}
                  </IconButton>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center' }}>
                No questions available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedQuestion && (
        <div className="modal-background">
          <QuestionCard question={selectedQuestion} onClose={handleCloseCard} />
        </div>
      )}

      {/* Pagination controls */}
      <div className="pagination">
        <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
          <ArrowBackIosIcon/>
        </button>
        <span>Page {currentPage}</span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={indexOfLastQuestion >= questions.length}
        >
          <ArrowForwardIosIcon />
        </button>
      </div>
    </div>
  );
};

export default QuestionList;

const firebaseAdmin = require("./firebase.js");
const db = firebaseAdmin.firestore();
const getAuth = firebaseAdmin.auth();

async function getUser(criteria, flag) {
    const usersRef = db.collection("users");
    const querySnapshot = await usersRef.where(`${flag}`, "==", criteria).get();

    if (querySnapshot.empty) {
        return null;
    }
    return querySnapshot.docs[0].data();
}

async function checkUserExistsByEmail(email) {
    const usersRef = db.collection("users");
    const snapshot = await usersRef
        .where("email", "==", email)
        .get();
    if (snapshot.empty) {
        return false;
    } else {
        return true;
    }
}

async function checkUserExistsByUsername(username) {
    const usersRef = db.collection("users");
    const snapshot = await usersRef
        .where("username", "==", username)
        .get();
    if (snapshot.empty) {
        return false;
    } else {
        return true;
    }
}

async function getUidFromToken(idToken) {
    try {
        const decodedToken = await getAuth.verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        throw error; // You can choose to handle the error as needed
    }
}


async function getQuestion(title) {
    try {
        const questionsRef = db.collection("questions");
        const querySnapshot = await questionsRef
            .where("title", "==", title)
            .get();
        if (querySnapshot.empty) {
            return null;
        } else {
            return querySnapshot.docs[0].data();
        }
    } catch (error) {
        console.error(error);
    }
}

async function getAllQuestions(limit) {
    try {
        if (limit == "List All") {
            limit = 100;
        }
        const questionsRef = db.collection("questions").limit(parseInt(limit));
        const querySnapshot = await questionsRef.get();
        if (querySnapshot.empty) {
            return null;
        } else {
            const questions = [];
            querySnapshot.forEach((doc) => {
                questions.push(doc.data());
            });
            return questions;
        }
    } catch (error) {
        console.error(error);
    }
}

async function filterQuestions(categories, difficulty, limit) {
    try {

        if (categories === undefined && difficulty === "All Levels") {
            const questions = await getAllQuestions(limit);
            return questions;
        } else if (categories === undefined || categories.length === 0 || !categories) {
            const questions = await getQuestionsByDifficulty(difficulty, limit);
            return questions;
        } else if (difficulty === undefined || difficulty.length === 0 || difficulty === "All Levels") {
            const questions = await getQuestionsByCategories(categories, limit);
            return questions;
        } else {
            const questions = await getQuestionsByCategoriesAndDifficulty(categories, difficulty, limit);
            return questions;
        }
    } catch (error) {
        console.error(error);
    }
}

async function getQuestionsByDifficulty(difficulty, limit) {
    try {
        const questionsRef = db.collection("questions");
        var querySnapshot;
        if (limit === undefined || limit === "List All") {
            querySnapshot = await questionsRef
                .where("difficulty", "==", difficulty)
                .orderBy("visits", 'desc').get();
        } else {
            querySnapshot = await questionsRef
                .where("difficulty", "==", difficulty)
                .orderBy("visits", 'desc').limit(parseInt(limit)).get();
        }

        if (querySnapshot.empty) {
            return null;
        } else {
            const questions = [];
            querySnapshot.forEach((doc) => {
                questions.push(doc.data());
            });
            return questions;
        }
    } catch (error) {
        console.error(error);
    }
}

async function getQuestionsByCategories(categories, limit) {
    try {
        const questionsRef = db.collection("questions");
        var querySnapshot;
        if (limit === undefined || limit === "List All") {
            querySnapshot = await questionsRef
                .where("categories", "array-contains-any", categories) 
                .orderBy("visits", 'desc').get();
        } else {
            querySnapshot = await questionsRef
                .where("categories", "array-contains-any", categories)
                .orderBy("visits", 'desc').limit(parseInt(limit)).get();
        }

        if (querySnapshot.empty) {
            return null;
        } else {
            const questions = [];
            querySnapshot.forEach((doc) => {
                if (categories.every(category => doc.data().categories.includes(category))) questions.push(doc.data());
            });
            return questions;
        }
    } catch (error) {
        console.error(error);
    }
}

async function getQuestionsByCategoriesAndDifficulty(categories, difficulty, limit) {
    try {
        const questionsRef = db.collection("questions");
        var querySnapshot;
        if (limit === undefined || limit === "List All") {
            querySnapshot = await questionsRef
                .where("categories", "array-contains-any", categories)
                .where("difficulty", "==", difficulty)
                .orderBy("visits", 'desc').get();
        } else {
            querySnapshot = await questionsRef
                .where("categories", "array-contains-any", categories)
                .where("difficulty", "==", difficulty)
                .orderBy("visits", 'desc').limit(parseInt(limit)).get();
        }

        if (querySnapshot.empty) {
            return null;
        } else {
            const questions = [];
            querySnapshot.forEach((doc) => {
                if (categories.every(category => doc.data().categories.includes(category))) questions.push(doc.data());
            });
            return questions;
        }
    } catch (error) {
        console.error(error);
    }
}

async function getQuestionsFromUser(username) {
    try {
        const questions = [];
        const questionsRef = db.collection("users").doc(username).collection("questions");
        const querySnapshot = await questionsRef.get();

        if (querySnapshot.empty) {
            return null;
        }

        const questionPromises = querySnapshot.docs.map(async (completedQuestion) => {
            const questionsDesc = await db.collection("questions").doc(completedQuestion.data().question).get();
            return Object.assign({}, completedQuestion.data(), questionsDesc.data());
        });

        const questionData = await Promise.all(questionPromises);
        questionData.forEach((question) => {
            questions.push(question);
        });

        if (querySnapshot.size === questions.length) return questions;
    } catch (error) {
        console.error(error);
    }
}

async function getLikedQuestions(username) {
    try {
        const questions = [];
        console.log("getting liked questions for: " + username)
        const questionsRef = db.collection("users").doc(username).collection("likes");
        const querySnapshot = await questionsRef.get();

        if (querySnapshot.empty) {
            return null;
        }

        const questionPromises = querySnapshot.docs.map(async (likedQuestion) => {
            const questionsDesc = await db.collection("questions").doc(likedQuestion.data().question).get();
            return Object.assign({}, likedQuestion.data(), questionsDesc.data());
        });

        const questionData = await Promise.all(questionPromises);
        questionData.forEach((question) => {
            questions.push(question);
        });

        if (querySnapshot.size === questions.length) return questions;
    } catch (error) {
        console.error(error);
    }
}

module.exports = { getUser, checkUserExistsByEmail, checkUserExistsByUsername, getUidFromToken, getQuestion, getAllQuestions, filterQuestions, getQuestionsFromUser, getLikedQuestions, getAuth};

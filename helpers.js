// function to generate new shortURLs
const generateRandomString = function() {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) { // set random string to 6 chars long
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// function to determine if user login is valid (if user is registered and password is correct)
const getUserByEmail = function(email, userDatabase) {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return userDatabase[user]; // returns user object
    }
  }
  return false; // case where email and password don't match or email doesn't exist
};

// function to find all the user's shortURLs
const urlsForUser = function(id, databaseObject) {
  let userSpecificDatabase = {};  // only show the urls for the logged in user
  for (const shortURL in databaseObject) {
    if (id === databaseObject[shortURL].userID) {
      userSpecificDatabase[shortURL] = databaseObject[shortURL];
    }
  }
  return userSpecificDatabase;
};

module.exports = { 
  generateRandomString,
  getUserByEmail,
  urlsForUser
};
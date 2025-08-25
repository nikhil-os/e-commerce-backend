const admin = require("firebase-admin");

// Temporarily disable Firebase to test if the app works
console.log("Firebase Admin SDK disabled for testing");

// Export a mock admin object for now
module.exports = {
  // Mock methods that might be used
  auth: () => ({
    verifyIdToken: () => Promise.resolve({ uid: "test-uid" }),
  }),
};

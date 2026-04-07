const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Mock structure for AI Health App Backend Triggers
// admin.initializeApp();

exports.onMealLogged = functions.firestore
  .document('meals/{mealId}')
  .onCreate(async (snap, context) => {
    // const meal = snap.data();
    // In a real implementation:
    // 1. Fetch user healthMode
    // 2. Call Gemini API to get risk/insights
    // 3. Save aiFeedback to the meal doc
    console.log("Mock trigger onMealLogged", snap.id);
    return null;
  });

exports.checkInactivity = functions.pubsub.schedule('0 20 * * *').onRun(async (context) => {
    // 1. Query users who haven't logged workouts for 3 days
    // 2. Call Gemini to create a personalized, polite notification
    // 3. Send via FCM
    console.log("Mock inactivity cron run");
    return null;
});

exports.analyzeFamilySharedGoals = functions.firestore
  .document('users/{userId}/weeklyStats/{statId}')
  .onWrite(async (change, context) => {
     // Family Mode Sync
     console.log("Mock family mode sync run");
     return null;
  });

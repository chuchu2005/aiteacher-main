import React, { useEffect, useState } from 'react';
import axios from 'axios';

axios.defaults.baseURL = 'https://aiteacher.learnrithm.com'; // Set the base URL if needed

const StreakCounter = ({ userEmail }) => {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const updateStreak = async () => {
      try {
        const response = await axios.post('/api/updateStreak', { email: userEmail });
        if (response.data.success) {
          setStreak(response.data.streak);
        } else {
          console.log(response.data.message);
        }
      } catch (error) {
        console.error(error);
      }
    };

    updateStreak();
  }, [userEmail]);

  return (
    <div className="fixed bottom-5 left-5">
      <div className="bg-red-500 text-white text-xl font-bold rounded-full p-4 shadow-lg flex items-center justify-center cursor-pointer transform transition-transform hover:scale-110">
        🔥 {streak}
      </div>
    </div>
  );
};

export default StreakCounter;

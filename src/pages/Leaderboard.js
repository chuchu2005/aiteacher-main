import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('/api/leaderboard');
        if (Array.isArray(response.data)) {
          setUsers(response.data);
        } else {
          console.error("API response is not an array", response.data);
        }
      } catch (error) {
        console.error("Error fetching leaderboard", error);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="flex flex-col items-center mt-8">
      <h2 className="text-4xl font-bold text-gray-800 mb-6">Leaderboard</h2>
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Streak</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user, index) => (
              <tr key={user._id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <td className="py-4 px-6 text-sm font-medium text-gray-900">{index + 1}</td>
                <td className="py-4 px-6 text-sm text-gray-500">{user.email}</td>
                <td className="py-4 px-6 text-sm text-gray-500">{user.streak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;

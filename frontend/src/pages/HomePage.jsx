import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Optional: Add an image or illustration
// import heroImage from '../assets/crisis-response-hero.jpg';

function HomePage() {
   const { user } = useAuth();

  return (
    <div className="text-center">
        {/* Optional Hero Image */}
        {/* <img src={heroImage} alt="Crisis Response Coordination" className="w-full max-w-3xl mx-auto mb-8 rounded shadow-lg"/> */}

      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
        Welcome to Crisis Mapper
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Connecting volunteers with people affected by disasters in real-time.
        Report crises, request assistance, or sign up to help your community.
      </p>

      <div className="space-x-4">
        <Link
          to="/map"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-lg shadow transition duration-200 ease-in-out transform hover:-translate-y-1"
        >
          View Live Crisis Map
        </Link>
        {!user && ( // Show Register/Login only if not logged in
             <>
                <Link
                    to="/register"
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg text-lg shadow transition duration-200 ease-in-out transform hover:-translate-y-1"
                    >
                    Register to Help/Request
                </Link>
                 <Link
                    to="/login"
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg text-lg shadow transition duration-200 ease-in-out"
                    >
                    Login
                </Link>
            </>
        )}
         {user && ( // Show Dashboard link if logged in
             <Link
                to="/dashboard"
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg text-lg shadow transition duration-200 ease-in-out transform hover:-translate-y-1"
             >
                Go to Your Dashboard
            </Link>
         )}
      </div>

      {/* Optional: Add sections for Features, How it Works, Testimonials */}
       <div className="mt-16 pt-10 border-t max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold mb-6 text-gray-700">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="p-4 rounded">
                    <h3 className="text-xl font-bold mb-2 text-blue-600">1. Report & Track</h3>
                    <p className="text-gray-600">Crises are identified from social media and reports. View real-time events on the map.</p>
                </div>
                <div className="p-4 rounded">
                     <h3 className="text-xl font-bold mb-2 text-green-600">2. Connect</h3>
                    <p className="text-gray-600">Civilians request help. Nearby, available volunteers are notified instantly.</p>
                </div>
                <div className="p-4 rounded">
                     <h3 className="text-xl font-bold mb-2 text-indigo-600">3. Respond & Rate</h3>
                    <p className="text-gray-600">Volunteers accept tasks, respond, and mark completion. Performance can be rated to ensure quality.</p>
                </div>
            </div>
       </div>

    </div>
  );
}

export default HomePage;
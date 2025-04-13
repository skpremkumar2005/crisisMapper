import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa'; // Using react-icons for stars: npm install react-icons
import { toast } from 'react-toastify';
import api from '../../services/api';

function RatingComponent({ responseId, ratedVolunteerId, onRatingSuccess }) {
  const [rating, setRating] = useState(0); // 0 means no rating selected yet
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [photoProof, setPhotoProof] = useState(null); // For file upload (optional)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    // Basic file handling, add size/type validation
    setPhotoProof(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
        setError("Please select a star rating.");
        return;
    }
    setLoading(true);
    setError('');

    // Using FormData if there's a photo upload
    const formData = new FormData();
    formData.append('responseId', responseId);
    formData.append('rating', rating);
    if (comment) {
      formData.append('comment', comment);
    }
     if (ratedVolunteerId) { // Pass volunteer ID if available directly (sometimes needed)
        formData.append('ratedVolunteer', ratedVolunteerId); // Backend might get this from responseId anyway
    }
    if (photoProof) {
      formData.append('photoProof', photoProof); // Backend needs to handle file uploads (e.g., using multer)
    }

    // Determine content type based on whether a file is being uploaded
    const config = photoProof
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : { headers: { 'Content-Type': 'application/json' } };

    // Data to send if not using FormData
     const jsonData = {
        responseId,
        rating,
        comment,
        ratedVolunteer: ratedVolunteerId, // Include if needed by backend
        // photoProofUrl: '...' // If only submitting URL after uploading elsewhere
    };

    try {
      // Adjust payload based on whether using FormData or JSON
      const payload = photoProof ? formData : jsonData;
      const { data } = await api.post('/ratings', payload, config);

      toast.success('Rating submitted successfully!');
      if (onRatingSuccess) {
        onRatingSuccess(data.rating); // Pass back the submitted rating data
      }
      // Optionally reset form or redirect
      setRating(0);
      setComment('');
      setPhotoProof(null);

    } catch (err) {
      console.error("Error submitting rating:", err);
      const errMsg = err.response?.data?.message || 'Failed to submit rating.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-6 bg-white shadow-md mt-6">
       <h3 className="text-xl font-semibold mb-4 text-center">Rate Volunteer Performance</h3>
       {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {/* Star Rating Input */}
        <div className="flex justify-center items-center mb-4">
             <label className="mr-4 text-gray-700 font-medium">Your Rating:</label>
            <div>
                {[...Array(5)].map((_, index) => {
                    const ratingValue = index + 1;
                    return (
                        <label key={ratingValue} className="cursor-pointer">
                            <input
                                type="radio"
                                name="rating"
                                value={ratingValue}
                                onClick={() => setRating(ratingValue)}
                                className="hidden" // Hide the actual radio button
                            />
                            <FaStar
                                className="inline-block"
                                color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                                size={30}
                                onMouseEnter={() => setHover(ratingValue)}
                                onMouseLeave={() => setHover(0)}
                            />
                        </label>
                    );
                })}
            </div>
        </div>

        {/* Comment Textarea */}
        <div className="mb-4">
            <label htmlFor={`comment-${responseId}`} className="block text-sm font-medium text-gray-700 mb-1">
                Add a Comment (Optional):
            </label>
            <textarea
                id={`comment-${responseId}`}
                rows="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Share your experience with the volunteer..."
            ></textarea>
        </div>

         {/* Photo Upload (Optional) */}
        <div className="mb-6">
            <label htmlFor={`photo-${responseId}`} className="block text-sm font-medium text-gray-700 mb-1">
                Upload Photo Proof (Optional):
            </label>
            <input
                type="file"
                id={`photo-${responseId}`}
                onChange={handleFileChange}
                accept="image/*" // Accept only images
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
             {photoProof && <p className="text-xs text-gray-600 mt-1">Selected file: {photoProof.name}</p>}
        </div>

        {/* Submit Button */}
        <div className="text-center">
            <button
                type="submit"
                disabled={loading || rating === 0}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
        </div>
    </form>
  );
}

export default RatingComponent;
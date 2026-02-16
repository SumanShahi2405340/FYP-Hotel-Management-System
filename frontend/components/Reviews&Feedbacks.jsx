// components/ReviewsAndFeedbacks.jsx
"use client";
import React, { useEffect, useState } from "react";

export default function ReviewsandFeedbacks() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch("/api/owner/reviews")
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .catch((err) => {
        console.error("Error fetching reviews:", err);
        setReviews([]);
      });
  }, []);

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Reviews & Feedbacks</h2>
      <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "left" }}>
        <thead>
          <tr>
            <th>Guest Name</th>
            <th>Rating</th>
            <th>Feedback</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <tr key={index}>
                <td>{review.guestName}</td>
                <td>{review.rating}</td>
                <td>{review.comment}</td>
                <td>{review.date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>No reviews available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

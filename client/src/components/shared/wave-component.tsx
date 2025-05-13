import React from "react";
import "./WaveComponent.css";

const WaveComponent = () => {
  return (
    <div className="wave-container">
      <svg
        viewBox="0 0 1440 320"
        xmlns="http://www.w3.org/2000/svg"
        className="wave"
      >
        <path
          fill="#000"
          d="M0,192L720,320L1440,192L1440,320L720,320L0,320Z"
        ></path>
      </svg>
    </div>
  );
};

export default WaveComponent;

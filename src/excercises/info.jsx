import React, { useEffect, useRef } from "react";

export default function Info({ title, content, icon, onAnswered }) {
  const hasCalledRef = useRef(false);
  
  useEffect(() => {
    // Automatically mark as completed when the component mounts (only once)
    if (onAnswered && !hasCalledRef.current) {
      hasCalledRef.current = true;
      onAnswered(true, 2);
    }
  }, [onAnswered]);

  return (
    <div className="info-banner">
      {icon && <div className="info-icon">{icon}</div>}
      <div className="info-content">
        {title && <h2 className="info-title">{title}</h2>}
        <p className="info-text">{content}</p>
      </div>
    </div>
  );
}


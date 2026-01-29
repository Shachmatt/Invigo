import React from "react";






export default function Bottom({ shoutout, button, disabled, link, onClicked}) {





    return (

<div className="summary">
            <div className="xp-award"></div>
{link === 1 && (
  <a href="#" onClick={(e) => { 
    e.preventDefault(); // Zabrání přidání # do URL
    window.location.reload(); 
  }}>
    <button disabled={disabled} className="completion-badge">{button}</button>
  </a>
)}            {link===0 &&<button disabled={disabled} onClick={onClicked} className="completion-badge">{button}</button>}
        </div>  

    )
}



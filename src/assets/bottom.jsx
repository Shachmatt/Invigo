import React from "react";






export default function Bottom({ shoutout, button, disabled, link, onClicked}) {





    return (

<div className="summary">
            <h2 className="shoutout">{shoutout}</h2>
            <div className="xp-award"></div>
            {link===1 && <a href="/"><button disabled={disabled} className="completion-badge">{button}</button></a>}
            {link===0 &&<button disabled={disabled} onClick={onClicked} className="completion-badge">{button}</button>}
        </div>  

    )
}



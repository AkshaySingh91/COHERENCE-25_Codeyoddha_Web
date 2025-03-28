import React, { useEffect, useState } from "react";
import AirQualityMap from "./Pages/Hompage/AirQualityMap";


function App() {
  return <>
    <div className="main-map w-full h-80">
      <AirQualityMap />
    </div>
  </>;
}

export default App;

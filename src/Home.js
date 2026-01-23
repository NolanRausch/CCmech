import React, { useState } from 'react';
import './Home.css';
import BoxView1 from './BoxView1';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import DbTestViewer from "./DbTestViewer";
import Demo from "./Demo";
import Rough from "./Rough";
import AirDistribution from "./AIrDistribution";
import Electrical from "./Electrical";
import Piping from "./Piping";
import Completion from "./Completion";
import MLabor from "./MLabor";
import PLabor from "./PLabor";
import Labor from "./Labor";
import Labor2 from "./Labor2";
import Labor3 from "./Labor3";
import Labor4 from "./Labor4";
import Labor5 from "./Labor5";
import Labor6 from "./Labor6";
import Labor7 from "./Labor7";
function Home() {
  const numbers = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];

    const [selected, setSelected] = useState(null); // track which box is active

  if (selected == 1000) {
    // show the component for the selected box
    return <BoxView1 number={selected} onBack={() => setSelected(null)} />;
  }
  const handleClearAll = async () => {
  if (!window.confirm("Are you sure you want to delete ALL equipment?")) return;

  try {
    const res = await fetch("http://localhost:7071/api/equipment/clear", {
      method: "DELETE"
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to clear table");

    console.log("✅ Cleared:", data);
    alert("✅ All equipment deleted");

  } catch (err) {
    console.error("❌ Clear failed:", err);
    alert("❌ Error clearing table: " + err.message);
  }
};


  return (
    <div className="home-container">
      <h1>Capital City</h1>
      <div>
  
      <DbTestViewer />
     
    

    </div>
    <div><Labor/></div>
        <div>
  
      <Demo />
     

    </div>
    <div><Labor2/></div>
     <div>
  
      <Rough />
     
    </div>
     <div><Labor3/></div>
     
    <div>
  
      <AirDistribution />
     

    </div>
     <div><Labor4/></div>
     <div>
  
      <Electrical />
    

    </div>
     <div><Labor5/></div>
     <div>
  
      <Piping />
      
    </div>
         <div><Labor6/></div>
    <div>
  
      <Completion />
    
    </div>
     <div><Labor7/></div>
    </div>
  );
}

export default Home;

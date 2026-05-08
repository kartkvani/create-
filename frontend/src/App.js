import { useEffect } from "react";
import "@/App.css";

function App() {
  useEffect(() => {
    window.location.replace("/olevia.html");
  }, []);
  return null;
}

export default App;

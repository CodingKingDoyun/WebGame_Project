import AuthPanel from "./components/AuthPanel";
import FarmGame from "./components/FarmGame";

function App() {
  return (
    <div style={{ background: "#111", height: "100vh", color: "white" }}>
      <AuthPanel />
      <FarmGame />
    </div>
  );
}

export default App;

import AuthPanel from "./components/AuthPanel";
import FarmGame from "./components/FarmGame";
import FarmGrid from './components/FarmGrid';

function App() {
  return (
    <div style={{ background: "#111", height: "100vh", color: "white" }}>
      <AuthPanel />
      <FarmGame />
      <FarmGrid />
    </div>
  );
}

export default App;

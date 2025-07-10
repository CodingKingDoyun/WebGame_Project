// App.tsx
import AuthPanel from "./components/AuthPanel";
import FarmGame from "./components/FarmGame";
import FarmGrid from './components/FarmGrid';
import './index.css';


function App() {
  return (
      <div className="app-container">
        <AuthPanel />
        <FarmGame />
        <FarmGrid />
      </div>
  );
}

export default App;

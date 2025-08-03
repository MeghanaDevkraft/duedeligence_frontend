import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import CreateModule from "./pages/CreateModule";
import CreateProject from "./pages/CreateProject";
import ProjectView from "./pages/ProjectView";
import ProjectAnswers from "./pages/ProjectAnswers";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create-module" element={<CreateModule />} /> 
        <Route path="/create-module/:id" element={<CreateModule />} /> 
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/project-view/:projectId" element={<ProjectView />} />
        <Route path="/project-answers/:projectId" element={<ProjectAnswers />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Basketball from "./pages/Basketball";
import Badminton from "./pages/Badminton";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/basketball" element={<Basketball />} />
        <Route path="/badminton" element={<Badminton />} />
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Basketball from "./pages/Basketball";
import Badminton from "./pages/Badminton";
import TableTennis from "./pages/TableTennis";
import Pickleball from "./pages/Pickleball";
import BasketballSelect from "./pages/BasketballSelect";
import Basketball3v3 from "./pages/Basketball3v3";
import Player from "./pages/Player";
import Auth from "./pages/Auth";
import ClaimMatch from "./pages/ClaimMatch";
import PublicProfile from "./pages/PublicProfile";
import QuickRecord from "./pages/QuickRecord";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/basketball" element={<Basketball />} />
        <Route path="/badminton" element={<Badminton />} />
        <Route path="/tabletennis" element={<TableTennis />} />
        <Route path="/pickleball" element={<Pickleball />} />
        <Route path="/basketball-select" element={<BasketballSelect />} />
        <Route path="/basketball3v3" element={<Basketball3v3 />} />
        <Route path="/player" element={<Player />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/quick-record" element={<QuickRecord />} />
        <Route path="/claim/:matchId" element={<ClaimMatch />} />
        <Route path="/profile/:uid" element={<PublicProfile />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
      </Routes>
    </BrowserRouter>
  );
}

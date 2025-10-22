import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Header from './components/Header';
import About from './pages/About';
import Help from './pages/Help';
import Home from './pages/Home';
import TripPage from './pages/TripPage';
import ParticipantsPage from './pages/TripPage/Participants';
import ParticipantDetail from './pages/TripPage/Participants/ParticipantDetail';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />
            <Route path="/trip/:id" element={<TripPage />} />
            <Route path="/trip/:id/participants" element={<ParticipantsPage />} />
            <Route path="/trip/:id/participants/:participantId" element={<ParticipantDetail />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

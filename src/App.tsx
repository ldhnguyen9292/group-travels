import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Header from './components/Header';
import StorageWarning from './components/StorageWarning';
import I18nProvider from './i18n/I18nProvider';
import About from './pages/About';
import Help from './pages/Help';
import Home from './pages/Home';
import TripPage from './pages/TripPage';
import ParticipantDetail from './pages/TripPage/Participants/ParticipantDetail';
import ParticipantsPage from './pages/TripPage/Participants';
import TripStoreProvider from './store/TripStoreProvider';
import ThemeProvider from './theme/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <TripStoreProvider>
          <BrowserRouter>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
                <StorageWarning />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/trip/:id" element={<TripPage />} />
                  <Route path="/trip/:id/participants" element={<ParticipantsPage />} />
                  <Route
                    path="/trip/:id/participants/:participantId"
                    element={<ParticipantDetail />}
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </TripStoreProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

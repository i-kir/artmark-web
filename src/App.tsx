import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ReviewProvider } from './contexts/ReviewContext';
import { ClipProvider } from './contexts/ClipContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Search from './pages/Search';
import MyPage from './pages/MyPage';
import MuseumDetail from './pages/MuseumDetail';
import ExhibitionDetail from './pages/ExhibitionDetail';
import ReviewNew from './pages/ReviewNew';

const App: React.FC = () => {
  return (
    <ReviewProvider>
      <ClipProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/museum/:id" element={<MuseumDetail />} />
                <Route path="/exhibition/:id" element={<ExhibitionDetail />} />
                <Route path="/review/new" element={<ReviewNew />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </ClipProvider>
    </ReviewProvider>
  );
};

export default App;

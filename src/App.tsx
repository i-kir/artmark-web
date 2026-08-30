import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import RequireAuth from './components/RequireAuth';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Search from './pages/Search';
import MyPage from './pages/MyPage';
import MuseumDetail from './pages/MuseumDetail';
import ExhibitionDetail from './pages/ExhibitionDetail';
import ReviewNew from './pages/ReviewNew';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/museum/:id" element={<MuseumDetail />} />
                <Route path="/exhibition/:id" element={<ExhibitionDetail />} />
                <Route
                  path="/mypage"
                  element={
                    <RequireAuth>
                      <MyPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/review/new"
                  element={
                    <RequireAuth>
                      <ReviewNew />
                    </RequireAuth>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

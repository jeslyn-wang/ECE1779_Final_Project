import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import DiscoverPage from "./pages/DiscoverPage.jsx";
import RestaurantPage from "./pages/RestaurantPage.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DiscoverPage />} />
        <Route path="restaurants/:id" element={<RestaurantPage />} />
        <Route path="users/:id" element={<ProfilePage />} />
        <Route
          path="feed"
          element={
            <RequireAuth>
              <FeedPage />
            </RequireAuth>
          }
        />
        <Route path="login" element={<AuthPage mode="login" key="login" />} />
        <Route path="signup" element={<AuthPage mode="signup" key="signup" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

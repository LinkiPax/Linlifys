
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import { Provider } from "react-redux";
import store from "./store";
import { NotificationProvider } from "./context/NotificationContext";

// Import your components
import Signup from "./component/Signup/Signup";
import Login from "./component/Login/Login";
import PersonalDetails from "./component/PersonalDetailForm/PersonalDetail";
import HomePage from "./component/Home/HomePage";
import ProfilePage from "./component/Profile/Profile";
import MyNetwork from "./component/MyNetwork/Mynewwork";
import MessagesList from "./component/messages/Message";
import NotificationPage from "./component/notification/NotificationPage";
import Resume from "./Surprise/Resume";
import PeopleProfile from "./component/Profile/PeopleProfile";
import ChatPage from "./component/messages/ChatPage";
import MeetingApp from "./component/meeting/Meetingroom";
import StatusEditorPage from "./component/Status/StatusEditor";
import Short from "./component/Shorts/Short";
import ShortUpload from "./component/Shorts/ShortsUpload";
import Setting from "./component/Setting/Setting";
import MainPage from "./component/MainPage/MainPage";
import Jobs from "./component/Jobs/Jobs";
import Startup from "./component/Jobs/Startup";
import Hackathons from "./component/Jobs/Hackathons";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <NotificationProvider userId={localStorage.getItem("userId")}>
        <Router>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/Signup" element={<Signup />} />
            <Route
              path="/personal-details/:userId"
              element={<PersonalDetails />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/home/:userId" element={<HomePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/network" element={<MyNetwork />} />
            <Route path="/messages" element={<MessagesList />} />
            <Route path="/messages/chat/:targetUserId" element={<ChatPage />} />
            <Route path="/notifications" element={<NotificationPage />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/profile-view/:userId" element={<PeopleProfile />} />
            <Route path="/meeting" element={<MeetingApp />} />
            <Route path="/status-editor" element={<StatusEditorPage />} />
            <Route path="/shorts" element={<Short />} />
            <Route path="/uploadshorts" element={<ShortUpload />} />
            <Route path="/settings" element={<Setting />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/hackathons" element={<Hackathons />} />
            <Route path="/startup" element={<Startup />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </Provider>
  </StrictMode>
);

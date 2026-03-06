import { useState } from "react";
import "./App.css";
import { RootLayout } from "./layout/RootLayout";
import ActivityPage from "./pages/activity/ActivityPage";
import StaffPage from "./pages/staff/StaffPage";
import SchedulePage from "./pages/schedule/SchedulePage";
import LessonPage from "./pages/lesson/LessonPage";

function App() {
  const [currentPage, setCurrentPage] = useState("overview");

  return (
    <RootLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      <div className="text-lg">
        {currentPage === "overview" && <p>Overview Page</p>}
        {currentPage === "schools" && <p>Schools Page</p>}
        {currentPage === "lessons" && <LessonPage />}
        {currentPage === "schedules" && <SchedulePage />}
        {currentPage === "staff" && <StaffPage />}
        {currentPage === "activities" && <ActivityPage />}
      </div>
    </RootLayout>
  );
}

export default App;
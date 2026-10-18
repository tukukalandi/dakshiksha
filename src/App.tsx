/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ClassView } from './pages/ClassView';
import { SubjectView } from './pages/SubjectView';
import { ChapterView } from './pages/ChapterView';
import { POGuide } from './pages/POGuide';
import { BDBranch } from './pages/BDBranch';
import { Rules } from './pages/Rules';
import { Contact } from './pages/Contact';
import { PhotoGallery } from './pages/PhotoGallery';
import { AccountantExam } from './pages/AccountantExam';
import { SavingsBranch } from './pages/SavingsBranch';
import { OtherBranch } from './pages/OtherBranch';
import { SearchResults } from './pages/SearchResults';
import { AdminPortal } from './pages/AdminPortal';
import { PublicPortal } from './pages/PublicPortal';
import { MyBranchPortal } from './pages/MyBranchPortal';
import { MyAppsPage } from './pages/MyAppsPage';
import { MyAppViewer } from './pages/MyAppViewer';
import { ExamPortal } from './pages/ExamPortal';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/admin-portal" element={<AdminPortal />} />
              <Route path="/portal/:categorySlug" element={<PublicPortal />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/my-branch-portal" element={<MyBranchPortal />} />
              <Route path="/my-apps" element={<MyAppsPage />} />
              <Route path="/my-apps/:appId" element={<MyAppViewer />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/photo-gallery" element={<PhotoGallery />} />
              <Route path="/exams/accountant" element={<AccountantExam />} />
              <Route path="/branch/savings" element={<SavingsBranch />} />
              <Route path="/branch/other" element={<OtherBranch />} />
              <Route path="/exam-portal" element={<ExamPortal />} />
              <Route path="/competitive-exams" element={<ExamPortal />} />
              <Route path="/exams/po-guide" element={<POGuide />} />
              <Route path="/branch/bd" element={<BDBranch />} />
              <Route path="/class/:classId" element={<ClassView />} />
              <Route path="/class/:classId/subject/:subjectId" element={<SubjectView />} />
              <Route path="/class/:classId/subject/:subjectId/chapter/:chapterId" element={<ChapterView />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

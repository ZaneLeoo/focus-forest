import { useState, useEffect, lazy, Suspense } from 'react';
import { useFocus } from './context/FocusContext';
import { ViewMode, FocusSession, NavTab } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { FocusTimer } from './components/FocusTimer';
import { TreeDetailModal } from './components/TreeDetailModal';
import { SpeciesPickerModal } from './components/SpeciesPickerModal';
import { AmbientSoundModal } from './components/AmbientSoundModal';
import { GardenerProfileModal } from './components/GardenerProfileModal';
import { LoginView } from './components/LoginView';

const ForestView = lazy(() => import('./components/ForestView').then(m => ({ default: m.ForestView })));
const StatsView = lazy(() => import('./components/StatsView').then(m => ({ default: m.StatsView })));
const RankingView = lazy(() => import('./components/RankingView').then(m => ({ default: m.RankingView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));

const ViewFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-3 border-[#125238] border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  const {
    isLoggedIn,
    userName,
    userAvatar,
    setUserAvatar,
    login,
    logout,
    selectedSpeciesId,
    setSelectedSpeciesId,
    navTab,
    setNavTab,
    settings,
    updateSettings,
    sessions,
    addSession,
    deleteSession,
    syncing,
  } = useFocus();

  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    return navTab === 'focus' ? 'timer' : navTab;
  });
  const [selectedSession, setSelectedSession] = useState<FocusSession | null>(null);
  const [showAmbientModal, setShowAmbientModal] = useState(false);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Sync currentView ↔ navTab bidirectionally
  const handleSelectView = (view: ViewMode) => {
    setCurrentView(view);
    const tab = view === 'timer' ? 'focus' : view;
    setNavTab(tab as NavTab);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // Scroll to top on login
  useEffect(() => {
    if (isLoggedIn) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [isLoggedIn]);

  useEffect(() => {
    const mapped = navTab === 'focus' ? 'timer' : navTab;
    if (mapped !== currentView) {
      setCurrentView(mapped);
    }
  }, [navTab]);

  // Handle login
  const handleLogin = (name: string, avatar: string) => {
    login(name, avatar);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Today's completed sessions count
  const todayTreesCount = sessions.filter(s => {
    if (!s.completed) return false;
    const d = new Date(s.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  // Total trees (completed sessions)
  const totalTreesPlanted = sessions.filter(s => s.completed).length;

  // Delete session
  const handleDeleteSession = (id: string) => {
    deleteSession(id);
  };

  // Update settings
  const handleUpdateSettings = (newSettings: Partial<typeof settings>) => {
    updateSettings(newSettings);
  };

  // Export CSV
  const handleExportCSV = () => {
    const completedSessions = sessions.filter(s => s.completed);
    if (completedSessions.length === 0) {
      alert('暂无更多种植记录可导出');
      return;
    }

    const headers = ['ID,树种,分类,时长(分钟),稀有,状态,种植时间\n'];
    const rows = completedSessions.map(s =>
      `"${s.id}","${s.treeName}","${s.category}",${s.durationMinutes},"${s.isRare ? '是' : '否'}","${s.completed ? '已完成' : '未完成'}","${new Date(s.createdAt).toLocaleString('zh-CN')}"\n`
    );

    const blob = new Blob([headers.concat(rows).join('')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FocusForest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show loading while syncing from server
  if (syncing) {
    return (
      <div className="min-h-screen w-full bg-[var(--bg-page)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#125238] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-muted)] font-medium">正在同步数据...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[#1b1c17] custom-scrollbar overflow-x-hidden relative">
      <div className="grain-overlay"></div>

      <Header
        currentView={currentView}
        onSelectView={handleSelectView}
        totalTreesCount={totalTreesPlanted}
        userName={userName}
        userAvatar={userAvatar}
        onOpenProfileModal={() => setShowProfileModal(true)}
      />

      <Sidebar
        currentView={currentView}
        onSelectView={handleSelectView}
        treesCount={totalTreesPlanted}
        onUnlockSpeciesClick={() => setShowSpeciesModal(true)}
      />

      <main className="px-4 md:pl-72 md:pr-8 transition-all pt-16 pb-20 md:pt-24 md:pb-12 min-h-screen">
        {currentView === 'timer' && (
          <div className="min-h-[calc(100vh-8rem)] min-h-[calc(100svh-8rem)] flex flex-col items-center justify-start md:justify-center pt-2 pb-4">
            <FocusTimer
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              todayTreesCount={todayTreesCount}
              onOpenAmbientModal={() => setShowAmbientModal(true)}
              onOpenSpeciesModal={() => setShowSpeciesModal(true)}
              selectedSpeciesId={selectedSpeciesId}
              addSession={addSession}
            />
          </div>
        )}

        {currentView === 'forest' && (
          <Suspense fallback={<ViewFallback />}>
            <ForestView />
          </Suspense>
        )}

        {currentView === 'stats' && (
          <Suspense fallback={<ViewFallback />}>
            <StatsView sessions={sessions} />
          </Suspense>
        )}

        {currentView === 'ranking' && (
          <Suspense fallback={<ViewFallback />}>
            <RankingView />
          </Suspense>
        )}

        {currentView === 'settings' && (
          <Suspense fallback={<ViewFallback />}>
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onExportCSV={handleExportCSV}
              onResetData={() => {
                sessions.forEach(s => deleteSession(s.id));
              }}
              onOpenAmbientModal={() => setShowAmbientModal(true)}
            />
          </Suspense>
        )}
      </main>

      <BottomNav currentView={currentView} onSelectView={handleSelectView} />

      <TreeDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onDeleteSession={handleDeleteSession}
      />

      <SpeciesPickerModal
        isOpen={showSpeciesModal}
        onClose={() => setShowSpeciesModal(false)}
        selectedSpeciesId={selectedSpeciesId}
        onSelectSpecies={setSelectedSpeciesId}
        currentDurationMinutes={settings.focusDuration}
      />

      <AmbientSoundModal
        isOpen={showAmbientModal}
        onClose={() => setShowAmbientModal(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <GardenerProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userName={userName}
        userAvatar={userAvatar}
        onChangeAvatar={setUserAvatar}
        totalTreesCount={totalTreesPlanted}
        onSelectView={handleSelectView}
        onLogout={handleLogout}
      />
    </div>
  );
}

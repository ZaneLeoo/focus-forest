import { useState, useEffect, lazy, Suspense } from 'react';
import { useFocus } from './context/FocusContext';
import { ViewMode, PlantedTree, UserSettings, NavTab } from './types';
import {
  getStoredTrees,
  saveTree,
  deleteTree,
  clearAllTrees,
} from './utils/storage';
import { deleteSessionRemote } from './services/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { FocusTimer } from './components/FocusTimer';
import { TreeDetailModal } from './components/TreeDetailModal';
import { SpeciesPickerModal } from './components/SpeciesPickerModal';
import { AmbientSoundModal } from './components/AmbientSoundModal';
import { GardenerProfileModal } from './components/GardenerProfileModal';
import { LoginView } from './components/LoginView';

// Lazy-loaded views — only downloaded when user navigates to them
const ForestView = lazy(() => import('./components/ForestView'));
const StatsView = lazy(() => import('./components/StatsView'));
const SettingsView = lazy(() => import('./components/SettingsView'));

const ViewFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-3 border-[#125238] border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  const { isLoggedIn, userName, userAvatar, setUserAvatar, login, logout, selectedSpeciesId, setSelectedSpeciesId, navTab, setNavTab, settings, updateSettings, sessions } = useFocus();

  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    const tab = navTab;
    return tab === 'focus' ? 'timer' : tab;
  });
  const [trees, setTrees] = useState<PlantedTree[]>(() => getStoredTrees());

  const [selectedTree, setSelectedTree] = useState<PlantedTree | null>(null);
  const [showAmbientModal, setShowAmbientModal] = useState(false);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Sync currentView ↔ navTab bidirectionally
  const handleSelectView = (view: ViewMode) => {
    setCurrentView(view);
    const tab = view === 'timer' ? 'focus' : view;
    setNavTab(tab as NavTab);
  };

  useEffect(() => {
    const mapped = navTab === 'focus' ? 'timer' : navTab;
    if (mapped !== currentView) {
      setCurrentView(mapped);
    }
  }, [navTab]);

  // Handle login handler
  const handleLogin = (name: string, avatar: string) => {
    login(name, avatar);
    clearAllTrees();
    setTrees([]);
  };

  // Handle logout handler
  const handleLogout = () => {
    logout();
  };

  // Today's trees count
  const todayTreesCount = trees.filter(t => {
    const d = new Date(t.timestamp);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }).length;

  // Tree completion handler
  const handleTreeCompleted = (newTreeData: Omit<PlantedTree, 'id' | 'plantedAt' | 'timestamp'>) => {
    const created = saveTree(newTreeData);
    setTrees(prev => [created, ...prev]);
  };

  // Tree delete handler
  const handleDeleteTree = (id: string) => {
    deleteTree(id);
    setTrees(prev => prev.filter(t => t.id !== id));
  };

  // Update settings handler
  const handleUpdateSettings = (newSettings: UserSettings) => {
    updateSettings(newSettings);
  };

  // Reset both local + server
  const handleResetData = () => {
    clearAllTrees();
    setTrees([]);
    sessions.forEach(s => deleteSessionRemote(s.id).catch(() => {}));
  };

  // Export CSV handler
  const handleExportCSV = () => {
    if (trees.length === 0) {
      alert('暂无更多种植记录可导出');
      return;
    }

    const headers = ['ID,树种,分类,时长(分钟),稀有,状态,种植时间\n'];
    const rows = trees.map(t =>
      `"${t.id}","${t.name}","${t.category}",${t.durationMinutes},"${t.isRare ? '是' : '否'}","${t.status}","${t.plantedAt}"\n`
    );

    const blob = new Blob([headers.concat(rows).join('')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FocusForest_Trees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#fbf9f0] text-[#1b1c17] custom-scrollbar overflow-x-hidden relative">
      <div className="grain-overlay"></div>

      {/* Top Header */}
      <Header
        currentView={currentView}
        onSelectView={handleSelectView}
        totalTreesCount={trees.length}
        userName={userName}
        userAvatar={userAvatar}
        onOpenProfileModal={() => setShowProfileModal(true)}
      />

      {/* Sidebar for Desktop */}
      <Sidebar
        currentView={currentView}
        onSelectView={handleSelectView}
        treesCount={trees.length}
        onUnlockSpeciesClick={() => setShowSpeciesModal(true)}
      />

      {/* Main Content Area — all views kept mounted, hidden via CSS */}
      <main className="px-4 md:pl-72 md:pr-8 transition-all pt-14 pb-20 md:pt-24 md:pb-12 min-h-screen">
        {currentView === 'timer' && (
          <div className="min-h-[calc(100vh-8rem)] min-h-[calc(100svh-8rem)] flex flex-col items-center justify-start md:justify-center pt-2 pb-4">
            <FocusTimer
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onTreeCompleted={handleTreeCompleted}
              todayTreesCount={todayTreesCount}
              onOpenAmbientModal={() => setShowAmbientModal(true)}
              onOpenSpeciesModal={() => setShowSpeciesModal(true)}
              selectedSpeciesId={selectedSpeciesId}
            />
          </div>
        )}

        <div className={currentView === 'forest' ? '' : 'hidden'}>
          <Suspense fallback={<ViewFallback />}>
            {currentView === 'forest' && <ForestView />}
          </Suspense>
        </div>

        <div className={currentView === 'stats' ? '' : 'hidden'}>
          <Suspense fallback={<ViewFallback />}>
            {currentView === 'stats' && <StatsView trees={trees} />}
          </Suspense>
        </div>

        <div className={currentView === 'settings' ? '' : 'hidden'}>
          <Suspense fallback={<ViewFallback />}>
            {currentView === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onExportCSV={handleExportCSV}
                onResetData={handleResetData}
                onOpenAmbientModal={() => setShowAmbientModal(true)}
              />
            )}
          </Suspense>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav currentView={currentView} onSelectView={handleSelectView} />

      {/* Modals */}
      <TreeDetailModal
        tree={selectedTree}
        onClose={() => setSelectedTree(null)}
        onDeleteTree={handleDeleteTree}
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
        totalTreesCount={trees.length}
        onSelectView={handleSelectView}
        onLogout={handleLogout}
      />
    </div>
  );
}

import { useState } from 'react';
import { ImportView } from './views/ImportView';
import { SettingsView } from './views/SettingsView';
import { CloudUpload, Settings } from 'lucide-react';
import { TabButton } from './components/TabButton';
import { AppFooter } from './components/AppFooter';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './components/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { SoundToggle } from './components/SoundToggle';

function App() {
  const [activeTab, setActiveTab] = useState<'import' | 'settings'>('import');

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="container app-layout">
          <div className="top-controls">
            <SoundToggle />
            <ThemeToggle />
          </div>
          <header className="app-header animate-fade-up">
            <h1 className="app-title animate-fade-up delay-100">ImgCompressor</h1>
          <p className="app-subtitle animate-fade-up delay-200">Premium Privacy-First Batch Compression</p>
        </header>

        <main className="card app-main animate-fade-up delay-300">
          <nav className="app-nav">
            <TabButton
              active={activeTab === 'import'}
              onClick={() => setActiveTab('import')}
              icon={<CloudUpload size={18} />}
              label="Compress"
            />
            <TabButton
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<Settings size={18} />}
              label="Settings"
            />
          </nav>

          <div className="app-content">
            {activeTab === 'import' && <ImportView />}
            {activeTab === 'settings' && <SettingsView onNext={() => setActiveTab('import')} />}
          </div>
        </main>

        <AppFooter />
      </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

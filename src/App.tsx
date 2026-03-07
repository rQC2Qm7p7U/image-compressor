import { useState } from 'react';
import { ImportView } from './views/ImportView';
import { SettingsView } from './views/SettingsView';
import { CloudUpload, Settings } from 'lucide-react';
import { TabButton } from './components/TabButton';
import { AppFooter } from './components/AppFooter';
import { ToastProvider } from './components/Toast';

function App() {
  const [activeTab, setActiveTab] = useState<'import' | 'settings'>('import');

  return (
    <ToastProvider>
      <div className="container app-layout">
        <header className="app-header">
          <h1 className="app-title">ImgCompressor</h1>
          <p className="app-subtitle">Premium Privacy-First Batch Compression</p>
        </header>

        <main className="card app-main">
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
  );
}

export default App;

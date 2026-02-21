import { useState, useEffect } from 'react';
import { ImportView } from './views/ImportView';
import { SettingsView } from './views/SettingsView';
import { QueueView } from './views/QueueView';
import { CloudUpload, Settings, List } from 'lucide-react';
import { useAppStore } from './store/useAppStore';

function App() {
  const { files, setGlobalStatus } = useAppStore();
  const [activeTab, setActiveTab] = useState<'import' | 'settings' | 'queue'>('import');

  // Auto-redirect to Import when the Queue is cleared
  useEffect(() => {
    if (activeTab === 'queue' && files.length === 0) {
      setActiveTab('import');
    }
  }, [files.length, activeTab]);

  return (
    <div className="container" style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
      maxWidth: '1200px',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      <header style={{ marginBottom: '1rem', textAlign: 'center', flexShrink: 0 }}>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #fff 0%, #999 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          ImgCompressor
        </h1>
        <p style={{ color: 'hsl(var(--color-text-dim))', marginTop: '0.2rem', fontSize: '0.9rem' }}>
          Premium Privacy-First Batch Compression
        </p>
      </header>

      <main className="card" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0, // Critical for nested scroll
        overflow: 'hidden' // Prevent card from spilling out
      }}>
        <nav style={{ display: 'flex', borderBottom: '1px solid hsl(var(--color-border))', flexShrink: 0 }}>
          <TabButton
            active={activeTab === 'import'}
            onClick={() => setActiveTab('import')}
            icon={<CloudUpload size={18} />}
            label="Import"
            count={files.length === 0 ? undefined : files.length}
          />
          <TabButton
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={<Settings size={18} />}
            label="Settings"
          />
          <TabButton
            active={activeTab === 'queue'}
            onClick={() => setActiveTab('queue')}
            icon={<List size={18} />}
            label="Queue"
            count={files.length > 0 ? files.length : undefined}
          />
        </nav>

        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {activeTab === 'import' && <ImportView onFilesAdded={() => {
            setActiveTab('queue');
            setGlobalStatus('processing');
          }} />}
          {activeTab === 'settings' && <SettingsView onNext={() => setActiveTab('queue')} />}
          {activeTab === 'queue' && <QueueView />}
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: any, label: string, count?: number }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? 'hsl(var(--color-bg-hover))' : 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid hsl(var(--color-primary))' : '2px solid transparent',
        color: active ? 'hsl(var(--color-text))' : 'hsl(var(--color-text-dim))',
        padding: '1rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s',
        fontSize: '0.9rem',
        fontWeight: 500
      }}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span style={{
          background: 'hsl(var(--color-primary))',
          color: 'black',
          fontSize: '0.7rem',
          padding: '2px 6px',
          borderRadius: '10px',
          fontWeight: 700
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

export default App;

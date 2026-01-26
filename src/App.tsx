import { useState } from 'react';
import { ImportView } from './views/ImportView';
import { SettingsView } from './views/SettingsView';
import { QueueView } from './views/QueueView';
import { CloudUpload, Settings, List } from 'lucide-react';
import { useAppStore } from './store/useAppStore';

function App() {
  const { files } = useAppStore();
  const [activeTab, setActiveTab] = useState<'import' | 'settings' | 'queue'>('import');

  // Auto-switch to settings or queue when files are added could be a nice UX,
  // but for now let's keep it manual or state-driven.

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #fff 0%, #999 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ImgCompressor
        </h1>
        <p style={{ color: 'hsl(var(--color-text-dim))', marginTop: '0.5rem' }}>
          Premium Privacy-First Batch Compression
        </p>
      </header>

      <main className="card" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ display: 'flex', borderBottom: '1px solid hsl(var(--color-border))' }}>
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

        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {activeTab === 'import' && <ImportView onNext={() => setActiveTab('settings')} />}
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

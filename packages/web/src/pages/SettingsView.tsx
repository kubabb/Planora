import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Settings = {
  provider: string;
  model: string;
  apiKey: string;
  databasePath: string;
  qdrantUrl?: string;
};

export function SettingsView() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="error">Settings not available</div>;
  }

  return (
    <div className="settings-view">
      <div className="view-header">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <h1>Settings</h1>
      </div>

      <div className="settings-grid">
        <div className="setting-item">
          <label>Provider</label>
          <span>{settings.provider}</span>
        </div>
        <div className="setting-item">
          <label>Model</label>
          <span>{settings.model}</span>
        </div>
        <div className="setting-item">
          <label>API Key</label>
          <span className="masked">{settings.apiKey}</span>
        </div>
        <div className="setting-item">
          <label>Database</label>
          <span>{settings.databasePath}</span>
        </div>
        {settings.qdrantUrl && (
          <div className="setting-item">
            <label>Qdrant</label>
            <span>{settings.qdrantUrl}</span>
          </div>
        )}
      </div>
    </div>
  );
}

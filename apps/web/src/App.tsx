import { useEffect, useMemo, useState } from 'react';

type TabKey = 'cases' | 'hearings' | 'recordings';

type CaseItem = {
  id: string;
  caseNumber: string;
  title: string;
  proceedingCode: string;
  courtName: string;
  status: string;
};

type HearingItem = {
  id: string;
  caseId: string;
  status: string;
  recordingMode: string;
  scheduledAt: string;
  presidingJudgeName?: string;
  secretaryName?: string;
  location?: string;
};

type RecordingItem = {
  id: string;
  hearingId: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  status: string;
  sizeBytes: number;
};

const API_BASE = 'http://localhost:3000';
const API_KEY = 'change-me';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('cases');
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [hearings, setHearings] = useState<HearingItem[]>([]);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [status, setStatus] = useState('');

  const [caseForm, setCaseForm] = useState({
    caseNumber: '1-123/2026',
    title: 'Административное дело о применении меры',
    proceedingCode: 'APC',
    courtName: 'Бишкекский городской суд',
    legalProfileId: '00000000-0000-0000-0000-000000000001',
  });

  const [hearingForm, setHearingForm] = useState({
    caseId: '',
    scheduledAt: new Date().toISOString(),
    recordingMode: 'WRITTEN_PROTOCOL_WITH_AV',
    presidingJudgeName: 'Токтосов А.А.',
    secretaryName: 'Иванова Н.Н.',
    location: 'Зал №2',
  });

  const [recordingForm, setRecordingForm] = useState({
    hearingId: '',
    storageKey: 'recordings/demo/sample.wav',
  });

  const fetchCases = async () => {
    const response = await fetch(`${API_BASE}/cases`, {
      headers: { 'x-api-key': API_KEY },
    });
    const data = await response.json();
    setCases(data);
    if (!selectedCaseId && data[0]) {
      setSelectedCaseId(data[0].id);
    }
  };

  const fetchHearings = async (caseId?: string) => {
    const targetCaseId = caseId || selectedCaseId;
    if (!targetCaseId) {
      setHearings([]);
      return;
    }

    const response = await fetch(`${API_BASE}/cases/${targetCaseId}`, {
      headers: { 'x-api-key': API_KEY },
    });
    const data = await response.json();
    setHearings(data.hearings ?? []);
    if (data.hearings?.[0]) {
      setRecordingForm((prev) => ({ ...prev, hearingId: data.hearings[0].id }));
    }
  };

  const fetchRecordings = async () => {
    if (!selectedCaseId) {
      setRecordings([]);
      return;
    }

    const response = await fetch(`${API_BASE}/cases/${selectedCaseId}`, {
      headers: { 'x-api-key': API_KEY },
    });
    const data = await response.json();

    const list: RecordingItem[] = [];
    for (const hearing of data.hearings ?? []) {
      const hearingRes = await fetch(`${API_BASE}/hearings/${hearing.id}`, {
        headers: { 'x-api-key': API_KEY },
      });
      const hearingData = await hearingRes.json();
      for (const rec of hearingData.recordings ?? []) {
        list.push({
          id: rec.id,
          hearingId: rec.hearingId,
          originalName: rec.originalName,
          storageKey: rec.storageKey,
          mimeType: rec.mimeType,
          status: rec.status,
          sizeBytes: Number(rec.sizeBytes ?? 0),
        });
      }
    }

    setRecordings(list);
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const currentCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? cases[0],
    [cases, selectedCaseId],
  );

  useEffect(() => {
    if (!currentCase) return;
    setHearingForm((prev) => ({ ...prev, caseId: currentCase.id }));
    fetchHearings(currentCase.id);
    fetchRecordings();
  }, [currentCase]);

  const createCase = async () => {
    const response = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(caseForm),
    });
    const data = await response.json();
    setStatus(`Case created: ${data.id}`);
    await fetchCases();
  };

  const createHearing = async () => {
    const response = await fetch(`${API_BASE}/hearings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        ...hearingForm,
        caseId: selectedCaseId || hearingForm.caseId,
        instance: 'FIRST_INSTANCE',
        status: 'PLANNED',
      }),
    });
    const data = await response.json();
    setStatus(`Hearing created: ${data.id}`);
    if (selectedCaseId || hearingForm.caseId) {
      await fetchHearings(selectedCaseId || hearingForm.caseId);
    }
  };

  const createRecording = async () => {
    const response = await fetch(`${API_BASE}/recordings/upload`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
      },
      body: (() => {
        const formData = new FormData();
        formData.append('hearingId', recordingForm.hearingId || selectedCaseId || '');
        const blob = new Blob(['demo audio test content'], { type: 'audio/wav' });
        formData.append('file', blob, 'sample.wav');
        return formData;
      })(),
    });
    const data = await response.json();
    setStatus(`Recording created: ${data.id}`);
    await fetchRecordings();
  };

  const triggerASR = async () => {
    if (!recordings[0]) return;
    const response = await fetch(`${API_BASE}/transcription/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        storageKey: recordings[0].storageKey,
        language: 'ky',
      }),
    });
    const data = await response.json();
    setStatus(`ASR triggered: ${data.language ?? 'ky'}`);
  };

  const exportProtocol = async () => {
    const response = await fetch(`${API_BASE}/workflow/protocol/export/00000000-0000-0000-0000-000000000003`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
    });
    const data = await response.json();
    setStatus(`Protocol exported: ${data.fileName ?? 'docx'}`);
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Court workflow</p>
          <h1>Court Protocol</h1>
        </div>
        <div className="status-pill">{status || 'ready'}</div>
      </header>

      <nav className="tabs">
        {(['cases', 'hearings', 'recordings'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </nav>

      <div className="workspace">
        <aside className="sidebar">
          {activeTab === 'cases' && (
            <div className="panel">
              <h3>New case</h3>
              <input value={caseForm.caseNumber} onChange={(e) => setCaseForm({ ...caseForm, caseNumber: e.target.value })} placeholder="Case number" />
              <input value={caseForm.title} onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })} placeholder="Title" />
              <select value={caseForm.proceedingCode} onChange={(e) => setCaseForm({ ...caseForm, proceedingCode: e.target.value })}>
                <option value="APC">APC</option>
                <option value="GPK">GPK</option>
                <option value="UPK">UPK</option>
              </select>
              <input value={caseForm.courtName} onChange={(e) => setCaseForm({ ...caseForm, courtName: e.target.value })} placeholder="Court name" />
              <button onClick={createCase}>Create case</button>
            </div>
          )}

          {activeTab === 'hearings' && (
            <div className="panel">
              <h3>New hearing</h3>
              <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
                {cases.map((item) => (
                  <option key={item.id} value={item.id}>{item.caseNumber}</option>
                ))}
              </select>
              <input type="datetime-local" value={new Date(hearingForm.scheduledAt).toISOString().slice(0, 16)} onChange={(e) => setHearingForm({ ...hearingForm, scheduledAt: new Date(e.target.value).toISOString() })} />
              <select value={hearingForm.recordingMode} onChange={(e) => setHearingForm({ ...hearingForm, recordingMode: e.target.value })}>
                <option value="WRITTEN_PROTOCOL_WITH_AV">WRITTEN_PROTOCOL_WITH_AV</option>
                <option value="AV_WITH_SHORT_PROTOCOL">AV_WITH_SHORT_PROTOCOL</option>
                <option value="DIGITAL_AV_IS_PROTOCOL">DIGITAL_AV_IS_PROTOCOL</option>
              </select>
              <input value={hearingForm.presidingJudgeName} onChange={(e) => setHearingForm({ ...hearingForm, presidingJudgeName: e.target.value })} placeholder="Presiding judge" />
              <input value={hearingForm.secretaryName} onChange={(e) => setHearingForm({ ...hearingForm, secretaryName: e.target.value })} placeholder="Secretary" />
              <input value={hearingForm.location} onChange={(e) => setHearingForm({ ...hearingForm, location: e.target.value })} placeholder="Location" />
              <button onClick={createHearing}>Create hearing</button>
            </div>
          )}

          {activeTab === 'recordings' && (
            <div className="panel">
              <h3>Upload recording</h3>
              <select value={recordingForm.hearingId || selectedCaseId} onChange={(e) => setRecordingForm({ ...recordingForm, hearingId: e.target.value })}>
                {(hearings.length ? hearings : (selectedCaseId ? [{ id: selectedCaseId, caseId: selectedCaseId, status: 'planned', recordingMode: 'manual', scheduledAt: new Date().toISOString() }] : [])).map((item) => (
                  <option key={item.id} value={item.id}>{item.id}</option>
                ))}
              </select>
              <input value={recordingForm.storageKey} onChange={(e) => setRecordingForm({ ...recordingForm, storageKey: e.target.value })} placeholder="Storage key" />
              <button onClick={createRecording}>Create recording</button>
              <button className="secondary" onClick={triggerASR}>Trigger ASR</button>
              <button className="secondary" onClick={exportProtocol}>Export protocol</button>
            </div>
          )}
        </aside>

        <main className="content-panel">
          {activeTab === 'cases' && (
            <section className="table-card">
              <h3>Cases</h3>
              <table>
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Title</th>
                    <th>Code</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((item) => (
                    <tr key={item.id} onClick={() => setSelectedCaseId(item.id)} className={currentCase?.id === item.id ? 'selected' : ''}>
                      <td>{item.caseNumber}</td>
                      <td>{item.title}</td>
                      <td>{item.proceedingCode}</td>
                      <td><span className="badge">{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {activeTab === 'hearings' && (
            <section className="table-card">
              <h3>Hearings</h3>
              <table>
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>When</th>
                    <th>Mode</th>
                    <th>Judge</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hearings.map((item) => (
                    <tr key={item.id}>
                      <td>{item.caseId}</td>
                      <td>{new Date(item.scheduledAt).toLocaleString()}</td>
                      <td>{item.recordingMode}</td>
                      <td>{item.presidingJudgeName || '-'}</td>
                      <td><span className="badge">{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {activeTab === 'recordings' && (
            <section className="table-card">
              <h3>Recordings</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Hearing</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {recordings.map((item) => (
                    <tr key={item.id}>
                      <td>{item.originalName}</td>
                      <td>{item.hearingId}</td>
                      <td>{item.mimeType}</td>
                      <td><span className="badge">{item.status}</span></td>
                      <td>{Math.round(item.sizeBytes / 1024)} KB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

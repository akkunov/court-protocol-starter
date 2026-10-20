import { useCallback, useEffect, useMemo, useState } from 'react';

type TabKey = 'cases' | 'hearings' | 'recordings';
type CaseItem = {
  id: string; caseNumber: string; title: string; proceedingCode: string;
  courtName: string; status: string;
};
type HearingItem = {
  id: string; caseId: string; status: string; recordingMode: string;
  scheduledAt: string; presidingJudgeName?: string; secretaryName?: string; location?: string;
};
type RecordingItem = {
  id: string; hearingId: string; originalName: string; storageKey: string;
  mimeType: string; status: string; sizeBytes: number | string;
};
type ApiError = { message?: string | string[] };

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_API_KEY || '';

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (API_KEY) headers.set('x-api-key', API_KEY);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!response.ok) {
    let message = `HTTP ${response.status} ${response.statusText}`;
    try {
      const payload = (await response.json()) as ApiError;
      if (payload.message) {
        message = Array.isArray(payload.message) ? payload.message.join('; ') : payload.message;
      }
    } catch {
      // Keep the HTTP status as the error message if the response is not JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('cases');
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [hearings, setHearings] = useState<HearingItem[]>([]);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedHearingId, setSelectedHearingId] = useState('');
  const [selectedRecordingId, setSelectedRecordingId] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<'ky' | 'ru'>('ky');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Подключение к API…');
  const [error, setError] = useState('');

  const [caseForm, setCaseForm] = useState({
    caseNumber: '', title: '', proceedingCode: 'APC', courtName: 'Ош областынын Административдик соту',
    legalProfileId: '00000000-0000-0000-0000-000000000001',
  });
  const [hearingForm, setHearingForm] = useState({
    scheduledAt: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    recordingMode: 'WRITTEN_PROTOCOL_WITH_AV',
    presidingJudgeName: '', secretaryName: '', location: '',
  });

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? null,
    [cases, selectedCaseId],
  );

  const loadCases = useCallback(async () => {
    const data = await api<CaseItem[]>('/cases');
    setCases(data);
    setSelectedCaseId((current) => current && data.some((item) => item.id === current) ? current : (data[0]?.id ?? ''));
  }, []);

  const loadHearings = useCallback(async (caseId: string) => {
    if (!caseId) {
      setHearings([]);
      setSelectedHearingId('');
      setRecordings([]);
      return;
    }
    const data = await api<CaseItem & { hearings: HearingItem[] }>(`/cases/${encodeURIComponent(caseId)}`);
    const list = data.hearings ?? [];
    setHearings(list);
    setSelectedHearingId((current) => current && list.some((item) => item.id === current) ? current : (list[0]?.id ?? ''));
  }, []);

  const loadRecordings = useCallback(async (hearingId: string) => {
    if (!hearingId) {
      setRecordings([]);
      setSelectedRecordingId('');
      return;
    }
    const data = await api<{ recordings: RecordingItem[] }>(`/hearings/${encodeURIComponent(hearingId)}`);
    const list = data.recordings ?? [];
    setRecordings(list);
    setSelectedRecordingId((current) => current && list.some((item) => item.id === current) ? current : (list[0]?.id ?? ''));
  }, []);

  useEffect(() => {
    void loadCases().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить дела');
      setStatus('Ошибка подключения');
    });
  }, [loadCases]);

  useEffect(() => {
    void loadHearings(selectedCaseId).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить заседания');
    });
  }, [selectedCaseId, loadHearings]);

  useEffect(() => {
    void loadRecordings(selectedHearingId).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить аудиозаписи');
    });
  }, [selectedHearingId, loadRecordings]);

  async function runAction(label: string, action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
      setStatus(label);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      setError(message);
      setStatus('Операция не выполнена');
    } finally {
      setBusy(false);
    }
  }

  const createCase = () => runAction('Дело создано', async () => {
    const created = await api<CaseItem>('/cases', { method: 'POST', body: JSON.stringify(caseForm) });
    await loadCases();
    setSelectedCaseId(created.id);
  });

  const createHearing = () => runAction('Заседание создано', async () => {
    if (!selectedCaseId) throw new Error('Сначала выберите или создайте дело');
    const scheduledAt = new Date(hearingForm.scheduledAt).toISOString();
    const created = await api<HearingItem>('/hearings', {
      method: 'POST',
      body: JSON.stringify({
        ...hearingForm,
        scheduledAt,
        caseId: selectedCaseId,
        instance: 'FIRST_INSTANCE',
        status: 'PLANNED',
      }),
    });
    await loadHearings(selectedCaseId);
    setSelectedHearingId(created.id);
  });

  const uploadRecording = () => runAction('Аудиозапись загружена', async () => {
    if (!selectedHearingId) throw new Error('Выберите существующее судебное заседание');
    if (!audioFile) throw new Error('Выберите настоящий аудиофайл');
    const form = new FormData();
    form.append('hearingId', selectedHearingId);
    form.append('file', audioFile, audioFile.name);
    const created = await api<RecordingItem>('/recordings/upload', { method: 'POST', body: form });
    await loadRecordings(selectedHearingId);
    setSelectedRecordingId(created.id);
    setAudioFile(null);
  });

  const transcribeRecording = () => runAction('Распознавание завершено; сегменты сохранены', async () => {
    const recording = recordings.find((item) => item.id === selectedRecordingId);
    if (!recording) throw new Error('Выберите аудиозапись');
    const result = await api<{ segmentsSaved: number; status: string }>('/transcription/trigger', {
      method: 'POST',
      body: JSON.stringify({ storageKey: recording.storageKey, language }),
    });
    await loadRecordings(selectedHearingId);
    setStatus(`Распознавание завершено: сохранено фрагментов — ${result.segmentsSaved}`);
  });

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Система судебного делопроизводства</p>
          <h1>Court Protocol</h1>
        </div>
        <div className="status-pill">{busy ? 'Выполняется…' : status}</div>
      </header>

      {error && <div role="alert" className="panel" style={{ borderColor: '#b91c1c', color: '#b91c1c' }}>{error}</div>}

      <nav className="tabs" aria-label="Разделы">
        {([['cases', 'Дела'], ['hearings', 'Заседания'], ['recordings', 'Аудиозаписи']] as [TabKey, string][]).map(([tab, label]) => (
          <button key={tab} className={activeTab === tab ? 'tab active' : 'tab'} onClick={() => setActiveTab(tab)}>
            {label}
          </button>
        ))}
      </nav>

      <div className="workspace">
        <aside className="sidebar">
          {activeTab === 'cases' && (
            <div className="panel">
              <h3>Новое дело</h3>
              <input value={caseForm.caseNumber} onChange={(e) => setCaseForm({ ...caseForm, caseNumber: e.target.value })} placeholder="Номер дела" />
              <input value={caseForm.title} onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })} placeholder="Наименование дела" />
              <select value={caseForm.proceedingCode} onChange={(e) => setCaseForm({ ...caseForm, proceedingCode: e.target.value })}>
                <option value="APC">АПК</option><option value="GPK">ГПК</option><option value="UPK">УПК</option>
              </select>
              <input value={caseForm.courtName} onChange={(e) => setCaseForm({ ...caseForm, courtName: e.target.value })} placeholder="Наименование суда" />
              <input value={caseForm.legalProfileId} onChange={(e) => setCaseForm({ ...caseForm, legalProfileId: e.target.value })} placeholder="UUID правового профиля" />
              <button disabled={busy} onClick={() => void createCase()}>Создать дело</button>
            </div>
          )}

          {activeTab === 'hearings' && (
            <div className="panel">
              <h3>Новое заседание</h3>
              <label>Дело</label>
              <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
                <option value="">Выберите дело</option>
                {cases.map((item) => <option key={item.id} value={item.id}>{item.caseNumber}</option>)}
              </select>
              <label>Дата и время</label>
              <input type="datetime-local" value={hearingForm.scheduledAt} onChange={(e) => setHearingForm({ ...hearingForm, scheduledAt: e.target.value })} />
              <label>Режим протоколирования</label>
              <select value={hearingForm.recordingMode} onChange={(e) => setHearingForm({ ...hearingForm, recordingMode: e.target.value })}>
                <option value="WRITTEN_PROTOCOL_WITH_AV">Письменный протокол + А/В</option>
                <option value="AV_WITH_SHORT_PROTOCOL">А/В + краткий протокол</option>
                <option value="DIGITAL_AV_IS_PROTOCOL">А/В как протокол</option>
              </select>
              <input value={hearingForm.presidingJudgeName} onChange={(e) => setHearingForm({ ...hearingForm, presidingJudgeName: e.target.value })} placeholder="Председательствующий судья" />
              <input value={hearingForm.secretaryName} onChange={(e) => setHearingForm({ ...hearingForm, secretaryName: e.target.value })} placeholder="Секретарь" />
              <input value={hearingForm.location} onChange={(e) => setHearingForm({ ...hearingForm, location: e.target.value })} placeholder="Зал заседания" />
              <button disabled={busy || !selectedCaseId} onClick={() => void createHearing()}>Создать заседание</button>
            </div>
          )}

          {activeTab === 'recordings' && (
            <div className="panel">
              <h3>Аудиозапись заседания</h3>
              <label>Дело</label>
              <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
                <option value="">Выберите дело</option>
                {cases.map((item) => <option key={item.id} value={item.id}>{item.caseNumber}</option>)}
              </select>
              <label>Заседание</label>
              <select value={selectedHearingId} onChange={(e) => setSelectedHearingId(e.target.value)}>
                <option value="">Выберите заседание</option>
                {hearings.map((item) => <option key={item.id} value={item.id}>{new Date(item.scheduledAt).toLocaleString()} — {item.id.slice(0, 8)}</option>)}
              </select>
              <label>Файл аудиозаписи</label>
              <input type="file" accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.webm,.flac" onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} />
              <button disabled={busy || !selectedHearingId || !audioFile} onClick={() => void uploadRecording()}>Загрузить аудио</button>
              <hr />
              <label>Запись для распознавания</label>
              <select value={selectedRecordingId} onChange={(e) => setSelectedRecordingId(e.target.value)}>
                <option value="">Выберите запись</option>
                {recordings.map((item) => <option key={item.id} value={item.id}>{item.originalName}</option>)}
              </select>
              <select value={language} onChange={(e) => setLanguage(e.target.value as 'ky' | 'ru')}>
                <option value="ky">Кыргызский</option><option value="ru">Русский</option>
              </select>
              <button disabled={busy || !selectedRecordingId} onClick={() => void transcribeRecording()}>Распознать и сохранить текст</button>
            </div>
          )}
        </aside>

        <main className="content-panel">
          {activeTab === 'cases' && (
            <section className="table-card">
              <h3>Судебные дела</h3>
              <table><thead><tr><th>Номер</th><th>Название</th><th>Код</th><th>Статус</th></tr></thead>
                <tbody>{cases.map((item) => (
                  <tr key={item.id} onClick={() => setSelectedCaseId(item.id)} className={selectedCase?.id === item.id ? 'selected' : ''}>
                    <td>{item.caseNumber}</td><td>{item.title}</td><td>{item.proceedingCode}</td><td><span className="badge">{item.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
              {!cases.length && <p>Дел пока нет.</p>}
            </section>
          )}
          {activeTab === 'hearings' && (
            <section className="table-card">
              <h3>Заседания {selectedCase ? `— ${selectedCase.caseNumber}` : ''}</h3>
              <table><thead><tr><th>Дата</th><th>Режим</th><th>Судья</th><th>Статус</th></tr></thead>
                <tbody>{hearings.map((item) => (
                  <tr key={item.id}><td>{new Date(item.scheduledAt).toLocaleString()}</td><td>{item.recordingMode}</td><td>{item.presidingJudgeName || '—'}</td><td><span className="badge">{item.status}</span></td></tr>
                ))}</tbody>
              </table>
              {!hearings.length && <p>Для выбранного дела нет заседаний.</p>}
            </section>
          )}
          {activeTab === 'recordings' && (
            <section className="table-card">
              <h3>Аудиозаписи</h3>
              <table><thead><tr><th>Файл</th><th>Тип</th><th>Статус</th><th>Размер</th></tr></thead>
                <tbody>{recordings.map((item) => (
                  <tr key={item.id}><td>{item.originalName}</td><td>{item.mimeType}</td><td><span className="badge">{item.status}</span></td><td>{(Number(item.sizeBytes) / 1024 / 1024).toFixed(1)} MB</td></tr>
                ))}</tbody>
              </table>
              {!recordings.length && <p>Для выбранного заседания аудиозаписей нет.</p>}
              <p>После распознавания текстовые фрагменты сохраняются в таблицу TranscriptSegment. Интерфейс редактора протокола и DOCX-экспорт требуют отдельного шага реализации.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

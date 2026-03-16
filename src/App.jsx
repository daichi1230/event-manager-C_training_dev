import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEYS = {
  events: 'event-manager-c-events',
  session: 'event-manager-c-session',
  logs: 'event-manager-c-audit-logs'
};

const DEMO_USERS = [
  {
    id: 'admin-001',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: '管理者 佐藤'
  },
  {
    id: 'user-001',
    username: 'user1',
    password: 'user123',
    role: 'user',
    displayName: '一般ユーザー 田中'
  },
  {
    id: 'user-002',
    username: 'user2',
    password: 'user123',
    role: 'user',
    displayName: '一般ユーザー 鈴木'
  }
];

const ACTION_LABELS = {
  LOGIN: 'ログイン',
  LOGOUT: 'ログアウト',
  CREATE_EVENT: 'イベント作成',
  UPDATE_EVENT: 'イベント更新',
  DELETE_EVENT: 'イベント削除',
  JOIN_EVENT: 'イベント参加',
  CANCEL_EVENT: '参加キャンセル',
  BLOCKED_DUPLICATE_JOIN: '重複参加防止',
  BLOCKED_FULL_EVENT: '定員超過防止',
  RESET_DATA: 'データリセット'
};

const TAB_OPTIONS = [
  { value: 'events', label: 'イベント一覧' },
  { value: 'my-events', label: 'マイイベント', role: 'user' },
  { value: 'admin-dashboard', label: '管理ダッシュボード', role: 'admin' },
  { value: 'audit-log', label: '監査ログ', role: 'admin' }
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'upcoming', label: '開催予定' },
  { value: 'available', label: '参加可能' },
  { value: 'full', label: '満員' }
];

const EMPTY_FORM = {
  id: null,
  title: '',
  description: '',
  venue: '',
  date: '',
  capacity: '10',
  category: '勉強会'
};

const EMPTY_LOG_FILTER = {
  query: '',
  action: 'all'
};

const SEED_EVENTS = [
  {
    id: 'event-2001',
    title: '会計プロダクト全体像セミナー',
    description: 'プロダクトのモジュール構成、顧客業務、画面遷移の全体像を整理する研修イベントです。',
    venue: '会議室A',
    date: futureDate(4),
    capacity: 12,
    category: '研修',
    createdBy: 'admin-001',
    participants: ['user-001']
  },
  {
    id: 'event-2002',
    title: '設計レビュー会',
    description: 'イベント管理サイトの設計方針とロール制御をレビューします。',
    venue: 'オンライン',
    date: futureDate(9),
    capacity: 6,
    category: 'レビュー',
    createdBy: 'admin-001',
    participants: ['user-002']
  },
  {
    id: 'event-2003',
    title: '歓迎ランチ',
    description: '研修メンバーの交流を目的としたランチイベントです。',
    venue: '社内ラウンジ',
    date: futureDate(2),
    capacity: 8,
    category: '交流',
    createdBy: 'admin-001',
    participants: []
  }
];

const SEED_LOGS = [
  createLog({ actorId: 'system', actorName: 'System', action: 'CREATE_EVENT', targetName: '初期データ投入', detail: 'デモイベントを初期化しました。' })
];

function futureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(18, 30, 0, 0);
  return date.toISOString().slice(0, 16);
}

function createLog({ actorId, actorName, action, targetName, detail }) {
  return {
    id: `log-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    actorId,
    actorName,
    action,
    targetName,
    detail
  };
}

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.events);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(SEED_EVENTS));
      return SEED_EVENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_EVENTS;
  } catch {
    return SEED_EVENTS;
  }
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events));
}

function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.logs);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(SEED_LOGS));
      return SEED_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_LOGS;
  } catch {
    return SEED_LOGS;
  }
}

function saveLogs(logs) {
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.session);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function isUpcoming(value) {
  return new Date(value).getTime() >= Date.now();
}

function statusOf(event) {
  if (event.participants.length >= event.capacity) {
    return 'full';
  }
  if (isUpcoming(event.date)) {
    return 'upcoming';
  }
  return 'closed';
}

function csvEscape(value) {
  const normalized = String(value ?? '');
  return `"${normalized.replaceAll('"', '""')}"`;
}

export default function App() {
  const [events, setEvents] = useState(() => loadEvents());
  const [logs, setLogs] = useState(() => loadLogs());
  const [currentUser, setCurrentUser] = useState(() => loadSession());
  const [activeTab, setActiveTab] = useState('events');
  const [selectedEventId, setSelectedEventId] = useState(() => loadEvents()[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [logFilter, setLogFilter] = useState(EMPTY_LOG_FILTER);

  useEffect(() => {
    saveEvents(events);
    if (!events.find((event) => event.id === selectedEventId)) {
      setSelectedEventId(events[0]?.id ?? null);
    }
  }, [events, selectedEventId]);

  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveSession(currentUser);
  }, [currentUser]);

  const appendLog = ({ actor = currentUser, action, targetName, detail }) => {
    const actorName = actor?.displayName ?? 'System';
    const actorId = actor?.id ?? 'system';
    setLogs((prev) => [createLog({ actorId, actorName, action, targetName, detail }), ...prev]);
  };

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const text = `${event.title} ${event.description} ${event.venue} ${event.category}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const status = statusOf(event);
      const matchesFilter =
        filter === 'all' ||
        filter === status ||
        (filter === 'available' && isUpcoming(event.date) && status !== 'full');
      return matchesQuery && matchesFilter;
    });
  }, [events, filter, query]);

  const myEvents = useMemo(() => {
    if (!currentUser) {
      return [];
    }
    return events.filter((event) => event.participants.includes(currentUser.id));
  }, [currentUser, events]);

  const dashboard = useMemo(() => {
    const totalEvents = events.length;
    const upcomingEvents = events.filter((event) => isUpcoming(event.date)).length;
    const fullEvents = events.filter((event) => event.participants.length >= event.capacity).length;
    const registrations = events.reduce((sum, event) => sum + event.participants.length, 0);
    const fillRate = totalEvents === 0
      ? 0
      : Math.round(
          (events.reduce((sum, event) => sum + event.participants.length / event.capacity, 0) / totalEvents) * 100
        );
    const categoryMap = events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] ?? 0) + 1;
      return acc;
    }, {});

    return {
      totalEvents,
      upcomingEvents,
      fullEvents,
      registrations,
      fillRate,
      categoryRows: Object.entries(categoryMap)
    };
  }, [events]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const text = `${log.actorName} ${ACTION_LABELS[log.action] ?? log.action} ${log.targetName} ${log.detail}`.toLowerCase();
      const matchesQuery = text.includes(logFilter.query.toLowerCase());
      const matchesAction = logFilter.action === 'all' || log.action === logFilter.action;
      return matchesQuery && matchesAction;
    });
  }, [logs, logFilter]);

  const visibleTabs = TAB_OPTIONS.filter((tab) => !tab.role || tab.role === currentUser?.role);

  const showMessage = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2600);
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const match = DEMO_USERS.find(
      (user) => user.username === loginForm.username.trim() && user.password === loginForm.password.trim()
    );

    if (!match) {
      setLoginError('ユーザー名またはパスワードが正しくありません。');
      return;
    }

    setCurrentUser(match);
    setLoginError('');
    setLoginForm({ username: '', password: '' });
    setActiveTab(match.role === 'admin' ? 'admin-dashboard' : 'events');
    appendLog({ actor: match, action: 'LOGIN', targetName: match.displayName, detail: `${match.role} としてログインしました。` });
    showMessage(`${match.displayName} としてログインしました。`);
  };

  const handleLogout = () => {
    appendLog({ action: 'LOGOUT', targetName: currentUser?.displayName ?? 'ゲスト', detail: 'ログアウトしました。' });
    setCurrentUser(null);
    setActiveTab('events');
    resetForm();
    showMessage('ログアウトしました。');
  };

  const handleJoin = (eventId) => {
    if (!currentUser || currentUser.role !== 'user') {
      showMessage('参加登録は一般ユーザーでログインすると利用できます。');
      return;
    }

    const currentEvent = events.find((event) => event.id === eventId);
    if (!currentEvent) {
      return;
    }

    if (currentEvent.participants.includes(currentUser.id)) {
      appendLog({ action: 'BLOCKED_DUPLICATE_JOIN', targetName: currentEvent.title, detail: '重複参加を防止しました。' });
      showMessage('すでに参加済みです。');
      return;
    }

    if (currentEvent.participants.length >= currentEvent.capacity) {
      appendLog({ action: 'BLOCKED_FULL_EVENT', targetName: currentEvent.title, detail: '定員超過のため参加をブロックしました。' });
      showMessage('このイベントは満員です。');
      return;
    }

    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? { ...event, participants: [...event.participants, currentUser.id] }
          : event
      )
    );
    appendLog({ action: 'JOIN_EVENT', targetName: currentEvent.title, detail: `${currentUser.displayName} が参加しました。` });
    showMessage('イベントに参加しました。');
  };

  const handleCancel = (eventId) => {
    if (!currentUser) {
      return;
    }

    const currentEvent = events.find((event) => event.id === eventId);
    if (!currentEvent) {
      return;
    }

    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? { ...event, participants: event.participants.filter((id) => id !== currentUser.id) }
          : event
      )
    );
    appendLog({ action: 'CANCEL_EVENT', targetName: currentEvent.title, detail: `${currentUser.displayName} が参加をキャンセルしました。` });
    showMessage('参加をキャンセルしました。');
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.title.trim()) {
      nextErrors.title = 'タイトルは必須です。';
    }
    if (!formData.description.trim()) {
      nextErrors.description = '概要は必須です。';
    }
    if (!formData.venue.trim()) {
      nextErrors.venue = '会場は必須です。';
    }
    if (!formData.date) {
      nextErrors.date = '開催日時は必須です。';
    } else if (new Date(formData.date).getTime() <= Date.now()) {
      nextErrors.date = '開催日時は未来日時を指定してください。';
    }
    const capacity = Number(formData.capacity);
    if (!Number.isInteger(capacity) || capacity < 1) {
      nextErrors.capacity = '定員は1以上の整数にしてください。';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveEvent = (event) => {
    event.preventDefault();

    if (currentUser?.role !== 'admin') {
      showMessage('この操作は管理者のみ実行できます。');
      return;
    }

    if (!validateForm()) {
      return;
    }

    const payload = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      venue: formData.venue.trim(),
      capacity: Number(formData.capacity)
    };

    if (payload.id) {
      const before = events.find((item) => item.id === payload.id);
      const nextEvents = events.map((item) =>
        item.id === payload.id
          ? {
              ...item,
              ...payload,
              participants: item.participants.slice(0, payload.capacity)
            }
          : item
      );
      setEvents(nextEvents);
      setSelectedEventId(payload.id);
      appendLog({ action: 'UPDATE_EVENT', targetName: payload.title, detail: `イベントを更新しました。変更前タイトル: ${before?.title ?? '-'}。` });
      showMessage('イベントを更新しました。');
    } else {
      const newEvent = {
        ...payload,
        id: `event-${Date.now()}`,
        createdBy: currentUser.id,
        participants: []
      };
      setEvents((prev) => [newEvent, ...prev]);
      setSelectedEventId(newEvent.id);
      appendLog({ action: 'CREATE_EVENT', targetName: newEvent.title, detail: '新しいイベントを作成しました。' });
      showMessage('イベントを作成しました。');
    }

    resetForm();
  };

  const handleEdit = (eventItem) => {
    if (currentUser?.role !== 'admin') {
      return;
    }

    setFormData({
      id: eventItem.id,
      title: eventItem.title,
      description: eventItem.description,
      venue: eventItem.venue,
      date: eventItem.date,
      capacity: String(eventItem.capacity),
      category: eventItem.category
    });
    setActiveTab('admin-dashboard');
  };

  const handleDelete = (eventId) => {
    if (currentUser?.role !== 'admin') {
      return;
    }

    const target = events.find((event) => event.id === eventId);
    if (!target) {
      return;
    }

    const ok = window.confirm(`「${target.title}」を削除しますか？`);
    if (!ok) {
      return;
    }

    setEvents((prev) => prev.filter((event) => event.id !== eventId));
    appendLog({ action: 'DELETE_EVENT', targetName: target.title, detail: 'イベントを削除しました。' });
    resetForm();
    showMessage('イベントを削除しました。');
  };

  const exportLogs = () => {
    const header = ['日時', '操作者', '操作', '対象', '詳細'];
    const rows = filteredLogs.map((log) => [
      formatDate(log.createdAt),
      log.actorName,
      ACTION_LABELS[log.action] ?? log.action,
      log.targetName,
      log.detail
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetAllData = () => {
    if (currentUser?.role !== 'admin') {
      return;
    }
    const ok = window.confirm('イベントと監査ログを初期状態に戻しますか？');
    if (!ok) {
      return;
    }

    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(SEED_EVENTS));
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(SEED_LOGS));
    setEvents(SEED_EVENTS);
    setLogs([createLog({ actorId: currentUser.id, actorName: currentUser.displayName, action: 'RESET_DATA', targetName: 'イベント管理サイト', detail: 'データを初期状態に戻しました。' }), ...SEED_LOGS]);
    setSelectedEventId(SEED_EVENTS[0]?.id ?? null);
    resetForm();
    showMessage('データを初期状態に戻しました。');
  };

  return (
    <div className="app-shell">
      <header className="hero card">
        <div>
          <p className="eyebrow">C向けイベント管理サイト</p>
          <h1>ロール制御、監査ログ、ダッシュボード付きの研修用サンプル</h1>
          <p className="hero-text">
            React + Vite で構築した、やや実務寄りのイベント管理サイトです。管理者はイベントの作成・更新・削除と監査ログ確認、一般ユーザーは参加とマイイベント確認ができます。
          </p>
          <div className="guard-grid">
            <div className="guard-card">
              <strong>重複参加防止</strong>
              <span>同じユーザーが同一イベントへ二重参加できないように制御します。</span>
            </div>
            <div className="guard-card">
              <strong>定員超過防止</strong>
              <span>定員到達時は参加を拒否し、その事実を監査ログへ記録します。</span>
            </div>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <span>総イベント数</span>
            <strong>{dashboard.totalEvents}</strong>
          </div>
          <div className="stat-card">
            <span>総参加登録数</span>
            <strong>{dashboard.registrations}</strong>
          </div>
          <div className="stat-card">
            <span>平均充足率</span>
            <strong>{dashboard.fillRate}%</strong>
          </div>
        </div>
      </header>

      {message ? <div className="toast">{message}</div> : null}

      <section className="grid layout-top">
        <article className="card login-card">
          <div className="section-heading">
            <h2>ログイン</h2>
            <span className={`role-chip ${currentUser?.role ?? 'guest'}`}>
              {currentUser ? `${currentUser.displayName} / ${currentUser.role}` : '未ログイン'}
            </span>
          </div>
          {!currentUser ? (
            <>
              <form className="stack-form" onSubmit={handleLogin}>
                <label>
                  ユーザー名
                  <input
                    value={loginForm.username}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
                    placeholder="admin"
                  />
                </label>
                <label>
                  パスワード
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="admin123"
                  />
                </label>
                {loginError ? <p className="error-text">{loginError}</p> : null}
                <button className="primary-btn" type="submit">ログイン</button>
              </form>
              <div className="demo-box">
                <p className="demo-title">デモアカウント</p>
                <ul>
                  <li>管理者: admin / admin123</li>
                  <li>一般: user1 / user123</li>
                  <li>一般: user2 / user123</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="login-state">
              <p><strong>{currentUser.displayName}</strong> としてログイン中です。</p>
              <p className="muted">管理者はイベント管理と監査ログ確認が可能です。一般ユーザーは参加登録とマイイベント確認ができます。</p>
              <button className="secondary-btn" onClick={handleLogout}>ログアウト</button>
            </div>
          )}
        </article>

        <article className="card filters-card">
          <div className="section-heading">
            <h2>検索と表示制御</h2>
            <span className="muted">イベントの絞り込み</span>
          </div>
          <div className="filters-grid">
            <label>
              キーワード
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="タイトル、会場、カテゴリで検索" />
            </label>
            <label>
              状態フィルター
              <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                {FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="tab-row">
            {visibleTabs.map((tab) => (
              <button
                key={tab.value}
                className={`tab ${activeTab === tab.value ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="grid main-grid">
        <article className="card left-pane">
          <div className="section-heading">
            <h2>{activeTab === 'my-events' ? 'マイイベント' : activeTab === 'audit-log' ? '監査ログ' : activeTab === 'admin-dashboard' ? '管理ダッシュボード' : 'イベント一覧'}</h2>
            <span className="muted">
              {activeTab === 'events' ? `${filteredEvents.length}件表示中` : ''}
            </span>
          </div>

          {activeTab === 'events' ? (
            <div className="event-list">
              {filteredEvents.map((event) => {
                const joined = Boolean(currentUser && event.participants.includes(currentUser.id));
                const status = statusOf(event);
                return (
                  <button
                    key={event.id}
                    className={`event-card ${selectedEventId === event.id ? 'selected' : ''}`}
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <div className="event-card-top">
                      <span className="category-chip">{event.category}</span>
                      <span className={`status-pill ${status}`}>{status === 'full' ? '満員' : status === 'upcoming' ? '開催予定' : '終了'}</span>
                    </div>
                    <h3>{event.title}</h3>
                    <p>{event.description}</p>
                    <dl className="meta-grid">
                      <div>
                        <dt>日時</dt>
                        <dd>{formatDate(event.date)}</dd>
                      </div>
                      <div>
                        <dt>会場</dt>
                        <dd>{event.venue}</dd>
                      </div>
                      <div>
                        <dt>定員</dt>
                        <dd>{event.participants.length} / {event.capacity}</dd>
                      </div>
                      <div>
                        <dt>あなたの状態</dt>
                        <dd>{joined ? '参加中' : '未参加'}</dd>
                      </div>
                    </dl>
                  </button>
                );
              })}
              {filteredEvents.length === 0 ? <p className="empty-state">条件に一致するイベントはありません。</p> : null}
            </div>
          ) : null}

          {activeTab === 'my-events' ? (
            <div className="event-list compact-list">
              {myEvents.map((event) => (
                <div className="list-row" key={event.id}>
                  <div>
                    <strong>{event.title}</strong>
                    <p className="muted">{formatDate(event.date)} / {event.venue}</p>
                  </div>
                  <button className="secondary-btn small" onClick={() => handleCancel(event.id)}>キャンセル</button>
                </div>
              ))}
              {myEvents.length === 0 ? <p className="empty-state">参加中のイベントはありません。</p> : null}
            </div>
          ) : null}

          {activeTab === 'admin-dashboard' ? (
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <span>開催予定</span>
                <strong>{dashboard.upcomingEvents}</strong>
              </div>
              <div className="dashboard-card">
                <span>満員イベント</span>
                <strong>{dashboard.fullEvents}</strong>
              </div>
              <div className="dashboard-card">
                <span>総登録数</span>
                <strong>{dashboard.registrations}</strong>
              </div>
              <div className="dashboard-card">
                <span>平均充足率</span>
                <strong>{dashboard.fillRate}%</strong>
              </div>
              <div className="dashboard-wide card-tone">
                <h3>カテゴリ別イベント数</h3>
                <div className="category-stats">
                  {dashboard.categoryRows.map(([category, count]) => (
                    <div className="category-row" key={category}>
                      <span>{category}</span>
                      <strong>{count}件</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="dashboard-wide card-tone">
                <div className="section-heading">
                  <h3>イベント管理</h3>
                  <button className="secondary-btn small" onClick={resetAllData}>データ初期化</button>
                </div>
                <div className="admin-list">
                  {events.map((event) => (
                    <div className="list-row" key={event.id}>
                      <div>
                        <strong>{event.title}</strong>
                        <p className="muted">{formatDate(event.date)} / 参加 {event.participants.length} / {event.capacity}</p>
                      </div>
                      <div className="action-row">
                        <button className="secondary-btn small" onClick={() => handleEdit(event)}>編集</button>
                        <button className="danger-btn small" onClick={() => handleDelete(event.id)}>削除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'audit-log' ? (
            <div className="audit-section">
              <div className="filters-grid audit-filters">
                <label>
                  キーワード
                  <input
                    value={logFilter.query}
                    onChange={(event) => setLogFilter((prev) => ({ ...prev, query: event.target.value }))}
                    placeholder="操作者、対象、詳細で検索"
                  />
                </label>
                <label>
                  操作種別
                  <select
                    value={logFilter.action}
                    onChange={(event) => setLogFilter((prev) => ({ ...prev, action: event.target.value }))}
                  >
                    <option value="all">すべて</option>
                    {Object.entries(ACTION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="section-heading inline-actions">
                <h3>監査ログ一覧</h3>
                <button className="secondary-btn small" onClick={exportLogs}>CSVエクスポート</button>
              </div>
              <div className="audit-list">
                {filteredLogs.map((log) => (
                  <article className="audit-item" key={log.id}>
                    <div className="audit-head">
                      <strong>{ACTION_LABELS[log.action] ?? log.action}</strong>
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="audit-meta">操作者: {log.actorName}</p>
                    <p className="audit-meta">対象: {log.targetName}</p>
                    <p>{log.detail}</p>
                  </article>
                ))}
                {filteredLogs.length === 0 ? <p className="empty-state">条件に一致する監査ログはありません。</p> : null}
              </div>
            </div>
          ) : null}
        </article>

        <aside className="card right-pane">
          {activeTab === 'admin-dashboard' && currentUser?.role === 'admin' ? (
            <>
              <div className="section-heading">
                <h2>{formData.id ? 'イベント編集' : '新規イベント作成'}</h2>
                {formData.id ? <button className="secondary-btn small" onClick={resetForm}>新規作成に切り替え</button> : null}
              </div>
              <form className="stack-form" onSubmit={handleSaveEvent}>
                <label>
                  タイトル
                  <input value={formData.title} onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))} />
                  {formErrors.title ? <span className="error-text">{formErrors.title}</span> : null}
                </label>
                <label>
                  概要
                  <textarea rows="4" value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} />
                  {formErrors.description ? <span className="error-text">{formErrors.description}</span> : null}
                </label>
                <label>
                  会場
                  <input value={formData.venue} onChange={(event) => setFormData((prev) => ({ ...prev, venue: event.target.value }))} />
                  {formErrors.venue ? <span className="error-text">{formErrors.venue}</span> : null}
                </label>
                <label>
                  開催日時
                  <input type="datetime-local" value={formData.date} onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))} />
                  {formErrors.date ? <span className="error-text">{formErrors.date}</span> : null}
                </label>
                <div className="filters-grid">
                  <label>
                    定員
                    <input type="number" min="1" value={formData.capacity} onChange={(event) => setFormData((prev) => ({ ...prev, capacity: event.target.value }))} />
                    {formErrors.capacity ? <span className="error-text">{formErrors.capacity}</span> : null}
                  </label>
                  <label>
                    カテゴリ
                    <select value={formData.category} onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}>
                      <option value="研修">研修</option>
                      <option value="レビュー">レビュー</option>
                      <option value="交流">交流</option>
                      <option value="勉強会">勉強会</option>
                    </select>
                  </label>
                </div>
                <button className="primary-btn" type="submit">{formData.id ? '更新する' : '作成する'}</button>
              </form>
            </>
          ) : (
            <>
              <div className="section-heading">
                <h2>イベント詳細</h2>
                <span className={`status-pill ${selectedEvent ? statusOf(selectedEvent) : 'closed'}`}>
                  {selectedEvent ? (statusOf(selectedEvent) === 'full' ? '満員' : statusOf(selectedEvent) === 'upcoming' ? '開催予定' : '終了') : '未選択'}
                </span>
              </div>
              {selectedEvent ? (
                <div className="detail-box">
                  <span className="category-chip">{selectedEvent.category}</span>
                  <h3>{selectedEvent.title}</h3>
                  <p>{selectedEvent.description}</p>
                  <dl className="meta-grid stacked">
                    <div>
                      <dt>日時</dt>
                      <dd>{formatDate(selectedEvent.date)}</dd>
                    </div>
                    <div>
                      <dt>会場</dt>
                      <dd>{selectedEvent.venue}</dd>
                    </div>
                    <div>
                      <dt>定員</dt>
                      <dd>{selectedEvent.participants.length} / {selectedEvent.capacity}</dd>
                    </div>
                  </dl>
                  <div className="participant-list">
                    <h4>参加者</h4>
                    <ul>
                      {selectedEvent.participants.map((participantId) => {
                        const participant = DEMO_USERS.find((user) => user.id === participantId);
                        return <li key={participantId}>{participant?.displayName ?? participantId}</li>;
                      })}
                      {selectedEvent.participants.length === 0 ? <li>まだ参加者はいません。</li> : null}
                    </ul>
                  </div>
                  <div className="action-row">
                    {currentUser?.role === 'user' && !selectedEvent.participants.includes(currentUser.id) ? (
                      <button className="primary-btn" onClick={() => handleJoin(selectedEvent.id)}>参加する</button>
                    ) : null}
                    {currentUser?.role === 'user' && selectedEvent.participants.includes(currentUser.id) ? (
                      <button className="secondary-btn" onClick={() => handleCancel(selectedEvent.id)}>参加をキャンセル</button>
                    ) : null}
                    {currentUser?.role === 'admin' ? (
                      <button className="secondary-btn" onClick={() => handleEdit(selectedEvent)}>編集画面へ</button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="empty-state">イベントを選択してください。</p>
              )}
            </>
          )}
        </aside>
      </section>
    </div>
  );
}

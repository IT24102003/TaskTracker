import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Kanban, 
  List, 
  Moon, 
  Sun, 
  Trash2, 
  Edit3, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Layers,
  Database,
  ArrowRight,
  X
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api/tasks';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(true);
  
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  // View mode: 'kanban' | 'list'
  const [viewMode, setViewMode] = useState('kanban');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null for create, object for edit
  const [formData, setFormData] = useState({ title: '', assignee: '', priority: 'Medium', status: 'ToDo', dueDate: '' });
  const [formError, setFormError] = useState('');

  // Toast Notification State
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        setApiConnected(true);
      } else {
        setApiConnected(false);
        showToast('Failed to connect to database API', 'error');
      }
    } catch (err) {
      console.warn('API error:', err);
      setApiConnected(false);
      showToast('Backend API unavailable. Ensure server is running on port 5000.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const openCreateModal = () => {
    setEditingTask(null);
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 1);
    const dateStr = defaultDate.toISOString().split('T')[0];
    
    setFormData({ title: '', assignee: '', priority: 'Medium', status: 'ToDo', dueDate: dateStr });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    const formattedDate = task.dueDate ? task.dueDate.split('T')[0] : '';
    setFormData({
      title: task.title,
      assignee: task.assignee,
      priority: task.priority,
      status: task.status,
      dueDate: formattedDate
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return setFormError('Task title is required.');
    if (!formData.assignee.trim()) return setFormError('Assignee name is required.');
    if (!formData.dueDate) return setFormError('Due date is required.');

    const formattedDueDate = new Date(formData.dueDate + 'T00:00:00Z').toISOString();

    const payload = {
      title: formData.title.trim(),
      assignee: formData.assignee.trim(),
      priority: formData.priority,
      status: formData.status,
      dueDate: formattedDueDate
    };

    if (editingTask) {
      // EDIT TASK
      try {
        const res = await fetch(`${API_URL}/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingTask.id })
        });
        if (res.ok) {
          showToast('Task updated in database!');
          setIsModalOpen(false);
          await fetchTasks();
        } else {
          const errData = await res.json();
          setFormError('Update failed: ' + (typeof errData === 'string' ? errData : JSON.stringify(errData)));
        }
      } catch (err) {
        setFormError('Network error updating task in database.');
      }
    } else {
      // CREATE TASK
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast('Task saved to PostgreSQL database!');
          setIsModalOpen(false);
          await fetchTasks();
        } else {
          const errData = await res.json();
          setFormError('Create failed: ' + (typeof errData === 'string' ? errData : JSON.stringify(errData)));
        }
      } catch (err) {
        setFormError('Network error connecting to database API.');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const prevTasks = [...tasks];
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatus)
      });
      if (!res.ok) {
        setTasks(prevTasks);
        showToast('Failed to update status on server', 'error');
      } else {
        showToast(`Task status changed to ${newStatus}`);
      }
    } catch (err) {
      setTasks(prevTasks);
      showToast('Network error updating status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task from the database?')) return;
    
    const prevTasks = [...tasks];
    setTasks(tasks.filter(t => t.id !== id));

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setTasks(prevTasks);
        showToast('Failed to delete task from database', 'error');
      } else {
        showToast('Task deleted from database');
      }
    } catch (err) {
      setTasks(prevTasks);
      showToast('Network error deleting task', 'error');
    }
  };

  // Filter tasks
  const assignees = ['All', ...new Set(tasks.map(t => t.assignee).filter(Boolean))];

  const filteredTasks = tasks
    .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.assignee.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(t => statusFilter === 'All' || t.status === statusFilter)
    .filter(t => assigneeFilter === 'All' || t.assignee === assigneeFilter)
    .filter(t => priorityFilter === 'All' || t.priority === priorityFilter)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Stats calculation
  const totalCount = tasks.length;
  const todoCount = tasks.filter(t => t.status === 'ToDo' || t.status === 'To Do').length;
  const inProgCount = tasks.filter(t => t.status === 'InProgress' || t.status === 'In Progress').length;
  const doneCount = tasks.filter(t => t.status === 'Done').length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const getPriorityBadgeClass = (prio) => {
    switch (prio) {
      case 'High': return 'badge-prio-high';
      case 'Medium': return 'badge-prio-med';
      case 'Low': return 'badge-prio-low';
      default: return 'badge-prio-med';
    }
  };

  const getStatusBadgeClass = (st) => {
    if (st === 'Done') return 'badge-done';
    if (st === 'InProgress' || st === 'In Progress') return 'badge-inprog';
    return 'badge-todo';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '0.85rem 1.4rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: 600,
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="glass-panel" style={{ padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
          }}>
            <CheckSquare size={26} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              TaskTracker <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '20px', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>Pro</span>
            </h1>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: apiConnected ? '#10b981' : '#ef4444', boxShadow: apiConnected ? '0 0 8px #10b981' : 'none' }}></span>
              {apiConnected ? 'PostgreSQL Database Connected' : 'Database Offline'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-icon" onClick={toggleTheme} title="Toggle Dark/Light Mode">
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={19} />
            <span>New Task</span>
          </button>
        </div>
      </header>

      {/* METRIC DASHBOARD CARDS */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        
        <div className="glass-panel glass-panel-hover" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Tasks</span>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '0.4rem', borderRadius: '10px' }}>
              <Layers size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{totalCount}</div>
          <div style={{ marginTop: '0.5rem', height: '6px', width: '100%', background: 'var(--bg-glass)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '100%', background: 'var(--accent-gradient)' }}></div>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>To Do</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '0.4rem', borderRadius: '10px' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fbbf24' }}>{todoCount}</div>
          <div style={{ marginTop: '0.5rem', height: '6px', width: '100%', background: 'var(--bg-glass)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: totalCount > 0 ? `${(todoCount / totalCount) * 100}%` : '0%', background: '#fbbf24' }}></div>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>In Progress</span>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '0.4rem', borderRadius: '10px' }}>
              <Database size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#60a5fa' }}>{inProgCount}</div>
          <div style={{ marginTop: '0.5rem', height: '6px', width: '100%', background: 'var(--bg-glass)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: totalCount > 0 ? `${(inProgCount / totalCount) * 100}%` : '0%', background: '#60a5fa' }}></div>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.4rem', borderRadius: '10px' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#34d399' }}>{doneCount}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>({progressPercent}%)</span>
          </div>
          <div style={{ marginTop: '0.5rem', height: '6px', width: '100%', background: 'var(--bg-glass)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPercent}%`, background: '#34d399' }}></div>
          </div>
        </div>

      </section>

      {/* FILTER & TOOLBAR SECTION */}
      <section className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              placeholder="Search by title or assignee..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="input-modern"
              style={{ paddingLeft: '2.4rem' }}
            />
            {searchQuery && (
              <X size={16} onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-dim)' }} />
            )}
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            {['All', 'ToDo', 'InProgress', 'Done'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? 'var(--accent-primary)' : 'transparent',
                  color: statusFilter === st ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {st === 'ToDo' ? 'To Do' : st === 'InProgress' ? 'In Progress' : st}
              </button>
            ))}
          </div>

          {/* Assignee & Priority Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} className="select-modern">
              <option value="All">All Assignees</option>
              {assignees.filter(a => a !== 'All').map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="select-modern">
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* View Switcher */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <button 
                onClick={() => setViewMode('kanban')} 
                title="Board View"
                style={{
                  background: viewMode === 'kanban' ? 'var(--bg-glass-hover)' : 'transparent',
                  color: viewMode === 'kanban' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <Kanban size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                title="Table View"
                style={{
                  background: viewMode === 'list' ? 'var(--bg-glass-hover)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <List size={18} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* MAIN TASK CONTENT AREA */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div className="animate-glow" style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading database tasks...</div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CheckSquare size={48} style={{ color: 'var(--text-dim)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No tasks found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
            No tasks match your current search and filter criteria.
          </p>
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Create New Task
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        
        /* KANBAN BOARD VIEW */
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* COL 1: TO DO */}
          <div className="glass-panel" style={{ padding: '1.25rem', minHeight: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }}></span>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>To Do</h3>
              </div>
              <span className="badge badge-todo">
                {filteredTasks.filter(t => t.status === 'ToDo' || t.status === 'To Do').length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredTasks.filter(t => t.status === 'ToDo' || t.status === 'To Do').map(task => (
                <TaskCard key={task.id} task={task} onEdit={openEditModal} onDelete={handleDelete} onStatusChange={handleStatusChange} getInitials={getInitials} getPriorityBadgeClass={getPriorityBadgeClass} />
              ))}
            </div>
          </div>

          {/* COL 2: IN PROGRESS */}
          <div className="glass-panel" style={{ padding: '1.25rem', minHeight: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#60a5fa' }}></span>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>In Progress</h3>
              </div>
              <span className="badge badge-inprog">
                {filteredTasks.filter(t => t.status === 'InProgress' || t.status === 'In Progress').length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredTasks.filter(t => t.status === 'InProgress' || t.status === 'In Progress').map(task => (
                <TaskCard key={task.id} task={task} onEdit={openEditModal} onDelete={handleDelete} onStatusChange={handleStatusChange} getInitials={getInitials} getPriorityBadgeClass={getPriorityBadgeClass} />
              ))}
            </div>
          </div>

          {/* COL 3: DONE */}
          <div className="glass-panel" style={{ padding: '1.25rem', minHeight: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399' }}></span>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Completed</h3>
              </div>
              <span className="badge badge-done">
                {filteredTasks.filter(t => t.status === 'Done').length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredTasks.filter(t => t.status === 'Done').map(task => (
                <TaskCard key={task.id} task={task} onEdit={openEditModal} onDelete={handleDelete} onStatusChange={handleStatusChange} getInitials={getInitials} getPriorityBadgeClass={getPriorityBadgeClass} />
              ))}
            </div>
          </div>

        </section>
      ) : (

        /* TABLE / LIST VIEW */
        <section className="glass-panel" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <table width="100%" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-glass)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <th style={{ paddingLeft: '1.75rem', paddingRight: '1rem', paddingTop: '1.1rem', paddingBottom: '1.1rem' }}>Task Title</th>
                <th style={{ padding: '1.1rem 1rem' }}>Assignee</th>
                <th style={{ padding: '1.1rem 1rem' }}>Priority</th>
                <th style={{ padding: '1.1rem 1rem' }}>Due Date</th>
                <th style={{ padding: '1.1rem 1rem' }}>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '1.75rem', paddingLeft: '1rem', paddingTop: '1.1rem', paddingBottom: '1.1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.93rem' }}>
                  <td style={{ fontWeight: 600, paddingLeft: '1.75rem', paddingRight: '1rem', paddingTop: '1.1rem', paddingBottom: '1.1rem' }}>{t.title}</td>
                  <td style={{ padding: '1.1rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-gradient)', color: '#ffffff', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getInitials(t.assignee)}
                      </div>
                      <span>{t.assignee}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1.1rem 1rem' }}>
                    <span className={`badge ${getPriorityBadgeClass(t.priority)}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', padding: '1.1rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={15} />
                      {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>
                  <td style={{ padding: '1.1rem 1rem' }}>
                    <select 
                      value={t.status === 'To Do' ? 'ToDo' : t.status === 'In Progress' ? 'InProgress' : t.status} 
                      onChange={e => handleStatusChange(t.id, e.target.value)}
                      className="select-modern"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
                    >
                      <option value="ToDo">To Do</option>
                      <option value="InProgress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '1.75rem', paddingLeft: '1rem', paddingTop: '1.1rem', paddingBottom: '1.1rem' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button className="btn-icon" onClick={() => openEditModal(t)} title="Edit Task">
                        <Edit3 size={15} />
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(t.id)} title="Delete Task" style={{ color: '#ef4444' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* CREATE / EDIT TASK MODAL DIALOG */}
      {isModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          boxSizing: 'border-box'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '2rem', background: 'var(--bg-secondary)', margin: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Task Title *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Implement PostgreSQL schema migration" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  className="input-modern"
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Assignee Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sarah Connor" 
                  value={formData.assignee} 
                  onChange={e => setFormData({ ...formData, assignee: e.target.value })} 
                  className="input-modern"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Priority</label>
                  <select 
                    value={formData.priority} 
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="select-modern"
                    style={{ width: '100%' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="select-modern"
                    style={{ width: '100%' }}
                  >
                    <option value="ToDo">To Do</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Due Date *</label>
                <input 
                  type="date" 
                  value={formData.dueDate} 
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })} 
                  className="input-modern"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

// INDIVIDUAL TASK CARD COMPONENT FOR KANBAN BOARD
function TaskCard({ task, onEdit, onDelete, onStatusChange, getInitials, getPriorityBadgeClass }) {
  const isDone = task.status === 'Done';
  
  return (
    <div className="glass-panel glass-panel-hover" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'var(--bg-secondary)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <h4 style={{ fontSize: '0.98rem', lineHeight: 1.4, margin: 0, textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.7 : 1 }}>
          {task.title}
        </h4>
        <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-gradient)', color: '#ffffff', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {getInitials(task.assignee)}
          </div>
          <span style={{ fontWeight: 500 }}>{task.assignee}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Calendar size={14} />
          <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.2rem' }}>
        <select 
          value={task.status === 'To Do' ? 'ToDo' : task.status === 'In Progress' ? 'InProgress' : task.status} 
          onChange={e => onStatusChange(task.id, e.target.value)}
          className="select-modern"
          style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
        >
          <option value="ToDo">To Do</option>
          <option value="InProgress">In Progress</option>
          <option value="Done">Done</option>
        </select>

        <div style={{ display: 'flex', gap: '0.3rem' }}>
          <button className="btn-icon" onClick={() => onEdit(task)} title="Edit Task" style={{ width: '30px', height: '30px' }}>
            <Edit3 size={14} />
          </button>
          <button className="btn-icon" onClick={() => onDelete(task.id)} title="Delete Task" style={{ width: '30px', height: '30px', color: '#ef4444' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

    </div>
  );
}
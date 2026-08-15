import React, { useState, useEffect } from 'react';

// Change 5000 to match your actual backend API port from terminal (e.g. 5039)
const API_URL = 'http://localhost:5000/api/tasks';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Form state
  const [formData, setFormData] = useState({ title: '', assignee: '', priority: 'Medium', dueDate: '' });
  const [formError, setFormError] = useState('');

  // Fetch tasks on initial render
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        localStorage.setItem('tasks', JSON.stringify(data));
      } else {
        fallbackToLocalStorage();
      }
    } catch (err) {
      console.warn('API unavailable, loading local cache:', err);
      fallbackToLocalStorage();
    }
  };

  const fallbackToLocalStorage = () => {
    const saved = localStorage.getItem('tasks');
    if (saved) setTasks(JSON.parse(saved));
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return setFormError('Task title is required.');
    if (!formData.assignee.trim()) return setFormError('Assignee name is required.');
    if (!formData.dueDate || formData.dueDate < todayStr) return setFormError('Due date cannot be in the past.');

    // Convert date string to ISO UTC format for PostgreSQL compatibility
    const formattedDueDate = new Date(formData.dueDate).toISOString();

    const payload = {
      title: formData.title.trim(),
      assignee: formData.assignee.trim(),
      priority: formData.priority,
      status: 'ToDo',
      dueDate: formattedDueDate
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchTasks();
      } else {
        const errData = await res.json();
        console.error('Server validation failed:', errData);
        // Local fallback update if backend throws error
        setTasks([...tasks, { ...payload, id: Date.now() }]);
      }
    } catch (err) {
      console.error('Network error saving task:', err);
      setTasks([...tasks, { ...payload, id: Date.now() }]);
    }

    setFormData({ title: '', assignee: '', priority: 'Medium', dueDate: '' });
    setFormError('');
    setView('list');
  };

  const handleStatusChange = async (id, newStatus) => {
    // Update state locally immediately for snappy UI
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));

    try {
      await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatus)
      });
    } catch (err) {
      console.error('Failed to sync status change with server:', err);
    }
  };

  const handleDelete = async (id) => {
    setTasks(tasks.filter(t => t.id !== id));

    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete task on server:', err);
    }
  };

  // Unique list of assignees for the filter dropdown
  const assignees = ['All', ...new Set(tasks.map(t => t.assignee).filter(Boolean))];

  // Filtering & Sorting
  const filteredTasks = tasks
    .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(t => statusFilter === 'All' || t.status === statusFilter)
    .filter(t => assigneeFilter === 'All' || t.assignee === assigneeFilter)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Summary counts
  const counts = {
    toDo: tasks.filter(t => t.status === 'ToDo' || t.status === 'To Do').length,
    inProgress: tasks.filter(t => t.status === 'InProgress' || t.status === 'In Progress').length,
    done: tasks.filter(t => t.status === 'Done').length,
  };

  return (
    <div style={{ maxWidth: '850px', margin: '2rem auto', fontFamily: 'system-ui, sans-serif', padding: '0 1rem' }}>
      <h1>Startup Task Tracker</h1>
      
      {/* View Switcher */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setView('list')} 
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: view === 'list' ? 'bold' : 'normal' }}
        >
          All Tasks
        </button>
        <button 
          onClick={() => setView('add')} 
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: view === 'add' ? 'bold' : 'normal' }}
        >
          + Add Task
        </button>
      </div>

      {/* Summary Banner */}
      <div style={{ background: '#f4f4f5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e4e4e7' }}>
        <strong>Summary:</strong> {counts.toDo} To Do | {counts.inProgress} In Progress | {counts.done} Done
      </div>

      {view === 'add' ? (
        <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', background: '#fafafa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eee' }}>
          <h3 style={{ margin: 0 }}>Add New Task</h3>
          {formError && <div style={{ color: 'red', fontSize: '0.9rem' }}>{formError}</div>}
          
          <input 
            type="text" 
            placeholder="Task Title *" 
            value={formData.title} 
            onChange={e => setFormData({ ...formData, title: e.target.value })} 
            style={{ padding: '0.5rem' }}
          />
          <input 
            type="text" 
            placeholder="Assignee Name *" 
            value={formData.assignee} 
            onChange={e => setFormData({ ...formData, assignee: e.target.value })} 
            style={{ padding: '0.5rem' }}
          />
          <select 
            value={formData.priority} 
            onChange={e => setFormData({ ...formData, priority: e.target.value })}
            style={{ padding: '0.5rem' }}
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>
          <input 
            type="date" 
            min={todayStr}
            value={formData.dueDate} 
            onChange={e => setFormData({ ...formData, dueDate: e.target.value })} 
            style={{ padding: '0.5rem' }}
          />
          <button type="submit" style={{ padding: '0.6rem', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Submit Task
          </button>
        </form>
      ) : (
        <>
          {/* Search and Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search by title..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              style={{ padding: '0.5rem', flex: 1, minWidth: '200px' }}
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.5rem' }}>
              <option value="All">All Statuses</option>
              <option value="ToDo">To Do</option>
              <option value="InProgress">In Progress</option>
              <option value="Done">Done</option>
            </select>
            <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} style={{ padding: '0.5rem' }}>
              {assignees.map(a => <option key={a} value={a}>{a === 'All' ? 'All Assignees' : a}</option>)}
            </select>
          </div>

          {/* Task Table */}
          <table width="100%" cellPadding="10" style={{ borderCollapse: 'collapse', textAlign: 'left', border: '1px solid #eee' }}>
            <thead>
              <tr style={{ background: '#f4f4f5', borderBottom: '2px solid #ddd' }}>
                <th>Title</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No tasks found.</td>
                </tr>
              ) : (
                filteredTasks.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ fontWeight: '500' }}>{t.title}</td>
                    <td>{t.assignee}</td>
                    <td>
                      <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.85rem',
                        background: t.priority === 'High' ? '#fee2e2' : t.priority === 'Medium' ? '#fef3c7' : '#e0f2fe',
                        color: t.priority === 'High' ? '#991b1b' : t.priority === 'Medium' ? '#92400e' : '#075985'
                      }}>
                        {t.priority}
                      </span>
                    </td>
                    <td>{new Date(t.dueDate).toLocaleDateString()}</td>
                    <td>
                      <select 
                        value={t.status} 
                        onChange={e => handleStatusChange(t.id, e.target.value)}
                        style={{ padding: '0.3rem' }}
                      >
                        <option value="ToDo">To Do</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleDelete(t.id)} 
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
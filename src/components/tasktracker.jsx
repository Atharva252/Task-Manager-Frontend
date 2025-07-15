"use client"
import React, { useState, useEffect } from 'react';
import {
  CheckSquare, Plus, Filter, Search, Moon, Sun, MoreHorizontal, 
  Clock, AlertCircle, CheckCircle2, Circle, Calendar, Target,
  Trash2, Edit3, X, Save
} from 'lucide-react';
import apiService from '../services/api';

const TaskManager = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all'
  });
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'work',
    dueDate: ''
  });

  const [tasks, setTasks] = useState([]);

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Load tasks from API
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTasks();
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'pending': return <Circle className="w-5 h-5 text-yellow-500" />;
      default: return <Circle className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedFilters.status === 'all' || task.status === selectedFilters.status;
    const matchesPriority = selectedFilters.priority === 'all' || task.priority === selectedFilters.priority;
    const matchesCategory = selectedFilters.category === 'all' || task.category === selectedFilters.category;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    return { total, completed, inProgress, pending };
  };

  const stats = getTaskStats();

  // Add new task
  const addTask = async () => {
    if (newTask.title.trim() === '') return;
    
    try {
      setLoading(true);
      const response = await apiService.createTask(newTask);
      
      // Add the new task to the local state
      setTasks([...tasks, response.task]);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        category: 'work',
        dueDate: ''
      });
      setShowAddTask(false);
      
      // Reload tasks to get updated stats
      loadTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      setLoading(true);
      await apiService.deleteTask(taskId);
      
      // Remove from local state
      setTasks(tasks.filter(task => task._id !== taskId));
      
      // Reload tasks to get updated stats
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle task completion
  const toggleTaskStatus = async (taskId) => {
    try {
      const task = tasks.find(t => t._id === taskId);
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      
      await apiService.updateTaskStatus(taskId, newStatus);
      
      // Update local state
      setTasks(tasks.map(task =>
        task._id === taskId
          ? { 
              ...task,
              status: newStatus,
              completed: newStatus === 'completed'
            }
          : task
      ));
      
      // Reload tasks to get updated stats
      loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status. Please try again.');
    }
  };

  // Update task priority
  const updateTaskPriority = async (taskId, newPriority) => {
    try {
      await apiService.updateTask(taskId, { priority: newPriority });
      
      // Update local state
      setTasks(tasks.map(task =>
        task._id === taskId ? { ...task, priority: newPriority } : task
      ));
    } catch (error) {
      console.error('Error updating task priority:', error);
      setError('Failed to update task priority. Please try again.');
    }
  };

  // Start editing task
  const startEditTask = (task) => {
    setEditingTask({ ...task });
  };

  // Save edited task
  const saveEditTask = async () => {
    try {
      setLoading(true);
      await apiService.updateTask(editingTask._id, editingTask);
      
      // Update local state
      setTasks(tasks.map(task =>
        task._id === editingTask._id ? editingTask : task
      ));
      setEditingTask(null);
      
      // Reload tasks to get updated stats
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingTask(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today && due.toDateString() !== today.toDateString();
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 backdrop-blur-md border-b ${
        darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TaskFlow
              </h1>
              <p className="text-xs text-gray-500">Manage your tasks efficiently</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-xl transition-all duration-200 ${
              darkMode ? 'hover:bg-gray-700 bg-gray-800' : 'hover:bg-gray-100 bg-gray-50'
            }`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Dashboard Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-4xl font-bold mb-2">Dashboard</h2>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Welcome back! Here's your task overview.
              </p>
            </div>
            <button 
              onClick={() => setShowAddTask(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add New Task</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
              darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:shadow-blue-100'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Tasks
                  </p>
                  <p className="text-3xl font-bold mt-2 text-blue-600">{stats.total}</p>
                </div>
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <CheckSquare className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
              darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:shadow-green-100'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Completed
                  </p>
                  <p className="text-3xl font-bold mt-2 text-green-600">{stats.completed}</p>
                </div>
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
              darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:shadow-yellow-100'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    In Progress
                  </p>
                  <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.inProgress}</p>
                </div>
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                  <Clock className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
              darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:shadow-purple-100'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Pending
                  </p>
                  <p className="text-3xl font-bold mt-2 text-purple-600">{stats.pending}</p>
                </div>
                <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Circle className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-200'
                }`}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-6 py-4 rounded-xl border transition-all ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className={`p-6 rounded-2xl border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Status</label>
                  <select
                    value={selectedFilters.status}
                    onChange={(e) => setSelectedFilters({...selectedFilters, status: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">Priority</label>
                  <select
                    value={selectedFilters.priority}
                    onChange={(e) => setSelectedFilters({...selectedFilters, priority: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">Category</label>
                  <select
                    value={selectedFilters.category}
                    onChange={(e) => setSelectedFilters({...selectedFilters, category: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <option value="all">All Categories</option>
                    <option value="work">Work</option>
                    <option value="design">Design</option>
                    <option value="meetings">Meetings</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Add Task Form - Inline */}
          {showAddTask && (
            <div className={`p-6 rounded-2xl border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Add New Task</h3>
                <button
                  onClick={() => setShowAddTask(false)}
                  className={`p-2 rounded-lg ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                    placeholder="Enter task title..."
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                    rows="3"
                    placeholder="Enter task description..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                  >
                    <option value="work">Work</option>
                    <option value="design">Design</option>
                    <option value="meetings">Meetings</option>
                    <option value="development">Development</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
                
                <div className="md:col-span-2 flex gap-3 pt-4">
                  <button
                    onClick={addTask}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Task</span>
                  </button>
                  <button
                    onClick={() => setShowAddTask(false)}
                    className={`px-6 py-3 rounded-xl border ${
                      darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Your Tasks</h3>
              <span className={`px-3 py-1 rounded-full text-sm ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                {filteredTasks.length} tasks
              </span>
            </div>
            
            {filteredTasks.length === 0 ? (
              <div className={`text-center py-16 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <CheckSquare className="w-20 h-20 mx-auto mb-6 opacity-50" />
                <p className="text-xl font-medium mb-2">No tasks found</p>
                <p className="text-sm">Try adjusting your filters or add a new task</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task._id || task.id}
                    className={`p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    {editingTask && (editingTask._id === task._id || editingTask.id === task.id) ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editingTask.title}
                          onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                          }`}
                        />
                        <textarea
                          value={editingTask.description}
                          onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                          }`}
                          rows="2"
                        />
                        <div className="flex gap-4">
                          <select
                            value={editingTask.priority}
                            onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                            className={`px-3 py-2 rounded-lg border ${
                              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                            }`}
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <input
                            type="date"
                            value={editingTask.dueDate}
                            onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                            className={`px-3 py-2 rounded-lg border ${
                              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                            }`}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditTask}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <button
                            onClick={() => toggleTaskStatus(task._id || task.id)}
                            className="mt-1 hover:scale-110 transition-transform"
                          >
                            {getStatusIcon(task.status)}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className={`text-lg font-semibold ${
                                task.completed ? 'line-through opacity-60' : ''
                              }`}>
                                {task.title}
                              </h3>
                              <select
                                value={task.priority}
                                onChange={(e) => updateTaskPriority(task._id || task.id, e.target.value)}
                                className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(task.priority)}`}
                              >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                              </select>
                            </div>
                            <p className={`mb-4 ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            } ${task.completed ? 'line-through opacity-60' : ''}`}>
                              {task.description}
                            </p>
                            <div className="flex items-center space-x-6 text-sm">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span className={isOverdue(task.dueDate) ? 'text-red-500 font-medium' : ''}>
                                  {formatDate(task.dueDate)}
                                </span>
                                {isOverdue(task.dueDate) && !task.completed && (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              <span className={`px-3 py-1 text-xs rounded-full ${
                                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {task.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEditTask(task)}
                            className={`p-2 rounded-lg transition-colors ${
                              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTask(task._id || task.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

          </div>
  );
};

export default TaskManager;
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ScheduledTask } from '../types/features';

const SCHEDULED_TASKS_KEY = 'scout360_scheduler_tasks';
const NOTIFICATIONS_KEY = 'scout360_notification_settings';

export function useScheduler() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load tasks and notification settings
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedTasks = localStorage.getItem(SCHEDULED_TASKS_KEY);
      const savedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);

      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }

      if (savedNotifications) {
        setNotificationsEnabled(JSON.parse(savedNotifications));
      }
    } catch {
      console.error('Failed to load scheduler data');
    }

    // Initialize audio for notifications
    audioRef.current = new Audio('/notification-sound.mp3');
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SCHEDULED_TASKS_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Save notification settings
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  // Check for due tasks
  useEffect(() => {
    checkIntervalRef.current = setInterval(() => {
      const now = Date.now();
      
      tasks.forEach(task => {
        if (task.isCompleted || task.notified) return;
        
        if (task.scheduledAt <= now) {
          // Task is due
          notifyTask(task);
          
          // Mark as notified
          setTasks(prev => prev.map(t => 
            t.id === task.id ? { ...t, notified: true } : t
          ));

          // Handle recurrence
          if (task.recurrence && task.recurrence !== 'none') {
            scheduleRecurringTask(task);
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [tasks]);

  const notifyTask = useCallback((task: ScheduledTask) => {
    // Browser notification
    if (notificationsEnabled && Notification.permission === 'granted') {
      new Notification('Scout 360 - Lembrete', {
        body: task.title,
        icon: '/favicon.ico',
        tag: task.id,
      });
    }

    // Play sound
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    // Show in-app notification (could be implemented with toast)
  }, [notificationsEnabled]);

  const scheduleRecurringTask = useCallback((task: ScheduledTask) => {
    let nextScheduledAt = task.scheduledAt;
    
    switch (task.recurrence) {
      case 'daily':
        nextScheduledAt += 24 * 60 * 60 * 1000;
        break;
      case 'weekly':
        nextScheduledAt += 7 * 24 * 60 * 60 * 1000;
        break;
      case 'monthly':
        // Approximate month
        nextScheduledAt += 30 * 24 * 60 * 60 * 1000;
        break;
    }

    const newTask: ScheduledTask = {
      ...task,
      id: `task-${Date.now()}`,
      scheduledAt: nextScheduledAt,
      isCompleted: false,
      notified: false,
    };

    setTasks(prev => [...prev, newTask]);
  }, []);

  const scheduleTask = useCallback((
    type: ScheduledTask['type'],
    title: string,
    scheduledAt: number,
    options?: {
      description?: string;
      recurrence?: ScheduledTask['recurrence'];
      relatedSessionId?: string;
      relatedCardId?: string;
    }
  ): string => {
    const newTask: ScheduledTask = {
      id: `task-${Date.now()}`,
      type,
      title,
      description: options?.description,
      scheduledAt,
      recurrence: options?.recurrence || 'none',
      relatedSessionId: options?.relatedSessionId,
      relatedCardId: options?.relatedCardId,
      isCompleted: false,
      notified: false,
    };

    setTasks(prev => [...prev, newTask]);
    return newTask.id;
  }, []);

  const scheduleFollowUp = useCallback((
    title: string,
    daysFromNow: number,
    relatedSessionId?: string,
    relatedCardId?: string
  ): string => {
    const scheduledAt = Date.now() + (daysFromNow * 24 * 60 * 60 * 1000);
    return scheduleTask('follow_up', title, scheduledAt, {
      relatedSessionId,
      relatedCardId,
    });
  }, [scheduleTask]);

  const scheduleReminder = useCallback((
    title: string,
    minutesFromNow: number,
    description?: string
  ): string => {
    const scheduledAt = Date.now() + (minutesFromNow * 60 * 1000);
    return scheduleTask('reminder', title, scheduledAt, { description });
  }, [scheduleTask]);

  const completeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, isCompleted: true } : t
    ));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const snoozeTask = useCallback((taskId: string, minutes: number) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { 
            ...t, 
            scheduledAt: Date.now() + (minutes * 60 * 1000),
            notified: false,
          }
        : t
    ));
  }, []);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    const enabled = permission === 'granted';
    setNotificationsEnabled(enabled);
    return enabled;
  }, []);

  const upcomingTasks = useMemo(() => {
    const now = Date.now();
    return tasks
      .filter(t => !t.isCompleted && t.scheduledAt > now)
      .sort((a, b) => a.scheduledAt - b.scheduledAt)
      .slice(0, 10);
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const now = Date.now();
    return tasks
      .filter(t => !t.isCompleted && t.scheduledAt <= now && !t.notified)
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  }, [tasks]);

  const completedTasks = useMemo(() => 
    tasks.filter(t => t.isCompleted).sort((a, b) => b.scheduledAt - a.scheduledAt),
    [tasks]
  );

  const tasksByType = useMemo(() => {
    const grouped: Record<string, ScheduledTask[]> = {};
    tasks.forEach(t => {
      if (!grouped[t.type]) {
        grouped[t.type] = [];
      }
      grouped[t.type].push(t);
    });
    return grouped;
  }, [tasks]);

  const toggleScheduler = useCallback(() => {
    setIsSchedulerOpen(prev => !prev);
  }, []);

  const formatScheduledTime = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isTomorrow) {
      return `Amanhã às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  return {
    tasks,
    upcomingTasks,
    overdueTasks,
    completedTasks,
    tasksByType,
    isSchedulerOpen,
    notificationsEnabled,
    scheduleTask,
    scheduleFollowUp,
    scheduleReminder,
    completeTask,
    deleteTask,
    snoozeTask,
    enableNotifications,
    toggleScheduler,
    formatScheduledTime,
  };
}

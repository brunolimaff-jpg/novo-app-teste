import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Workflow, WorkflowTrigger, ScheduledTask } from '../types/features';

const WORKFLOWS_KEY = 'scout360_workflows';
const SCHEDULED_TASKS_KEY = 'scout360_scheduled_tasks';

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [isWorkflowPanelOpen, setIsWorkflowPanelOpen] = useState(false);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load workflows and tasks from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedWorkflows = localStorage.getItem(WORKFLOWS_KEY);
      const savedTasks = localStorage.getItem(SCHEDULED_TASKS_KEY);

      if (savedWorkflows) {
        setWorkflows(JSON.parse(savedWorkflows));
      }

      if (savedTasks) {
        setScheduledTasks(JSON.parse(savedTasks));
      }
    } catch {
      console.error('Failed to load workflows');
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
  }, [workflows]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SCHEDULED_TASKS_KEY, JSON.stringify(scheduledTasks));
  }, [scheduledTasks]);

  // Check scheduled workflows
  useEffect(() => {
    checkIntervalRef.current = setInterval(() => {
      const now = Date.now();
      
      // Check scheduled workflows
      workflows.forEach(workflow => {
        if (!workflow.isActive || workflow.trigger !== 'scheduled') return;
        
        // Simple scheduled check - could be enhanced with cron-like syntax
        // For now, just check if conditions are met
        checkWorkflowConditions(workflow);
      });
    }, 60000); // Check every minute

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [workflows]);

  const checkWorkflowConditions = useCallback((workflow: Workflow): boolean => {
    // Check all conditions
    return workflow.conditions.every(condition => {
      // This would check actual data based on the condition
      // For now, return true for demo
      return true;
    });
  }, []);

  const executeWorkflow = useCallback((workflowId: string, context?: Record<string, unknown>) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow || !workflow.isActive) return;

    // Execute each action
    workflow.actions.forEach(action => {
      switch (action.type) {
        case 'send_reminder':
          // Create a scheduled task
          const reminderTask: ScheduledTask = {
            id: `task-${Date.now()}`,
            type: 'reminder',
            title: action.config.title as string || 'Lembrete',
            description: action.config.description as string,
            scheduledAt: Date.now() + ((action.config.delayMinutes as number) || 0) * 60000,
          };
          setScheduledTasks(prev => [...prev, reminderTask]);
          break;

        case 'create_task':
          const task: ScheduledTask = {
            id: `task-${Date.now()}`,
            type: 'follow_up',
            title: action.config.title as string || 'Nova tarefa',
            description: action.config.description as string,
            scheduledAt: Date.now(),
            relatedSessionId: context?.sessionId as string,
            relatedCardId: context?.cardId as string,
          };
          setScheduledTasks(prev => [...prev, task]);
          break;

        case 'notify':
          // Show browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification(action.config.title as string || 'Scout 360', {
              body: action.config.message as string,
              icon: '/favicon.ico',
            });
          }
          break;

        case 'export_data':
          // Trigger export
          break;
      }
    });

    // Update last run
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, lastRunAt: Date.now(), runCount: w.runCount + 1 }
        : w
    ));
  }, [workflows]);

  const triggerWorkflow = useCallback((trigger: WorkflowTrigger, context?: Record<string, unknown>) => {
    const matchingWorkflows = workflows.filter(w => 
      w.isActive && w.trigger === trigger
    );

    matchingWorkflows.forEach(workflow => {
      if (checkWorkflowConditions(workflow)) {
        executeWorkflow(workflow.id, context);
      }
    });
  }, [workflows, checkWorkflowConditions, executeWorkflow]);

  const createWorkflow = useCallback((
    name: string,
    description: string,
    trigger: WorkflowTrigger,
    conditions: Workflow['conditions'],
    actions: Workflow['actions']
  ): string => {
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name,
      description,
      isActive: true,
      trigger,
      conditions,
      actions,
      createdAt: Date.now(),
      runCount: 0,
    };

    setWorkflows(prev => [...prev, newWorkflow]);
    return newWorkflow.id;
  }, []);

  const updateWorkflow = useCallback((workflowId: string, updates: Partial<Workflow>) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, ...updates } : w
    ));
  }, []);

  const deleteWorkflow = useCallback((workflowId: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== workflowId));
  }, []);

  const toggleWorkflow = useCallback((workflowId: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, isActive: !w.isActive } : w
    ));
  }, []);

  const duplicateWorkflow = useCallback((workflowId: string, newName: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    const newWorkflow: Workflow = {
      ...workflow,
      id: `workflow-${Date.now()}`,
      name: newName,
      isActive: false,
      createdAt: Date.now(),
      runCount: 0,
    };

    setWorkflows(prev => [...prev, newWorkflow]);
    return newWorkflow.id;
  }, [workflows]);

  const activeWorkflows = useMemo(() => 
    workflows.filter(w => w.isActive),
    [workflows]
  );

  const workflowsByTrigger = useMemo(() => {
    const grouped: Record<string, Workflow[]> = {};
    workflows.forEach(w => {
      if (!grouped[w.trigger]) {
        grouped[w.trigger] = [];
      }
      grouped[w.trigger].push(w);
    });
    return grouped;
  }, [workflows]);

  const toggleWorkflowPanel = useCallback(() => {
    setIsWorkflowPanelOpen(prev => !prev);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  return {
    workflows,
    scheduledTasks,
    activeWorkflows,
    workflowsByTrigger,
    isWorkflowPanelOpen,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    duplicateWorkflow,
    triggerWorkflow,
    executeWorkflow,
    checkWorkflowConditions,
    toggleWorkflowPanel,
    requestNotificationPermission,
  };
}

export interface CompanyUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active?: boolean;
    hourly_rate?: number | string | null;
    overtime_rate?: number | string | null;
    daily_limit_minutes?: number | null;
    overtime_task_id?: string | null;
}

export interface TaskOption {
    id: string;
    name: string;
    project?: { name: string } | null;
}

export interface CompanySettings {
    overtime_reminder_interval_minutes: number;
    default_overtime_task_id?: string | null;
}

export const taskLabel = (task: TaskOption) => (task.project?.name ? `${task.project.name} / ${task.name}` : task.name);

export const roleLabel = (role: string) => {
    switch (role) {
        case 'admin': return 'Administrator';
        case 'manager': return 'Manager';
        case 'employee': return 'Pracownik';
        default: return role;
    }
};

export const formatLimitHours = (minutes: number | null | undefined) => {
    if (minutes === null || minutes === undefined) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
};

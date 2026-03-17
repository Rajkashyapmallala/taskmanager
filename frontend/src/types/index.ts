export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TasksResponse {
  tasks: Task[];
  pagination: Pagination;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: TaskStatus | '';
  search?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
}

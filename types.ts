
export type Role = 'interviewer' | 'candidate' | 'system';

export interface Message {
  role: Role;
  text?: string;
  videoUrl?: string;
}

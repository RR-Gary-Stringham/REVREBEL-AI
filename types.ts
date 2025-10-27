
export type Mode = 'COPYWRITING' | 'VISUAL_QA' | 'STRATEGY';

export interface Message {
  role: 'user' | 'model';
  content: string;
  mode: Mode;
  isError?: boolean;
}

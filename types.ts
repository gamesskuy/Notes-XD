
export interface TallyItem {
  id: string;
  label: string;
  count: number;
}

export interface NoteEntry {
  id: string;
  date: string;
  title: string;
  items: TallyItem[];
  lastModified: number;
}

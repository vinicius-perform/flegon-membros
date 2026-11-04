import fs from 'fs';
import path from 'path';
import { put, list } from '@vercel/blob';

export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'admin';
  plan_type?: 'basic' | 'premium';
  approval_status: 'pending' | 'approved' | 'rejected';
  crm?: string;
  created_at: string;
}

export const DEFAULT_STUDENTS: StudentRecord[] = [
  {
    id: 'usr-admin',
    name: 'Dr. Flegon David',
    email: 'admin@flegon.com',
    role: 'admin',
    plan_type: 'premium',
    approval_status: 'approved',
    crm: 'CRM 12345/SP',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr-membro',
    name: 'Dr. Membro Flegon',
    email: 'membro@flegon.com',
    role: 'student',
    plan_type: 'premium',
    approval_status: 'approved',
    crm: 'CRM 54321/SP',
    created_at: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'usr-1793814789819',
    name: 'Vinicius Marinho',
    email: 'viniciusmarinhods@gmail.com',
    role: 'student',
    plan_type: 'basic',
    approval_status: 'approved',
    created_at: '2026-11-04T17:53:09.819Z',
  },
];

const STUDENTS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'students-data.json');

declare global {
  // eslint-disable-next-line no-var
  var __flegon_students_cache: StudentRecord[] | undefined;
}

export function readLocalStudents(): StudentRecord[] {
  try {
    if (fs.existsSync(STUDENTS_FILE_PATH)) {
      const content = fs.readFileSync(STUDENTS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Falha ao ler cache local de estudantes:', err);
  }
  return DEFAULT_STUDENTS;
}

export function saveLocalStudents(students: StudentRecord[]) {
  try {
    global.__flegon_students_cache = students;
    fs.writeFileSync(STUDENTS_FILE_PATH, JSON.stringify(students, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Falha ao salvar cache local de estudantes:', err);
  }
}

export async function syncWithCloud(students: StudentRecord[]) {
  try {
    await put('flegon/students.json', JSON.stringify(students, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
  } catch (err) {
    console.warn('Falha ao sincronizar com Vercel Blob:', err);
  }
}

export async function fetchStudentsFromCloud(): Promise<StudentRecord[] | null> {
  try {
    const result = await list({ prefix: 'flegon/students' });
    if (result.blobs && result.blobs.length > 0) {
      const downloadUrl = result.blobs[0].downloadUrl;
      const res = await fetch(`${downloadUrl}&_v=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.ok) {
        const cloudStudents: StudentRecord[] = await res.json();
        if (Array.isArray(cloudStudents)) {
          const mergedMap = new Map<string, StudentRecord>();

          for (const def of DEFAULT_STUDENTS) {
            mergedMap.set(def.email.toLowerCase(), def);
          }

          for (const item of cloudStudents) {
            if (item && item.email) {
              mergedMap.set(item.email.toLowerCase(), {
                ...mergedMap.get(item.email.toLowerCase()),
                ...item,
              });
            }
          }

          const merged = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          saveLocalStudents(merged);
          return merged;
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao consultar Vercel Blob de estudantes:', err);
  }
  return null;
}

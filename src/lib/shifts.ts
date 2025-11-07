import { format } from 'date-fns';

export type ShiftTemplateKey = 'diurno' | 'vespertino' | 'nocturno' | '12h-dia' | '12h-noche' | '24h';

export interface ShiftTemplate {
  key: ShiftTemplateKey;
  label: string;
  startTime: string; // HH:mm 24h
  endTime: string;   // HH:mm 24h (may cross midnight if endTime < startTime)
  durationHours: number;
  nocturno: boolean;
  recargoPercent: number; // 0 if none
  spansMidnight: boolean;
}

export const SHIFT_TEMPLATES: Record<ShiftTemplateKey, ShiftTemplate> = {
  diurno: {
    key: 'diurno',
    label: 'Diurno (07:00–13:00)',
    startTime: '07:00',
    endTime: '13:00',
    durationHours: 6,
    nocturno: false,
    recargoPercent: 0,
    spansMidnight: false,
  },
  vespertino: {
    key: 'vespertino',
    label: 'Vespertino (13:00–19:00)',
    startTime: '13:00',
    endTime: '19:00',
    durationHours: 6,
    nocturno: false,
    recargoPercent: 0,
    spansMidnight: false,
  },
  nocturno: {
    key: 'nocturno',
    label: 'Nocturno (19:00–07:00)',
    startTime: '19:00',
    endTime: '07:00',
    durationHours: 12,
    nocturno: true,
    recargoPercent: 25,
    spansMidnight: true,
  },
  '12h-dia': {
    key: '12h-dia',
    label: '12 Horas Día (07:00–19:00)',
    startTime: '07:00',
    endTime: '19:00',
    durationHours: 12,
    nocturno: false,
    recargoPercent: 0,
    spansMidnight: false,
  },
  '12h-noche': {
    key: '12h-noche',
    label: '12 Horas Noche (19:00–07:00)',
    startTime: '19:00',
    endTime: '07:00',
    durationHours: 12,
    nocturno: true,
    recargoPercent: 25,
    spansMidnight: true,
  },
  '24h': {
    key: '24h',
    label: '24 Horas (07:00–07:00)',
    startTime: '07:00',
    endTime: '07:00',
    durationHours: 24,
    nocturno: true,
    recargoPercent: 25, // apply night part recargo if needed later
    spansMidnight: true,
  },
};

export interface ShiftDoc {
  id?: string;
  doctorId: string;
  doctorName: string;
  doctorRole?: string;
  doctorSpecialty?: string;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd (same as startDate unless spans midnight)
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  type: ShiftTemplateKey;
  durationHours: number;
  nocturno: boolean;
  recargoPercent: number;
  spansMidnight: boolean;
  status?: 'próximo' | 'activo' | 'finalizado'; // stored or derived
  area?: string; // Área / Servicio
  observations?: string; // Observaciones
  createdAt?: any; // Firestore timestamp
}

function parseHM(time: string) {
  const [h, m] = time.split(':').map(Number);
  return { h, m };
}

function toDate(base: Date, h: number, m: number) {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

export function computeShiftStatus(shift: ShiftDoc, now: Date = new Date()): 'próximo' | 'activo' | 'finalizado' {
  // Parse dates
  const startDateObj = new Date(shift.startDate + 'T00:00:00');
  const endDateObj = new Date(shift.endDate + 'T00:00:00');
  const { h: sh, m: sm } = parseHM(shift.startTime);
  const { h: eh, m: em } = parseHM(shift.endTime);

  const startDateTime = toDate(startDateObj, sh, sm);
  // If spans midnight and endDate different, end time belongs to endDate
  const endDateTime = toDate(shift.spansMidnight || shift.startDate !== shift.endDate ? endDateObj : startDateObj, eh, em);

  if (now < startDateTime) return 'próximo';
  if (now >= startDateTime && now <= endDateTime) return 'activo';
  return 'finalizado';
}

export function createShiftDocFromTemplate(templateKey: ShiftTemplateKey, doctor: { id: string; displayName: string }, date: Date): ShiftDoc {
  const tpl = SHIFT_TEMPLATES[templateKey];
  const startDate = format(date, 'yyyy-MM-dd');
  let endDate = startDate;
  if (tpl.spansMidnight) {
    // end date is next day for those that cross midnight (nocturno, 12h-noche, 24h)
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    endDate = format(next, 'yyyy-MM-dd');
  }
  return {
    doctorId: doctor.id,
    doctorName: doctor.displayName,
    startDate,
    endDate,
    startTime: tpl.startTime,
    endTime: tpl.endTime,
    type: tpl.key,
    durationHours: tpl.durationHours,
    nocturno: tpl.nocturno,
    recargoPercent: tpl.recargoPercent,
    spansMidnight: tpl.spansMidnight,
    status: 'próximo',
  };
}

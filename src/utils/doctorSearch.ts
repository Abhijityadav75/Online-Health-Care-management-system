import { User } from '../types';

/**
 * Intelligent doctor search matcher for medical specialties and names.
 */
export function matchesDoctorSearch(doctor: User, rawTerm: string): boolean {
  if (!rawTerm || !rawTerm.trim()) {
    return false;
  }
  const term = rawTerm.trim().toLowerCase();
  const name = (doctor.name || '').toLowerCase();
  const spec = (doctor.specialization || '').toLowerCase();
  const qual = (doctor.qualification || '').toLowerCase();
  const hosp = (doctor.hospital || '').toLowerCase();

  // 1. Direct name match
  if (name.includes(term)) {
    return true;
  }

  // 2. Direct match in qualification or clinic
  if (qual.includes(term) || hosp.includes(term)) {
    return true;
  }

  // 3. Direct match in specialization
  if (spec.includes(term) || term.includes(spec)) {
    return true;
  }

  // 4. Medical specialty aliases
  const fieldAliases: Record<string, string[]> = {
    cardiology: ['cardiologist', 'cardio', 'cardiac', 'heart'],
    cardiologist: ['cardiology', 'cardio', 'cardiac', 'heart'],
    cardiac: ['cardiologist', 'cardiology', 'cardio', 'heart'],
    dermatology: ['dermatologist', 'derma', 'skin'],
    dermatologist: ['dermatology', 'derma', 'skin'],
    orthopedics: ['orthopedist', 'orthopedic', 'bone', 'joint', 'spine'],
    orthopedic: ['orthopedics', 'orthopedist', 'bone', 'joint', 'spine'],
    orthopedist: ['orthopedics', 'orthopedic', 'bone', 'joint', 'spine'],
    'general medicine': ['general physician', 'physician', 'internal medicine', 'doctor', 'general'],
    'general physician': ['general medicine', 'physician', 'internal medicine', 'doctor', 'general'],
    physician: ['general physician', 'general medicine', 'internal medicine'],
    'internal medicine': ['general physician', 'general medicine', 'physician'],
    pediatrics: ['pediatrician', 'child', 'kids'],
    pediatrician: ['pediatrics', 'child', 'kids'],
    neurology: ['neurologist', 'neuro', 'brain'],
    neurologist: ['neurology', 'neuro', 'brain'],
  };

  for (const [key, aliases] of Object.entries(fieldAliases)) {
    const specMatchesKey = spec.includes(key) || aliases.some(a => spec.includes(a));
    if (specMatchesKey) {
      if (term.includes(key) || aliases.some(a => term.includes(a))) {
        return true;
      }
    }
  }

  // 5. Common roots
  const roots = ['cardio', 'derma', 'ortho', 'pediatr', 'neuro', 'physic'];
  for (const root of roots) {
    if (spec.includes(root) && term.includes(root)) {
      return true;
    }
  }

  return false;
}

export function matchesSpecialty(docSpecialization?: string, filter?: string): boolean {
  if (!filter || filter === 'All') {
    return true;
  }
  if (!docSpecialization) {
    return false;
  }
  const d = docSpecialization.trim().toLowerCase();
  const f = filter.trim().toLowerCase();

  if (d === f) {
    return true;
  }

  const deptMap: Record<string, string[]> = {
    cardiology: ['cardiologist', 'cardio', 'cardiac', 'heart'],
    cardiologist: ['cardiology', 'cardio', 'cardiac', 'heart'],
    'general medicine': ['general physician', 'physician', 'internal medicine', 'doctor', 'general medicine'],
    'general physician': ['general medicine', 'physician', 'internal medicine', 'doctor', 'general physician'],
    dermatology: ['dermatologist', 'derma', 'skin', 'dermatology'],
    dermatologist: ['dermatology', 'derma', 'skin', 'dermatologist'],
    orthopedics: ['orthopedist', 'orthopedic', 'orthopedics', 'bone', 'joint', 'spine'],
    orthopedist: ['orthopedics', 'orthopedic', 'orthopedist', 'bone', 'joint', 'spine'],
  };

  const allowed = deptMap[f];
  if (allowed && allowed.some(a => d.includes(a) || a.includes(d))) {
    return true;
  }

  if (d.includes(f) || f.includes(d)) {
    return true;
  }

  const roots = ['cardio', 'derma', 'ortho', 'pediatr', 'neuro', 'physic'];
  for (const root of roots) {
    if (d.includes(root) && f.includes(root)) {
      return true;
    }
  }

  return false;
}

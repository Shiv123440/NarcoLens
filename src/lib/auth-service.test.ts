import { describe, expect, it, beforeEach } from 'vitest';
import {
  signUpOfficer,
  signInOfficer,
  getActiveOfficer,
  signOutOfficer,
  getRegisteredOfficers,
  validatePassword,
} from './auth-service';

describe('Officer Authentication Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('validates password requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number)', () => {
    expect(validatePassword('1234567').valid).toBe(false);
    expect(validatePassword('nouppercase1').valid).toBe(false);
    expect(validatePassword('NOLOWERCASE1').valid).toBe(false);
    expect(validatePassword('NoNumbersHere').valid).toBe(false);
    expect(validatePassword('StrongPass2026').valid).toBe(true);
  });

  it('allows an officer to register with valid password and sign in with credentials', async () => {
    const res = await signUpOfficer({
      fullName: 'Insp. Rajesh Kumar',
      officerId: 'NCB-DEL-0142',
      station: 'Delhi Zonal Unit',
      email: 'rajesh.kumar@ncb.gov.in',
      password: 'StrongPass2026',
      autoSignIn: false,
    });

    expect(res.success).toBe(true);
    expect(res.officer).toBeDefined();
    expect(res.officer?.email).toBe('rajesh.kumar@ncb.gov.in');
    expect(res.officer?.full_name).toBe('Insp. Rajesh Kumar');

    // Active session is NOT set yet (officer must enter login credentials first)
    const activeBeforeLogin = getActiveOfficer();
    expect(activeBeforeLogin).toBeNull();

    // Verify saved in registered officers
    const registered = getRegisteredOfficers();
    expect(registered).toHaveLength(1);
    expect(registered[0]?.officer_id).toBe('NCB-DEL-0142');

    // Officer signs in with credentials
    const loginRes = await signInOfficer({
      email: 'rajesh.kumar@ncb.gov.in',
      password: 'StrongPass2026',
    });
    expect(loginRes.success).toBe(true);
    expect(getActiveOfficer()?.email).toBe('rajesh.kumar@ncb.gov.in');
  });

  it('allows registered officer to sign in with username or email', async () => {
    // 1. Sign up officer
    await signUpOfficer({
      fullName: 'Sub-Insp. Priya Sharma',
      officerId: 'NCB-MUM-0589',
      station: 'Mumbai Zonal Unit',
      email: 'priya.sharma@ncb.gov.in',
      password: 'MumbaiPassword2026',
    });

    // 2. Sign out
    await signOutOfficer();
    expect(getActiveOfficer()).toBeNull();

    // 3. Sign in using officer username / ID
    const loginRes = await signInOfficer({
      email: 'NCB-MUM-0589',
      password: 'MumbaiPassword2026',
    });

    expect(loginRes.success).toBe(true);
    expect(loginRes.officer?.full_name).toBe('Sub-Insp. Priya Sharma');
    expect(getActiveOfficer()?.email).toBe('priya.sharma@ncb.gov.in');
  });

  it('rejects signin with incorrect password', async () => {
    await signUpOfficer({
      fullName: 'Officer Amit',
      officerId: 'NCB-KOL-0221',
      station: 'Kolkata Zonal Unit',
      email: 'amit@ncb.gov.in',
      password: 'KolkataPass2026',
    });

    await signOutOfficer();

    const badLogin = await signInOfficer({
      email: 'amit@ncb.gov.in',
      password: 'WrongPassword2026',
    });

    expect(badLogin.success).toBe(false);
    expect(badLogin.error).toMatch(/incorrect/i);
    expect(getActiveOfficer()).toBeNull();
  });
});

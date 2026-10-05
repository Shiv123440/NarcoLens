import { describe, expect, it, beforeEach } from 'vitest';
import {
  signUpOfficer,
  signInOfficer,
  getActiveOfficer,
  signOutOfficer,
  getRegisteredOfficers,
} from './auth-service';

describe('Officer Authentication Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows an officer to sign up and immediately establishes active session without email verification', async () => {
    const res = await signUpOfficer({
      fullName: 'Insp. Rajesh Kumar',
      officerId: 'NCB-DEL-0142',
      station: 'Delhi Zonal Unit',
      email: 'rajesh.kumar@ncb.gov.in',
      password: 'securepassword123',
    });

    expect(res.success).toBe(true);
    expect(res.officer).toBeDefined();
    expect(res.officer?.email).toBe('rajesh.kumar@ncb.gov.in');
    expect(res.officer?.full_name).toBe('Insp. Rajesh Kumar');

    // Verify active officer session is established immediately
    const active = getActiveOfficer();
    expect(active).not.toBeNull();
    expect(active?.email).toBe('rajesh.kumar@ncb.gov.in');

    // Verify saved in registered officers
    const registered = getRegisteredOfficers();
    expect(registered).toHaveLength(1);
    expect(registered[0]?.officer_id).toBe('NCB-DEL-0142');
  });

  it('allows registered officer to sign in with valid credentials', async () => {
    // 1. Sign up officer
    await signUpOfficer({
      fullName: 'Sub-Insp. Priya Sharma',
      officerId: 'NCB-MUM-0589',
      station: 'Mumbai Zonal Unit',
      email: 'priya.sharma@ncb.gov.in',
      password: 'mumbaipassword',
    });

    // 2. Sign out
    await signOutOfficer();
    expect(getActiveOfficer()).toBeNull();

    // 3. Sign in
    const loginRes = await signInOfficer({
      email: 'priya.sharma@ncb.gov.in',
      password: 'mumbaipassword',
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
      password: 'correctpassword',
    });

    await signOutOfficer();

    const badLogin = await signInOfficer({
      email: 'amit@ncb.gov.in',
      password: 'wrongpassword',
    });

    expect(badLogin.success).toBe(false);
    expect(badLogin.error).toMatch(/incorrect/i);
    expect(getActiveOfficer()).toBeNull();
  });
});

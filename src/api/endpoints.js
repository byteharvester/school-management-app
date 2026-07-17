// src/api/endpoints.js
import { callServer } from './gasClient';

// Auth
export const getUserRole = () => callServer('getUserRole');

// Students
export const getStudentData = () => callServer('getStudentData');
export const updateAttendance = (rowNum, status) => callServer('updateAttendance', rowNum, status);
export const updateHealth = (rowNum, healthStatus, notes) => callServer('updateHealth', rowNum, healthStatus, notes);
export const saveStudentProfile = (formData, photo, clothes, chappal, aadhaar, udid, multiDoc, extraDocs) => 
  callServer('saveStudentProfile', formData, photo, clothes, chappal, aadhaar, udid, multiDoc, extraDocs);
export const deleteDocument = (rowNum, column, fileUrl) => 
  callServer('deleteDocument', rowNum, column, fileUrl);

// Staff
export const getStaffData = () => callServer('getStaffData');
export const getStaffDashboardData = () => callServer('getStaffDashboardData');
export const getStaffByStatus = (status) => callServer('getStaffByStatus', status);
export const getStaffProfile = (email) => callServer('getStaffProfile', email);
export const updateStaffProfile = (email, formData, photo, aadhaar, pan, docFiles) =>
  callServer('updateStaffProfile', email, formData, photo, aadhaar, pan, docFiles);
export const updateStaffStatus = (email, status, note, location) =>
  callServer('updateStaffStatus', email, status, note, location);
export const getStaffStatusHistory = (email) => callServer('getStaffStatusHistory', email);
export const clockIn = (email, location) => callServer('clockIn', email, location);
export const clockOut = (email, location) => callServer('clockOut', email, location);
export const getTodayAttendance = (email) => callServer('getTodayAttendance', email);

// Leave
export const getStaffLeaveBalance = (email) => callServer('getStaffLeaveBalance', email);
export const applyLeave = (email, type, from, to, reason) => 
  callServer('applyLeave', email, type, from, to, reason);
export const getLeaveHistory = (email) => callServer('getLeaveHistory', email);
export const getLeaveRequestsWithBalance = (status) => callServer('getLeaveRequestsWithBalance', status);
export const updateLeaveRequest = (id, newStatus, adminEmail, note) =>
  callServer('updateLeaveRequest', id, newStatus, adminEmail, note);
export const updateStaffClass = (email, className) => callServer('updateStaffClass', email, className);
// src/api/gasClient.js
export function callServer(fnName, ...args) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.script) {
      window.google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        [fnName](...args);
    } else {
      console.warn(`🟡 Mocking: ${fnName}`, args);
      
      // Define your mocks here
      const mockData = {
        getUserRole: { email: 'admin@school.com', role: 'Admin', name: 'Test Admin', radius: 999999 },
        getStudentData: { 
          students: [
            { rowNum: 1, Name: 'Rahul Sharma', Class: 'Primary', Gender: 'Male', Attendance: 'Present', Health: 'Healthy', "Toilet Status": 'Trained' },
            { rowNum: 2, Name: 'Priya Patel', Class: 'Secondary', Gender: 'Female', Attendance: 'Absent', Health: 'Sick', "Toilet Status": 'Not Trained' }
          ]
        },
        getStaffData: JSON.stringify([{ name: 'Mr. Verma', email: 'verma@school.com', role: 'Teacher', classAssigned: 'Primary', status: 'Present' }]),
        getStaffDashboardData: JSON.stringify({ 
          staff: [{ name: 'Mr. Verma', email: 'verma@school.com', role: 'Teacher', classAssigned: 'Primary', status: 'Present' }],
          counts: { Present: 1, Absent: 0, 'On Leave': 0, 'Outdoor Duty': 0, Offline: 0 },
          total: 1
        })
      };

      const result = mockData[fnName];
      if (result !== undefined) {
        resolve(result);
      } else {
        resolve({}); // fallback
      }
    }
  });
}
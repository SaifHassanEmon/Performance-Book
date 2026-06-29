/* ============================================================
   Offline Synchronization Layer
   Syncs local Dexie/IndexedDB data to Firebase Firestore
   when online, or copies data to a mock shared buffer in
   localStorage when running in offline mock mode.
   ============================================================ */

const Sync = (() => {

  // ---- Submit Monthly Report to Supervisor ----
  async function submitMonthlyReport(report) {
    const user = Auth.getCurrentUser();
    if (!user) throw new Error("Authentication required to submit report");

    const reportId = `${report.year}_${report.month}_${user.uid}`;
    const payload = {
      ...report,
      id: reportId,
      uid: user.uid,
      memberName: user.displayName,
      memberEmail: user.email,
      memberUposakha: user.uposakha || '',
      submittedAt: new Date().toISOString(),
      status: 'pending', // pending, reviewed
      supervisorFeedback: ''
    };

    if (FirebaseAvailable) {
      try {
        // Save to Firestore 'monthly_reports' collection
        await dbFirestore.collection('monthly_reports').doc(reportId).set(payload);
        
        // Also upload the daily reports of that month to help supervisor verify
        const dailyReports = await DB.getMonthlyReports(report.year, report.month);
        const batch = dbFirestore.batch();
        
        dailyReports.forEach(dayReport => {
          const dayId = `${dayReport.year}_${dayReport.month}_${dayReport.day}_${user.uid}`;
          const dayRef = dbFirestore.collection('daily_reports').doc(dayId);
          batch.set(dayRef, { ...dayReport, uid: user.uid });
        });
        
        await batch.commit();
        console.log("Monthly plan & daily reports synced online to Firestore.");
      } catch (err) {
        console.error("Firestore sync failed, Firestore will auto-retry when online:", err);
        // Firestore automatically queues offline writes, so we don't throw an error to the user
      }
    } else {
      // Mock online submission: store in a shared localStorage queue
      const submissions = JSON.parse(localStorage.getItem('perfbook_mock_submissions') || '[]');
      const index = submissions.findIndex(s => s.id === reportId);
      
      if (index !== -1) {
        submissions[index] = payload;
      } else {
        submissions.push(payload);
      }
      
      localStorage.setItem('perfbook_mock_submissions', JSON.stringify(submissions));

      // Also copy daily reports to a mock daily reports collection
      const dailyReports = await DB.getMonthlyReports(report.year, report.month);
      const mockDailies = JSON.parse(localStorage.getItem('perfbook_mock_daily_reports') || '[]');
      
      dailyReports.forEach(dr => {
        const dayId = `${dr.year}_${dr.month}_${dr.day}_${user.uid}`;
        const existingIdx = mockDailies.findIndex(d => d.id === dayId);
        const dayPayload = { ...dr, id: dayId, uid: user.uid };
        if (existingIdx !== -1) {
          mockDailies[existingIdx] = dayPayload;
        } else {
          mockDailies.push(dayPayload);
        }
      });
      localStorage.setItem('perfbook_mock_daily_reports', JSON.stringify(mockDailies));
    }
  }

  // ---- Fetch Member's Own Submitted Reports ----
  async function getMemberSubmissions() {
    const user = Auth.getCurrentUser();
    if (!user) return [];

    if (FirebaseAvailable) {
      const snapshot = await dbFirestore.collection('monthly_reports')
        .where('uid', '==', user.uid)
        .get();
      
      const reports = [];
      snapshot.forEach(doc => {
        reports.push(doc.data());
      });

      // Mirror comments/status to local IndexedDB
      for (const r of reports) {
        const localPlan = await DB.getMonthlyPlan(r.year, r.month);
        if (localPlan) {
          await DB.saveMonthlyPlan({
            ...localPlan,
            status: r.status,
            supervisorFeedback: r.supervisorFeedback,
            reviewedAt: r.reviewedAt
          });
        } else {
          await DB.saveMonthlyPlan({
            year: r.year,
            month: r.month,
            status: r.status,
            supervisorFeedback: r.supervisorFeedback,
            reviewedAt: r.reviewedAt
          });
        }
      }
      
      return reports;
    } else {
      const submissions = JSON.parse(localStorage.getItem('perfbook_mock_submissions') || '[]');
      const filtered = submissions.filter(s => s.uid === user.uid);

      // Mirror comments/status to local IndexedDB under mock mode
      for (const r of filtered) {
        const localPlan = await DB.getMonthlyPlan(r.year, r.month);
        if (localPlan) {
          await DB.saveMonthlyPlan({
            ...localPlan,
            status: r.status,
            supervisorFeedback: r.supervisorFeedback,
            reviewedAt: r.reviewedAt
          });
        } else {
          await DB.saveMonthlyPlan({
            year: r.year,
            month: r.month,
            status: r.status,
            supervisorFeedback: r.supervisorFeedback,
            reviewedAt: r.reviewedAt
          });
        }
      }

      return filtered;
    }
  }

  // ---- Fetch Submitted Reports for Supervisor ----
  async function getSubmittedReportsForSupervisor() {
    const user = Auth.getCurrentUser();
    const isSuper = user && (user.isSupervisor || user.role === 'supervisor' || user.isAdmin || user.role === 'admin');
    if (!user || !isSuper) {
      throw new Error("Unauthorized access. Supervisor role required.");
    }

    if (FirebaseAvailable) {
      // Fetch submitted reports from Firestore
      const snapshot = await dbFirestore.collection('monthly_reports')
        .orderBy('submittedAt', 'desc')
        .get();
      
      const reports = [];
      snapshot.forEach(doc => {
        reports.push(doc.data());
      });
      return reports;
    } else {
      // Mock supervisor fetch: read from shared localStorage queue
      const submissions = JSON.parse(localStorage.getItem('perfbook_mock_submissions') || '[]');
      // Sort by submittedAt descending
      return submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    }
  }

  // ---- Fetch Detailed Daily Reports of a Member for Supervisor ----
  async function getMemberDailyReports(memberUid, year, month) {
    if (FirebaseAvailable) {
      const snapshot = await dbFirestore.collection('daily_reports')
        .where('uid', '==', memberUid)
        .where('year', '==', parseInt(year, 10))
        .where('month', '==', parseInt(month, 10))
        .get();

      const reports = [];
      snapshot.forEach(doc => {
        reports.push(doc.data());
      });
      return reports;
    } else {
      const mockDailies = JSON.parse(localStorage.getItem('perfbook_mock_daily_reports') || '[]');
      return mockDailies.filter(d => 
        d.uid === memberUid && 
        d.year === parseInt(year, 10) && 
        d.month === parseInt(month, 10)
      );
    }
  }

  // ---- Supervisor Update Feedback ----
  async function submitSupervisorFeedback(reportId, status, feedback) {
    if (FirebaseAvailable) {
      await dbFirestore.collection('monthly_reports').doc(reportId).update({
        status: status,
        supervisorFeedback: feedback,
        reviewedAt: new Date().toISOString()
      });
    } else {
      const submissions = JSON.parse(localStorage.getItem('perfbook_mock_submissions') || '[]');
      const index = submissions.findIndex(s => s.id === reportId);
      if (index !== -1) {
        submissions[index].status = status;
        submissions[index].supervisorFeedback = feedback;
        submissions[index].reviewedAt = new Date().toISOString();
        localStorage.setItem('perfbook_mock_submissions', JSON.stringify(submissions));
      }
    }
  }

  // ---- Supervisor Fetch All Registered Members ----
  async function getAllMembers() {
    if (FirebaseAvailable) {
      const snapshot = await dbFirestore.collection('users').get();
      const users = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        if (!d.isSupervisor && d.role !== 'supervisor') {
          users.push(d);
        }
      });
      return users;
    } else {
      const users = JSON.parse(localStorage.getItem('perfbook_mock_users') || '[]');
      return users.filter(u => !u.isSupervisor && u.role !== 'supervisor');
    }
  }

  // ---- Supervisor Update Member Role ----
  async function updateUserRole(uid, role) {
    if (FirebaseAvailable) {
      await dbFirestore.collection('users').doc(uid).update({ role });
    } else {
      const users = JSON.parse(localStorage.getItem('perfbook_mock_users') || '[]');
      const index = users.findIndex(u => u.uid === uid);
      if (index !== -1) {
        users[index].role = role;
        localStorage.setItem('perfbook_mock_users', JSON.stringify(users));
      }
    }
  }

  // ---- Submit Daily Reports to Supervisor ----
  async function submitDailyReports(year, month) {
    const user = Auth.getCurrentUser();
    if (!user) throw new Error("Authentication required to submit report");

    const dailyReports = await DB.getMonthlyReports(year, month);
    if (dailyReports.length === 0) {
      throw new Error("No daily report data found for this month to submit.");
    }

    // 1. Calculate totals from daily reports
    let mqTotalDays = 0;
    let mqAvgAyahSum = 0;
    
    let mhTotalDays = 0;
    let mhAvgSum = 0;
    
    let mlTotalPages = 0;
    let mlIslamic = 0;
    let mlOthers = 0;
    
    let maTotalDays = 0;
    let maTotalMinutes = 0;
    
    let mcMember = 0;
    let mcAssociate = 0;
    let mcWorker = 0;
    let mcSupporter = 0;
    let mcFriends = 0;
    let mcWellWisher = 0;
    let mcMeritorious = 0;
    let mcReader = 0;
    
    let mdDay = 0;
    let mdTotalMinutes = 0;
    
    let moTotalDays = 0;
    let moTotalMinutes = 0;
    
    let msTotalMinutes = 0;
    let msDays = 0;

    dailyReports.forEach(r => {
      // Quran
      const qs = parseInt(r.quranS, 10) || 0;
      const qt = parseInt(r.quranT, 10) || 0;
      if (qs > 0 || qt > 0) {
        mqTotalDays++;
        mqAvgAyahSum += (qs + qt);
      }
      
      // Hadith
      const hn = parseInt(r.hadithNum, 10) || 0;
      if (hn > 0) {
        mhTotalDays++;
        mhAvgSum += hn;
      }
      
      // Literature
      const li = parseInt(r.litI, 10) || 0;
      const lg = parseInt(r.litG, 10) || 0;
      mlIslamic += li;
      mlOthers += lg;
      mlTotalPages += (li + lg);
      
      // Academic
      const acadMins = App.timeToMinutes(r.academic);
      if (acadMins > 0) {
        maTotalDays++;
        maTotalMinutes += acadMins;
      }
      
      // Contacts
      mcMember += parseInt(r.contactM, 10) || 0;
      mcAssociate += parseInt(r.contactA, 10) || 0;
      mcWorker += parseInt(r.contactW, 10) || 0;
      mcSupporter += parseInt(r.contactS, 10) || 0;
      mcFriends += parseInt(r.contactF, 10) || 0;
      mcWellWisher += parseInt(r.contactWW, 10) || 0;
      mcMeritorious += parseInt(r.contactMS, 10) || 0;
      mcReader += parseInt(r.contactR, 10) || 0;
      
      // Dawah
      const dawahMins = App.timeToMinutes(r.dawah);
      if (dawahMins > 0) {
        mdDay++;
        mdTotalMinutes += dawahMins;
      }
      
      // Org Work
      const orgMins = App.timeToMinutes(r.orgWork);
      if (orgMins > 0) {
        moTotalDays++;
        moTotalMinutes += orgMins;
      }
      
      // Sleeping
      const sleepMins = App.timeToMinutes(r.sleeping);
      if (sleepMins > 0) {
        msDays++;
        msTotalMinutes += sleepMins;
      }
    });

    const mqAvgAyah = mqTotalDays > 0 ? Math.round(mqAvgAyahSum / mqTotalDays) : 0;
    const mhAvg = mhTotalDays > 0 ? Math.round(mhAvgSum / mhTotalDays) : 0;
    const maAvgHours = maTotalDays > 0 ? parseFloat((maTotalMinutes / maTotalDays / 60).toFixed(1)) : 0;
    const mdAvgHours = mdDay > 0 ? parseFloat((mdTotalMinutes / mdDay / 60).toFixed(1)) : 0;
    const moAvgHours = moTotalDays > 0 ? parseFloat((moTotalMinutes / moTotalDays / 60).toFixed(1)) : 0;
    const msAvgHours = msDays > 0 ? parseFloat((msTotalMinutes / msDays / 60).toFixed(1)) : 0;

    // Fetch existing monthly plan (if any) to preserve details like pledges, book names, financials
    const existingPlan = await DB.getMonthlyPlan(year, month) || {};

    const generatedPlan = {
      ...existingPlan,
      year: year,
      month: month,
      mqTotalDays: mqTotalDays,
      mqAvgAyah: mqAvgAyah,
      mhTotalDays: mhTotalDays,
      mhAvg: mhAvg,
      mlTotalPages: mlTotalPages,
      mlIslamic: mlIslamic,
      mlOthers: mlOthers,
      maTotalDays: maTotalDays,
      maAvgHours: maAvgHours,
      mcMember: mcMember,
      mcAssociate: mcAssociate,
      mcWorker: mcWorker,
      mcSupporter: mcSupporter,
      mcFriends: mcFriends,
      mcWellWisher: mcWellWisher,
      mcMeritorious: mcMeritorious,
      mcReader: mcReader,
      mdDay: mdDay,
      mdAvgHours: mdAvgHours,
      moTotalDays: moTotalDays,
      moAvgHours: moAvgHours,
      msAvgHours: msAvgHours,
    };

    // Save locally
    await DB.saveMonthlyPlan(generatedPlan);
    await DB.markMonthlySubmitted(year, month);

    // Sync/Submit online/offline using the monthly plan structure
    await submitMonthlyReport(generatedPlan);
  }

  async function getAllUsers() {
    const currentUser = Auth.getCurrentUser();
    const isAdmin = currentUser && (currentUser.isAdmin || currentUser.role === 'admin');
    if (!currentUser || !isAdmin) {
      throw new Error("Unauthorized. Admin role required.");
    }
    if (FirebaseAvailable) {
      const snapshot = await dbFirestore.collection('users').get();
      const users = [];
      snapshot.forEach(doc => {
        users.push(doc.data());
      });
      return users;
    } else {
      return JSON.parse(localStorage.getItem('perfbook_mock_users') || '[]');
    }
  }

  async function adminUpdateUser(uid, updates) {
    const currentUser = Auth.getCurrentUser();
    const isAdmin = currentUser && (currentUser.isAdmin || currentUser.role === 'admin');
    if (!currentUser || !isAdmin) {
      throw new Error("Unauthorized. Admin role required.");
    }
    if (FirebaseAvailable) {
      await dbFirestore.collection('users').doc(uid).update(updates);
    } else {
      const users = JSON.parse(localStorage.getItem('perfbook_mock_users') || '[]');
      const index = users.findIndex(u => u.uid === uid);
      if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        localStorage.setItem('perfbook_mock_users', JSON.stringify(users));
        
        // Also update session user if the modified user is currently logged in!
        const session = localStorage.getItem('perfbook_mock_session');
        if (session) {
          try {
            const parsed = JSON.parse(session);
            if (parsed.uid === uid) {
              const updatedSession = { ...parsed, ...updates };
              localStorage.setItem('perfbook_mock_session', JSON.stringify(updatedSession));
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }

  async function adminDeleteUser(uid) {
    const currentUser = Auth.getCurrentUser();
    const isAdmin = currentUser && (currentUser.isAdmin || currentUser.role === 'admin');
    if (!currentUser || !isAdmin) {
      throw new Error("Unauthorized. Admin role required.");
    }
    if (FirebaseAvailable) {
      // 1. Delete user profile document
      await dbFirestore.collection('users').doc(uid).delete();

      // 2. Delete all daily reports of this user
      const dailySnap = await dbFirestore.collection('daily_reports').where('uid', '==', uid).get();
      if (!dailySnap.empty) {
        const dailyBatch = dbFirestore.batch();
        dailySnap.forEach(doc => {
          dailyBatch.delete(doc.ref);
        });
        await dailyBatch.commit();
      }

      // 3. Delete all monthly reports/submissions of this user
      const monthlySnap = await dbFirestore.collection('monthly_reports').where('uid', '==', uid).get();
      if (!monthlySnap.empty) {
        const monthlyBatch = dbFirestore.batch();
        monthlySnap.forEach(doc => {
          monthlyBatch.delete(doc.ref);
        });
        await monthlyBatch.commit();
      }
    } else {
      let users = JSON.parse(localStorage.getItem('perfbook_mock_users') || '[]');
      users = users.filter(u => u.uid !== uid);
      localStorage.setItem('perfbook_mock_users', JSON.stringify(users));

      let mockDailies = JSON.parse(localStorage.getItem('perfbook_mock_daily_reports') || '[]');
      mockDailies = mockDailies.filter(d => d.uid !== uid);
      localStorage.setItem('perfbook_mock_daily_reports', JSON.stringify(mockDailies));

      let mockSubmissions = JSON.parse(localStorage.getItem('perfbook_mock_submissions') || '[]');
      mockSubmissions = mockSubmissions.filter(s => s.uid !== uid);
      localStorage.setItem('perfbook_mock_submissions', JSON.stringify(mockSubmissions));
    }
  }

  async function syncDownData() {
    if (!FirebaseAvailable) return false;
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (!user) return false;

    let hasChanges = false;
    
    const TRACKING_FIELDS = [
      'quranS', 'quranT', 'hadithNum', 'litI', 'litG', 'academic',
      'classT', 'classA', 'salatJamat', 'salatKaja',
      'contactM', 'contactA', 'contactW', 'contactS',
      'contactF', 'contactMS', 'contactWW', 'contactR',
      'dawah', 'orgWork', 'sleeping', 'socialMedia',
      'newsReading', 'exercise', 'selfEval'
    ];

    const MONTHLY_FIELDS = [
      'mqTotalDays', 'mqAvgAyah', 'mhTotalDays', 'mhAvg', 'mhMasnunDua', 'mhMakingDars', 'mhMemorized', 'mhSubject',
      'mlTotalPages', 'mlIslamic', 'mlOthers', 'mlName', 'maTotalDays', 'maAvgHours',
      'mcMember', 'mcAssociate', 'mcWorker', 'mcSupporter', 'mcFriends', 'mcWellWisher', 'mcMeritorious', 'mcReader',
      'mdDay', 'mdAvgHours', 'moTotalDays', 'moAvgHours', 'msAvgHours', 'msDays', 'msTotalMinutes',
      'mbPersonal', 'mbStudentWelfare', 'mbSwBox', 'mbTotalIncrease', 'mbTableBank', 'mbOthers',
      'selfEvalDays', 'exerciseDays', 'newsDays', 'status', 'supervisorFeedback'
    ];

    try {
      console.log("Starting loop-proof data sync down from Firestore...");

      // 1. Fetch user's daily reports from Firestore
      const dailySnap = await dbFirestore.collection('daily_reports')
        .where('uid', '==', user.uid)
        .get();

      if (!dailySnap.empty) {
        const localReports = [];
        dailySnap.forEach(doc => {
          localReports.push(doc.data());
        });

        for (const report of localReports) {
          const existing = await DB.getDailyReport(parseInt(report.year, 10), parseInt(report.month, 10), parseInt(report.day, 10));
          if (existing) {
            let diff = false;
            for (const field of TRACKING_FIELDS) {
              const val1 = String(report[field] ?? '');
              const val2 = String(existing[field] ?? '');
              if (val1 !== val2) {
                diff = true;
                break;
              }
            }
            if (diff) {
              const updatePayload = {};
              TRACKING_FIELDS.forEach(field => {
                if (report[field] !== undefined) {
                  updatePayload[field] = report[field];
                }
              });
              await db.daily_reports.update(existing.id, updatePayload);
              hasChanges = true;
            }
          } else {
            const cleanReport = { ...report };
            delete cleanReport.id;
            await db.daily_reports.add(cleanReport);
            hasChanges = true;
          }
        }
      }

      // 2. Fetch user's monthly plans/reports from Firestore
      const monthlySnap = await dbFirestore.collection('monthly_reports')
        .where('uid', '==', user.uid)
        .get();

      if (!monthlySnap.empty) {
        const localMonthly = [];
        monthlySnap.forEach(doc => {
          localMonthly.push(doc.data());
        });

        for (const plan of localMonthly) {
          const existing = await DB.getMonthlyPlan(parseInt(plan.year, 10), parseInt(plan.month, 10));
          if (existing) {
            let diff = false;
            for (const field of MONTHLY_FIELDS) {
              const val1 = String(plan[field] ?? '');
              const val2 = String(existing[field] ?? '');
              if (val1 !== val2) {
                diff = true;
                break;
              }
            }
            if (diff) {
              const updatePayload = {};
              MONTHLY_FIELDS.forEach(field => {
                if (plan[field] !== undefined) {
                  updatePayload[field] = plan[field];
                }
              });
              await db.monthly_plans.update(existing.id, updatePayload);
              hasChanges = true;
            }
          } else {
            const cleanPlan = { ...plan };
            delete cleanPlan.id;
            await db.monthly_plans.add(cleanPlan);
            hasChanges = true;
          }
        }
      }

      console.log("Data sync down completed. Changes merged:", hasChanges);
      return hasChanges;
    } catch (err) {
      console.error("Error during data sync down:", err);
      return false;
    }
  }

  return {
    submitMonthlyReport,
    getSubmittedReportsForSupervisor,
    getMemberDailyReports,
    submitSupervisorFeedback,
    getAllMembers,
    updateUserRole,
    submitDailyReports,
    getMemberSubmissions,
    getAllUsers,
    adminUpdateUser,
    adminDeleteUser,
    syncDownData
  };
})();

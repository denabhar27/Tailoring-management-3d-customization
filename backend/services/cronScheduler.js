

const rentalMonitoringService = require('./rentalMonitoringService');

let intervals = {
  hourlyCheck: null,
  dailyCheck: null
};

let isRunning = false;

function initializeScheduler() {
  if (isRunning) {
    console.log('[CRON SCHEDULER] Scheduler already running');
    return;
  }

  console.log('[CRON SCHEDULER] Initializing rental monitoring scheduler...');

  runStartupCheck();

  const HOUR_IN_MS = 60 * 60 * 1000;
  intervals.hourlyCheck = setInterval(() => {
    console.log('[CRON SCHEDULER] Running hourly rental check...');
    rentalMonitoringService.checkOverdueRentals()
      .then(result => {
        console.log(`[CRON SCHEDULER] Hourly check complete: ${result.overdueCount} overdue rentals found`);
      })
      .catch(err => {
        console.error('[CRON SCHEDULER] Hourly check failed:', err);
      });
  }, HOUR_IN_MS);

  const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;
  intervals.dailyCheck = setInterval(() => {
    console.log('[CRON SCHEDULER] Running scheduled rental reminder check...');
    rentalMonitoringService.runAllChecks()
      .then(result => {
        console.log(`[CRON SCHEDULER] Scheduled check complete:`, result);
      })
      .catch(err => {
        console.error('[CRON SCHEDULER] Scheduled check failed:', err);
      });
  }, SIX_HOURS_IN_MS);

  isRunning = true;
  console.log('[CRON SCHEDULER] ✅ Scheduler initialized successfully');
  console.log('[CRON SCHEDULER] - Hourly overdue check: Every 1 hour');
  console.log('[CRON SCHEDULER] - Rental reminder check: Every 6 hours');
}

async function runStartupCheck() {
  console.log('[CRON SCHEDULER] Running startup rental check...');
  
  try {
    const result = await rentalMonitoringService.runAllChecks();
    console.log('[CRON SCHEDULER] Startup check completed:', result);
  } catch (error) {
    console.error('[CRON SCHEDULER] Startup check failed:', error);
  }
}

function stopScheduler() {
  console.log('[CRON SCHEDULER] Stopping scheduler...');

  if (intervals.hourlyCheck) {
    clearInterval(intervals.hourlyCheck);
    intervals.hourlyCheck = null;
  }

  if (intervals.dailyCheck) {
    clearInterval(intervals.dailyCheck);
    intervals.dailyCheck = null;
  }

  isRunning = false;
  console.log('[CRON SCHEDULER] Scheduler stopped');
}

function getSchedulerStatus() {
  return {
    isRunning,
    hourlyCheckActive: !!intervals.hourlyCheck,
    dailyCheckActive: !!intervals.dailyCheck
  };
}

async function triggerManualCheck() {
  console.log('[CRON SCHEDULER] Manual check triggered');
  return await rentalMonitoringService.runAllChecks();
}

module.exports = {
  initializeScheduler,
  stopScheduler,
  getSchedulerStatus,
  triggerManualCheck,
  runStartupCheck
};

// Property 7: Order timeline step ordering
// Validates: Requirements 12.2, 7.15
'use strict';

const fc = require('fast-check');

const TIMELINE_STEPS = ['Paid', 'Preparing', 'Shipped', 'Delivered'];

function getTimelineStepState(status, stepName) {
  const currentIdx = TIMELINE_STEPS.indexOf(status);
  const stepIdx    = TIMELINE_STEPS.indexOf(stepName);
  if (currentIdx === -1 || stepIdx === -1) return 'muted';
  if (stepIdx < currentIdx)  return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'muted';
}

const timelineStatusArb = fc.constantFrom(...TIMELINE_STEPS);

var p7Passed = false;
try {
  fc.assert(
    fc.property(timelineStatusArb, function (status) {
      const currentIdx = TIMELINE_STEPS.indexOf(status);
      for (var j = 0; j < currentIdx; j++) {
        if (getTimelineStepState(status, TIMELINE_STEPS[j]) !== 'done') return false;
      }
      if (getTimelineStepState(status, status) !== 'active') return false;
      for (var k = currentIdx + 1; k < TIMELINE_STEPS.length; k++) {
        if (getTimelineStepState(status, TIMELINE_STEPS[k]) !== 'muted') return false;
      }
      var activeCount = TIMELINE_STEPS.filter(s => getTimelineStepState(status, s) === 'active').length;
      if (activeCount !== 1) return false;
      var doneCount  = TIMELINE_STEPS.filter(s => getTimelineStepState(status, s) === 'done').length;
      if (doneCount !== currentIdx) return false;
      return true;
    }),
    { numRuns: 1000 }
  );
  p7Passed = true;
  console.log('✅ Property 7 PASSED: Order timeline step ordering');
} catch (err) {
  console.error('❌ Property 7 FAILED:', err.message);
}

var p7UnknownPassed = false;
try {
  fc.assert(
    fc.property(
      fc.string().filter(s => !TIMELINE_STEPS.includes(s)),
      function (unknownStatus) {
        return TIMELINE_STEPS.every(step => getTimelineStepState(unknownStatus, step) === 'muted');
      }
    ),
    { numRuns: 500 }
  );
  p7UnknownPassed = true;
  console.log('✅ Property 7 (unknown status) PASSED: all steps muted for unknown status');
} catch (err) {
  console.error('❌ Property 7 (unknown status) FAILED:', err.message);
}

if (p7Passed && p7UnknownPassed) {
  console.log('\n✅ All order-timeline property tests passed.');
  process.exit(0);
} else {
  console.error('\n❌ One or more order-timeline property tests failed.');
  process.exit(1);
}

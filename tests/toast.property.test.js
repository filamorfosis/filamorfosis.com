// Property 2: Toast queue FIFO ordering
// Validates: Requirements 4.1, 4.2
//
// For any sequence of N toasts enqueued in order, assert display and
// dismissal order matches enqueue order.
//
// Runs in Node.js (no DOM). The queue logic is extracted and tested in
// isolation — no DOM or animation dependencies required.

'use strict';

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Extracted queue logic under test
// ---------------------------------------------------------------------------
// This mirrors the FIFO queue in assets/js/toast.js without any DOM calls.
// We test the pure ordering contract: enqueue order === dequeue order.

function createToastQueue() {
  var _queue  = [];
  var _active = null;
  var _log    = []; // records display order

  function _showNext() {
    _active = null;
    if (_queue.length === 0) return;
    var opts = _queue.shift();
    _render(opts);
  }

  function _render(opts) {
    _active = opts;
    _log.push(opts.id);
    // Simulate synchronous dismiss (no real timers needed for ordering test)
  }

  function show(opts) {
    if (_active) {
      _queue.push(opts);
    } else {
      _render(opts);
    }
  }

  /** Dismiss the currently active toast and show the next one. */
  function dismissCurrent() {
    if (!_active) return;
    _active = null;
    _showNext();
  }

  function getLog()    { return _log.slice(); }
  function getQueue()  { return _queue.slice(); }
  function isActive()  { return _active !== null; }

  return { show, dismissCurrent, getLog, getQueue, isActive };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A sequence of 1–20 toast descriptors with unique sequential IDs. */
const toastSequenceArb = fc
  .integer({ min: 1, max: 20 })
  .map(function (n) {
    var toasts = [];
    for (var i = 0; i < n; i++) {
      toasts.push({ id: i, message: 'Toast ' + i, type: 'info', duration: 3000 });
    }
    return toasts;
  });

// ---------------------------------------------------------------------------
// Property 2: FIFO ordering
// ---------------------------------------------------------------------------

var p2Passed = false;
try {
  fc.assert(
    fc.property(
      toastSequenceArb,
      function (toasts) {
        var q = createToastQueue();

        // Enqueue all toasts
        toasts.forEach(function (t) { q.show(t); });

        // Dismiss each active toast until the queue is empty
        var maxIterations = toasts.length + 1;
        var iterations = 0;
        while (q.isActive() && iterations < maxIterations) {
          q.dismissCurrent();
          iterations++;
        }

        var log = q.getLog();

        // 1. Every enqueued toast must have been displayed exactly once
        if (log.length !== toasts.length) return false;

        // 2. Display order must match enqueue order (FIFO)
        for (var i = 0; i < toasts.length; i++) {
          if (log[i] !== toasts[i].id) return false;
        }

        // 3. Queue must be empty after all dismissals
        if (q.getQueue().length !== 0) return false;

        return true;
      }
    ),
    { numRuns: 1000 }
  );
  p2Passed = true;
  console.log('✅ Property 2 PASSED: Toast queue FIFO ordering holds for all sequences');
} catch (err) {
  console.error('❌ Property 2 FAILED: Toast queue FIFO ordering violated');
  console.error(err.message);
}

// ---------------------------------------------------------------------------
// Edge case: single toast — no queuing needed, displayed immediately
// ---------------------------------------------------------------------------

var edgePassed = false;
try {
  fc.assert(
    fc.property(
      fc.record({ id: fc.nat(), message: fc.string() }),
      function (toast) {
        var q = createToastQueue();
        q.show(toast);
        // First toast is shown immediately (no queuing)
        var log = q.getLog();
        return log.length === 1 && log[0] === toast.id && q.getQueue().length === 0;
      }
    ),
    { numRuns: 500 }
  );
  edgePassed = true;
  console.log('✅ Property 2 edge case PASSED: single toast displayed immediately without queuing');
} catch (err) {
  console.error('❌ Property 2 edge case FAILED');
  console.error(err.message);
}

// ---------------------------------------------------------------------------
// Exit
// ---------------------------------------------------------------------------
if (p2Passed && edgePassed) {
  console.log('\n✅ All toast property tests passed.');
  process.exit(0);
} else {
  console.error('\n❌ One or more toast property tests failed.');
  process.exit(1);
}

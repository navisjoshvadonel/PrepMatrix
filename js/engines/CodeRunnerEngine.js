/**
 * CodeRunnerEngine.js
 * In-browser sandbox code executor and test-case verification engine.
 * Supports evaluating JavaScript solutions against structured test suites.
 * Protected by Web Worker execution and 3-second timeout guard.
 */

export const CODING_CHALLENGES = {
  twoSum: {
    id: 'twoSum',
    title: 'Two Sum Optimal (O(n))',
    difficulty: 'Easy',
    topic: 'Arrays & Hash Maps',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. Assume each input has exactly one solution.',
    starterCode: `function twoSum(nums, target) {
  // Write your O(n) solution using a Hash Map
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] }
    ]
  },
  reverseLinkedList: {
    id: 'reverseLinkedList',
    title: 'Reverse Array In-Place',
    difficulty: 'Easy',
    topic: 'Two Pointers',
    description: 'Write a function that reverses an array of characters in-place without allocating extra array space.',
    starterCode: `function reverseString(s) {
  let left = 0, right = s.length - 1;
  while (left < right) {
    const temp = s[left];
    s[left] = s[right];
    s[right] = temp;
    left++;
    right--;
  }
  return s;
}`,
    testCases: [
      { input: [['h','e','l','l','o']], expected: ['o','l','l','e','h'] },
      { input: [['H','a','n','n','a','h']], expected: ['h','a','n','n','a','H'] }
    ]
  },
  validParentheses: {
    id: 'validParentheses',
    title: 'Valid Parentheses Bracket Matcher',
    difficulty: 'Medium',
    topic: 'Stacks & Core Logic',
    description: 'Given a string `s` containing just characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.',
    starterCode: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (let char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.pop() !== map[char]) return false;
    }
  }
  return stack.length === 0;
}`,
    testCases: [
      { input: ['()[]{}'], expected: true },
      { input: ['(]'], expected: false },
      { input: ['([{}])'], expected: true }
    ]
  }
};

export class CodeRunnerEngine {
  /**
   * Execute code string against specified challenge test cases.
   * Runs in Web Worker if available with 3-second hard timeout.
   * @param {string} codeStr
   * @param {string} challengeId
   * @param {number} [timeoutMs=3000]
   * @returns {Promise<Object>}
   */
  async execute(codeStr, challengeId, timeoutMs = 3000) {
    const challenge = CODING_CHALLENGES[challengeId] || CODING_CHALLENGES.twoSum;
    const startTime = performance.now();

    // Web Worker sandbox with 3s hard timeout
    if (typeof Worker !== 'undefined' && typeof Blob !== 'undefined') {
      return new Promise((resolve) => {
        const workerScript = `
          self.onmessage = function(e) {
            const { codeStr, testCases } = e.data;
            try {
              const wrappedCode = \`
                \${codeStr}
                return (typeof twoSum !== 'undefined' ? twoSum : typeof reverseString !== 'undefined' ? reverseString : isValid);
              \`;
              const fn = new Function(wrappedCode)();
              if (typeof fn !== 'function') {
                self.postMessage({ success: false, error: 'Could not find entry function. Ensure function name matches problem signature.' });
                return;
              }
              const results = [];
              let allPassed = true;
              for (let i = 0; i < testCases.length; i++) {
                const tc = testCases[i];
                const inputCopy = JSON.parse(JSON.stringify(tc.input));
                const t0 = performance.now();
                const actual = fn(...inputCopy);
                const elapsed = (performance.now() - t0).toFixed(2);
                const passed = JSON.stringify(actual) === JSON.stringify(tc.expected);
                if (!passed) allPassed = false;
                results.push({
                  caseNum: i + 1,
                  passed,
                  input: JSON.stringify(tc.input),
                  expected: JSON.stringify(tc.expected),
                  actual: JSON.stringify(actual),
                  timeMs: elapsed
                });
              }
              self.postMessage({ success: true, allPassed, results, error: null });
            } catch (err) {
              self.postMessage({ success: false, error: err.message });
            }
          };
        `;

        let worker;
        let workerUrl;
        try {
          const blob = new Blob([workerScript], { type: 'application/javascript' });
          workerUrl = URL.createObjectURL(blob);
          worker = new Worker(workerUrl);
        } catch {
          // If Blob/Worker instantiation blocked, fallback to sync execution
          return resolve(this._executeSync(codeStr, challenge, startTime));
        }

        let isDone = false;
        const timer = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            resolve({
              success: false,
              allPassed: false,
              results: [],
              totalTimeMs: timeoutMs,
              error: `Execution timed out (> ${timeoutMs / 1000}s). Check for infinite loops or heavy operations.`
            });
          }
        }, timeoutMs);

        worker.onmessage = (e) => {
          if (!isDone) {
            isDone = true;
            clearTimeout(timer);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            const totalElapsed = (performance.now() - startTime).toFixed(2);
            resolve({
              ...e.data,
              totalTimeMs: totalElapsed
            });
          }
        };

        worker.onerror = (err) => {
          if (!isDone) {
            isDone = true;
            clearTimeout(timer);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            resolve({
              success: false,
              allPassed: false,
              results: [],
              totalTimeMs: (performance.now() - startTime).toFixed(2),
              error: err.message || 'Sandbox execution error'
            });
          }
        };

        worker.postMessage({ codeStr, testCases: challenge.testCases });
      });
    }

    // Direct synchronous fallback
    return Promise.resolve(this._executeSync(codeStr, challenge, startTime));
  }

  _executeSync(codeStr, challenge, startTime) {
    const results = [];
    let allPassed = true;

    try {
      const wrappedCode = `
        ${codeStr}
        return (typeof twoSum !== 'undefined' ? twoSum : typeof reverseString !== 'undefined' ? reverseString : isValid);
      `;
      const fn = new Function(wrappedCode)();

      if (typeof fn !== 'function') {
        throw new Error('Could not find entry function. Ensure function name matches problem signature.');
      }

      for (let i = 0; i < challenge.testCases.length; i++) {
        const tc = challenge.testCases[i];
        const inputCopy = JSON.parse(JSON.stringify(tc.input));
        const t0 = performance.now();
        const actual = fn(...inputCopy);
        const elapsed = (performance.now() - t0).toFixed(2);

        const passed = JSON.stringify(actual) === JSON.stringify(tc.expected);
        if (!passed) allPassed = false;

        results.push({
          caseNum: i + 1,
          passed,
          input: JSON.stringify(tc.input),
          expected: JSON.stringify(tc.expected),
          actual: JSON.stringify(actual),
          timeMs: elapsed
        });
      }

      const totalElapsed = (performance.now() - startTime).toFixed(2);
      return {
        success: true,
        allPassed,
        results,
        totalTimeMs: totalElapsed,
        error: null
      };
    } catch (err) {
      return {
        success: false,
        allPassed: false,
        results: [],
        totalTimeMs: 0,
        error: err.message
      };
    }
  }
}

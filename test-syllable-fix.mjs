// Test syllable segmentation fix
import { segmentIntoSyllables } from '../src/lib/sylbreak';

const testCases = [
    { input: 'နှင့်', expected: ['နှင့်'] },
    { input: 'ကျင့်', expected: ['ကျင့်'] },
    { input: 'ခွင့်', expected: ['ခွင့်'] },
    { input: 'ဖြင့်', expected: ['ဖြင့်'] },
    { input: 'လုပ်ပိုင်ခွင့်', expected: ['လုပ်', 'ပိုင်', 'ခွင့်'] },
    { input: 'နှင့် သတ္တု', expected: ['နှင့်', 'သတ္တု'] },
    { input: 'ကျင့်သုံး', expected: ['ကျင့်', 'သုံး'] },
];

console.log('Testing Syllable Segmentation Fix\n' + '='.repeat(50));

let passCount = 0;
let failCount = 0;

for (const testCase of testCases) {
    const result = segmentIntoSyllables(testCase.input);
    const resultStr = result.join(' ');
    const expectedStr = testCase.expected.join(' ');
    const passed = resultStr === expectedStr;

    if (passed) {
        console.log(`✅ PASS: "${testCase.input}"`);
        console.log(`   Result: [${result.join(', ')}]`);
        passCount++;
    } else {
        console.log(`❌ FAIL: "${testCase.input}"`);
        console.log(`   Expected: [${testCase.expected.join(', ')}]`);
        console.log(`   Got:      [${result.join(', ')}]`);
        failCount++;
    }
    console.log('');
}

console.log('='.repeat(50));
console.log(`Summary: ${passCount} passed, ${failCount} failed out of ${testCases.length} tests`);
console.log(failCount === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed');

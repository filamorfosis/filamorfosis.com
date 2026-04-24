using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

var path = "assets/js/main.js";
var text = File.ReadAllText(path, Encoding.UTF8);

// Strategy: find all translation string values that contain literal newlines
// Pattern: key: 'value\n...continuation...',
// These are property assignments where the string spans multiple lines
// Replace the entire multi-line value with ''

// Match: (whitespace)(word): '(anything including newlines, non-greedy)',
var pattern = new Regex(
    @"^([ \t]+)([\w_]+):\s*'([^']*\n[^']*)',",
    RegexOptions.Multiline
);

int count = 0;
var result = pattern.Replace(text, m => {
    count++;
    Console.WriteLine($"FIXED multiline [{m.Groups[2].Value}] at char {m.Index}");
    return m.Groups[1].Value + m.Groups[2].Value + ": '',";
});

// Also fix lines where the value contains an unescaped single quote
// Pattern: key: 'stuff'morestuff',  (3+ quotes in value)
var pattern2 = new Regex(
    @"^([ \t]+)([\w_]+):\s*'[^'\n]*'[^,\n][^'\n]*',",
    RegexOptions.Multiline
);

int count2 = 0;
result = pattern2.Replace(result, m => {
    count2++;
    Console.WriteLine($"FIXED embedded-quote [{m.Groups[2].Value}]");
    return m.Groups[1].Value + m.Groups[2].Value + ": '',";
});

// Fix lines ending with ' but no comma (split across lines, second part already gone)
var pattern3 = new Regex(
    @"^([ \t]+)([\w_]+):\s*'[^'\n]*'\s*$",
    RegexOptions.Multiline
);

int count3 = 0;
result = pattern3.Replace(result, m => {
    count3++;
    Console.WriteLine($"FIXED no-comma [{m.Groups[2].Value}]");
    return m.Groups[1].Value + m.Groups[2].Value + ": '',";
});

File.WriteAllText(path, result, Encoding.UTF8);
Console.WriteLine($"\nDone. Multiline: {count}, EmbeddedQuote: {count2}, NoComma: {count3}");
